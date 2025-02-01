from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
import json
from openai import OpenAI
import os
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
