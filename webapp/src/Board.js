import QRCode from 'qrcode'
import Socketable from "./Socketable.js";

export default class Board extends Socketable {
	sessionId;
	phase = "collectingPlayers";
	// collectingPlayers -> showTutorial1 -> showTutorialn -> showResults1 -> showResultsn 

	constructor(serverUrl) {
        super(serverUrl); // Call the parent class (Socketable)

        this.loadSessionId();
		this.renderPhases();

		this.on("update_players", (connectionId, data) => {
			console.log("received update_players");
			console.log(data);
			let players = document.getElementById("players");
			players.innerHTML = "";

			for (var i in data) {
				let li = document.createElement("li");
				li.innerText = data[i];
				players.appendChild(li);
			}
		});

		this.on("start_game", (connectionId, games) => {
			document.getElementById("loading").style.display = "none";
		});

		this.on("update_waiting", (connectionId, amount) => {
			document.getElementById("waiting").innerText = 4-parseInt(amount);
		});

		this.on("results", (connectionId, data) => {
			this.phase = "results";
			this.renderPhases(data);
		});

		this.on("update_results", (connectionId, games) => {
			this.phase = "results";
			this.renderPhases({"games": games});
		});

 	}

	loadSessionId() {
		let sessionId = window.sessionStorage.getItem("sessionId");
		if (sessionId === null) {
			sessionId = crypto.randomUUID();
			window.sessionStorage.setItem("sessionId", sessionId);
		}

		this.sessionId = sessionId;
		this.on("connect", () => {
			console.log("board is joing session ", this.sessionId);
			this.joinSession(this.sessionId);
			this.emit("register_board");
		});
	}

	renderPhases(data) {
		let collectingPlayers = document.getElementById("collectingPlayers");
		let round = document.getElementById("round");
		let results = document.getElementById("results");

		if (this.phase === "collectingPlayers") {
			collectingPlayers.style.display = "block";
			round.style.display = "none";
			results.style.display = "none";
			this.renderCollectingPlayers();
		}
		if (this.phase === "round") {
			collectingPlayers.style.display = "none";
			round.style.display = "block";
			results.style.display = "none";
		}
		if (this.phase === "results") {
			collectingPlayers.style.display = "none";
			round.style.display = "none";
			results.style.display = "block";
			this.renderResults(data);
		}
	}

	renderCollectingPlayers() {
		let qrCode = document.getElementById("qrCode");
		let difficulty = document.getElementById("difficulty");
		let startGame = document.getElementById("startGameBtn");
		let url = window.location.origin + "/player?session=" + this.sessionId;

		document.getElementById("qrCodeLink").href = url;
		QRCode.toDataURL(url)
		  .then(url => {
		  	console.log(url);
		    qrCode.src = url;
		  })
		  .catch(err => {
		    console.error(err);
		  });

		difficulty.onchange = () => {
			let difficultyLevel = difficulty.value;
			this.emit("set_difficulty", difficultyLevel);
		}

		startGame.onclick = () => {
			this.emit("start_game");
			this.phase = "round";
			this.renderPhases();
		}
	}

	renderResults(data) {
		console.log("rendering Results", data);
		let tabs = document.getElementsByTagName("table");
		for (var i = 0; i < data.games.length; i++) {
			let td = tabs[i].getElementsByTagName("td");
			td[0].innerText = data.games[i]["choiceRound1"]; // t1
			td[1].innerText = data.games[i]["choiceRound2"]; // t2
			td[2].innerText = data.games[i]["choiceRound3"]; // t3
			// 3

			if ("userSource" in data.games[i]) {
				td[4].innerText = data.games[i]["userSource"]; // quellen tip
			}
			else {
				td[4].innerText = "?"; // quellen tip
			}

			if ("truth" in data.games[i]) {
				td[5].innerText = data.games[i]["truth"] ? ":) WAHR!" : ":( falsch"; // truth
				td[6].innerText = data.games[i]["message_part1"]; // ot1
				td[7].innerText = data.games[i]["message_part2"]; // ot1
				td[8].innerText = data.games[i]["message_part3"]; // ot1
				// 9
				td[10].innerText = data.games[i]["ursprung"]; // o quelle
			} else {
				td[5].innerText = "?"; // truth
				td[6].innerText = "?"; // ot1
				td[7].innerText = "?"; // ot1
				td[8].innerText = "?"; // ot1
				// 9
				td[10].innerText = "?"; // o quelle
			}
		}
	}
}