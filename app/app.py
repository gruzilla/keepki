from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room
import json
import os
import re
import random
from dotenv import load_dotenv
from openai import OpenAI

app = Flask(__name__)
# First, try to read from existing environment variables
secret_key = os.environ.get("FLASK_SECRET")
openai_key = os.environ.get("OPENAI_API_KEY")
app.config['SECRET_KEY'] = secret_key
# If not found, load the .env file and then try again
if not openai_key:
    load_dotenv()  # This will set variables from .env if they're not already set
    openai_key = os.getenv("OPENAI_API_KEY")
    secret_key = os.getenv("FLASK_SECRET")

socketio = SocketIO(app)
# Set your OpenAI API Key
openAIClient = OpenAI(
    api_key=openai_key
)

# Global application state
global app_state, sessionStructure, games;
app_state = {
    "sessionIds": [],
    "sessions": {}
}
sessionStructure = {
    "sessionId" : "",
    "players": {},
    "round": 1,
    "difficulty": "Einfach"
}
with open('games.json') as f:
    games = json.load(f)


@app.route('/')
def index():
    # Simple landing page listing roles
    return """
    <h1>Select Screen</h1>
    <ul>
      <li><a href="/player">Spiel beitreten</a></li>
      <li><a href="/board">Spiel starten</a></li>
    </ul>
    """

@app.route('/player')
def player():
    return render_template('player.html')

@app.route('/board')
def board():
    return render_template('board.html')

@app.route('/admin')
def admin():
    return render_template('admin.html')



## functions to establish websocket connections

# On client connect, send the current state
@socketio.on('connect')
def handle_connect():
    global app_state
    print("connect", request.sid)

# On client connect, send the current state
@socketio.on('disconnect')
def handle_disconnect():
    global app_state
    print("handle_disconnect", request.sid)
    connectionId = request.sid
    for sessionId in app_state["sessions"]:
        print("looking for sid in players")
        if connectionId in app_state["sessions"][sessionId]["players"]:
            print("found", connectionId)
            del app_state["sessions"][sessionId]["players"][connectionId]
            sendPlayersToBoard(sessionId)


# Example event to handle participant suggestions or answers from clients
@socketio.on('join_session')
def handle_player_action(sessionId):
    global app_state
    print("join session")
    print(sessionId)
    join_room(sessionId)

@socketio.on('register_board')
def handle_create_session(data):
    global app_state
    print("create session")
    print(data)
    sessionId = data["sessionId"]

    if sessionId not in app_state["sessionIds"]:
        sessionData = sessionStructure.copy()
        sessionData["sessionId"] = sessionId
        app_state["sessionIds"].append(sessionId)
        app_state["sessions"][sessionId] = sessionData

    sendPlayersToBoard(sessionId)

@socketio.on('set_difficulty')
def handle_set_difficulty(data):
    global app_state
    print("set difficulty")
    print(data)
    sessionId = data["sessionId"]
    difficulty = data["data"]
    app_state["sessions"][sessionId]["difficulty"] = difficulty

    sendDifficultyToplayers(sessionId, difficulty)


@socketio.on('register_user')
def handle_register_user(data):
    global app_state
    print("register user")
    print(data)
    connectionId = request.sid
    sessionId = data["sessionId"]
    userName = data["data"]
    if len(app_state["sessions"][sessionId]["players"]) == 4:
        print("already enough users")
        return

    if connectionId not in app_state["sessions"][sessionId]["players"]:
        print("registering new user")

    app_state["sessions"][sessionId]["players"][connectionId] = userName
    sendPlayersToBoard(sessionId)

@socketio.on('start_game')
def handle_start_game(data):
    global app_state, games

    print("starting game")
    print(data)

    sessionId = data["sessionId"]
    difficulty = app_state["sessions"][sessionId]["difficulty"]

    if len(app_state["sessions"][sessionId]["players"]) != 4:
        print("needs four players!")
        return;

    fGames = [game for game in games["dktm"] if game["schwierigkeit"] == difficulty]
    dGames = random.sample(fGames, len(fGames))
    dGames = dGames[:len(app_state["sessions"][sessionId]["players"])]

    playerIds = list(app_state["sessions"][sessionId]["players"].keys())

    i = 0
    for connectionId in playerIds:
        dGames[i]["round1"] = connectionId
        i=i+1
    playerIds = playerIds[1:] + [playerIds[0]]
    i = 0
    for connectionId in playerIds:
        dGames[i]["round2"] = connectionId
        i=i+1
    playerIds = playerIds[1:] + [playerIds[0]]
    i = 0
    for connectionId in playerIds:
        dGames[i]["round3"] = connectionId
        i=i+1
    i = 0
    playerIds = playerIds[1:] + [playerIds[0]]
    for connectionId in playerIds:
        dGames[i]["round4"] = connectionId
        i=i+1

    for g in dGames:
        g["answersRound1"] = callAi(g["prompt1"])
        g["answersRound2"] = callAi(g["prompt2"])
        g["answersRound3"] = callAi(g["prompt3"])

    app_state["sessions"][sessionId]["games"] = dGames
    print(app_state["sessions"][sessionId]["games"])

    socketio.emit('start_game', app_state["sessions"][sessionId]["games"], to=sessionId)


