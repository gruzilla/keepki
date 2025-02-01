from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
import json
import os
import requests
from dotenv import load_dotenv

app = Flask(__name__)
# First, try to read from existing environment variables
secret_key = os.environ.get("FLASK_SECRET")
app.config['SECRET_KEY'] = secret_key
socketio = SocketIO(app)


# Global application state
global app_state;
app_state = {
    "games": [1234],
    "gamePhase": {1234:"waitingForPlayers"}
}

@app.route('/')
def index():
    # Simple landing page listing roles
    return """
    <h1>Select Screen</h1>
    <ul>
      <li><a href="/player">Player</a></li>
      <li><a href="/board">Board</a></li>
      <li><a href="/admin">Behind the Board</a></li>
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




## functions to interact with the api

def get_response_from_api(message):
    url = "http://api:8080/v1/chat/completions"
    headers = {"Content-Type": "application/json"}
    payload = {
        "model": "bakllava-mmproj",
        "messages": [{"role": "user", "content": message, "temperature": 0.1}]
    }

    try:
        response = requests.post(url, json=payload, headers=headers).json()
        choices = response.get('choices', [])
        if choices:
            bot_message = choices[0].get('message', {}).get('content', "Sorry I don't understand")
        else:
            bot_message = "Sorry I don't understand"
    except Exception as e:
        print(f"An exception occurred: {e}")
        bot_message = "Sorry, I'm unable to reach the server right now."

    return bot_message

def chat_with_bot(message, chat_history):
    bot_message = get_response_from_api(message)
    chat_history.append((message, bot_message))
    return "", chat_history