@socketio.on('choose_answer')
def handle_choose_answer(data):
    global app_state, games

    print("storing choice of answer")
    print(data)

    sessionId = data["sessionId"]
    cRound = app_state["sessions"][sessionId]["round"]
    for g in app_state["sessions"][sessionId]["games"]:
        if g["round" + str(cRound)] == request.sid:
            print("stored answer ", data["data"]["answer"], " in", "round" + str(cRound), "for", request.sid)
            g["choiceRound" + str(cRound)] = data["data"]["answer"]

    cA = 0
    for g in app_state["sessions"][sessionId]["games"]:
        if "choiceRound" + str(cRound) in g:
            cA += 1

    if cA == 4:
        if app_state["sessions"][sessionId]["round"] == 3:
            print("game is now finished, all transformed texts are collecte")

            # find enough possible answers, using the categories from session games and more
            answers = []
            for g in app_state["sessions"][sessionId]["games"]:
                answers.append(g["ursprung"])

            print("these sources are there:", answers)

            for g2 in games["dktm"]:
                fi = None
                try:
                    print("looking for ", g2["ursprung"])
                    fi = answers.index(g2["ursprung"])
                except ValueError:
                    fi = None

                if len(answers) < 8 and fi == None:
                    answers.append(g2["ursprung"])

            socketio.emit('results', {
                "games": app_state["sessions"][sessionId]["games"],
                "answers": answers
            }, to=sessionId)
        else:
            app_state["sessions"][sessionId]["round"] = cRound + 1
            socketio.emit('advance_round', app_state["sessions"][sessionId]["games"], to=sessionId)
            socketio.emit('update_waiting', 0, to=sessionId)
    else:
        socketio.emit('update_waiting', cA, to=sessionId)

@socketio.on('choose_source')
def handle_choose_source(data):
    global app_state, games

    print("storing choice of source")
    print(data)

    sessionId = data["sessionId"]

    fGame = None
    for game in games["dktm"]:
        print(game)
        if "round4" in game and game["round4"] == request.sid:
            fGame = game

    if fGame == None:
        print("game not found for player " + request.id)
        return

    print("found round4 game for player, player chose ", data["data"]["source"], " game has ", fGame["ursprung"])
    fGame["userSource"] = data["data"]["source"];
    fGame["truth"] = (data["data"]["source"] == fGame["ursprung"]);
    print(app_state["sessions"][sessionId]["games"]);
    socketio.emit("update_results", app_state["sessions"][sessionId]["games"]);
    

def callAi(prompt):
    # Call the OpenAI API to get an answer (example using gpt-3.5-turbo)
    try:
        completion = openAIClient.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "system", "content": "Du bist eine freundliche deutsch antwortende künstliche Intelligenz."},
                      {"role": "user", "content": prompt}],
            max_tokens=150,
            temperature=0.7
        )
        print(completion)
        answer = completion.choices[0].message.content.strip();
        return [
            re.sub(r'^(Alternative )?\d+\.?\s+', '', line)  # Remove the pattern at the beginning of each line
            for line in answer.split("\n") 
            if line and (line[0].isdigit() or line[0].startswith("Alternative "))  # Filter lines that start with a digit
        ]
    except Exception as e:
        return str(e)


def sendPlayersToBoard(sessionId):
    global app_state
    print("emitting update_palyers to ", sessionId)
    socketio.emit('update_players', app_state["sessions"][sessionId]["players"], to=sessionId)

def sendDifficultyToplayers(sessionId, difficulty):
    print("emitting update_difficulty to ", sessionId)
    socketio.emit('update_difficulty', difficulty, to=sessionId);


if __name__ == '__main__':
    print("running socket io server")
    socketio.run(app, debug=True, host='0.0.0.0')