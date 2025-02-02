import QrScanner from 'qr-scanner';
import Socketable from "./Socketable.js";

export default class Player extends Socketable {
	video;
	scanResult;
	clientId;
	sessionId;
	sessionIdField;
	phase = "joinSession";
	round = 1;

	constructor(serverUrl) {
        super(serverUrl); // Call the parent class (Socketable)

        this.loadSessionId();

        if (this.sessionId === null) {
        	this.phase = "scanQr"
        }

        this.renderPhases();

		this.on("start_game", (connectionId, games) => {
			let myGame = games.find(g => g.round1 === connectionId);
        	console.log("received start_game", myGame);
			this.phase = "round";
			this.renderPhases(myGame);
		});

        this.on("update_difficulty", (connectionId, data) => {
        	console.log("received update_difficulty", data);
        	if (this.phase === "joinSession") {
        		document.getElementById("difficulty").innerText = data;
        	}
        });

        this.on("advance_round", (connectionId, games) => {
        	this.round += 1;
			let myGame = games.find(g => g["round" + this.round] === connectionId);
        	console.log("received start_game", myGame);
			this.phase = "round";
			this.renderPhases(myGame);
        });

        this.on("results", (connectionId, data) => {
        	let myGame = data.games.find(g => g.round4 === connectionId);
			this.phase = "choose";
			this.renderPhases({answers: data.answers, game: myGame});
        });
    }

	renderPhases(data) {
		let scanQr = document.getElementById("scanQr");
		let joinSession = document.getElementById("joinSession");
		let round = document.getElementById("round");
		let choose = document.getElementById("choose");

		console.log("rendering phase ", this.phase);
		if (this.phase === "scanQr") {
			scanQr.style.display = "block";
			joinSession.style.display = "none";
			round.style.display = "none";
			choose.style.display = "none";

			this.renderScanner();
		} else if (this.phase === "joinSession") {
			scanQr.style.display = "none";
			joinSession.style.display = "block";
			round.style.display = "none";
			choose.style.display = "none";

			this.renderJoiner();
		} else if (this.phase === "round") {
			scanQr.style.display = "none";
			joinSession.style.display = "none";
			round.style.display = "block";
			choose.style.display = "none";

			this.renderRound(data);
		} else if (this.phase === "choose"){
			scanQr.style.display = "none";
			joinSession.style.display = "none";
			round.style.display = "none";
			choose.style.display = "block";

			this.renderChooser(data);
		}
    }

	loadSessionId() {
		let sessionId = window.sessionStorage.getItem("sessionId");
		if (sessionId === null && window.location.search.length > 0) {
			var params = new URLSearchParams(window.location.search);
			if (params.get("session") !== null) {
				sessionId = params.get("session");
				window.sessionStorage.setItem("sessionId", sessionId);
			}
		}

		this.sessionId = sessionId;
		this.on("connect", () => {
			console.log("player is joing session ", this.sessionId);
			this.joinSession(this.sessionId);
		});
	}

    renderJoiner() {
    	document.getElementById("sessionId").innerText = this.sessionId;
    	document.getElementById("joinGameBtn").onclick = () => {
	        let userName = document.getElementById("userName").value;
	        console.log(`Registering user: ${userName} ${this.sessionId}`);
    		this.emit("register_user", userName)
    	}
    }

    renderRound(game) {
    	document.getElementById("roundNumber").innerText = this.round;

    	document.querySelectorAll(".originalMessages > div.selected").forEach(e => e.classList.remove("selected"));
    	document.getElementById("originalMessage" + this.round).classList.add("selected");

		document.getElementById("originalMessage1").innerText = game.message_part1;
		document.getElementById("originalMessage2").innerText = game.message_part2;
		document.getElementById("originalMessage3").innerText = game.message_part3;
		let a1 = document.getElementById("answer1");
		let a2 = document.getElementById("answer2");
		let a3 = document.getElementById("answer3");

		if (this.round == 1) {
			document.getElementById("prompt").innerText = game.instruction1;
			a1.innerText = game.answersRound1[0];
			a2.innerText = game.answersRound1[1];
			a3.innerText = game.answersRound1[2];
		}
		if (this.round == 2) {
			document.getElementById("prompt").innerText = game.instruction2;
			a1.innerText = game.answersRound2[0];
			a2.innerText = game.answersRound2[1];
			a3.innerText = game.answersRound2[2];
		}
		if (this.round == 3) {
			document.getElementById("prompt").innerText = game.instruction3;
			a1.innerText = game.answersRound1[0];
			a2.innerText = game.answersRound3[1];
			a3.innerText = game.answersRound3[2];
		}

		a1.onclick = () => {
			this.chooseAnswer(a1.innerText);
		}
		a2.onclick = () => {
			this.chooseAnswer(a2.innerText);
		}
		a3.onclick = () => {
			this.chooseAnswer(a3.innerText);
		}
    }

    chooseAnswer(answer) {
    	console.log("coosing answer", answer, "in round", round)
 	   	this.emit("choose_answer", {
    		round: this.round,
    		answer: answer
    	});
    }

    renderChooser(data) {

		document.getElementById("transformedMessage1").innerText = data.game.choiceRound1;
		document.getElementById("transformedMessage2").innerText = data.game.choiceRound2;
		document.getElementById("transformedMessage3").innerText = data.game.choiceRound3;

		let s1 = document.getElementById("source1"); s1.innerText = data.answers[0];
		s1.onclick = () => { this.selectItem(s1); }
		let s2 = document.getElementById("source2"); s2.innerText = data.answers[1];
		s2.onclick = () => { this.selectItem(s2); }
		let s3 = document.getElementById("source3"); s3.innerText = data.answers[2];
		s3.onclick = () => { this.selectItem(s3); }
		let s4 = document.getElementById("source4"); s4.innerText = data.answers[3];
		s4.onclick = () => { this.selectItem(s4); }
		let s5 = document.getElementById("source5"); s5.innerText = data.answers[4];
		s5.onclick = () => { this.selectItem(s5); }
		let s6 = document.getElementById("source6"); s6.innerText = data.answers[5];
		s6.onclick = () => { this.selectItem(s6); }
		let s7 = document.getElementById("source7"); s7.innerText = data.answers[6];
		s7.onclick = () => { this.selectItem(s7); }
		let s8 = document.getElementById("source8"); s8.innerText = data.answers[7];
		s8.onclick = () => { this.selectItem(s8); }

		let btnTip = document.getElementById("btnTip");
		btnTip.onclick = () => {
			btnTip.disabled = true;
	    	var selected = document.querySelectorAll(".sourceTip > div.selected");
	    	if (selected.length > 0) {
	    		this.chooseSource(selected[0].innerText);
	    	}
		}
    }

    selectItem(item) {
    	document.querySelectorAll(".sourceTip > div.selected").forEach(e => e.classList.remove("selected"));
    	item.classList.add("selected");
    }

    chooseSource(source) {
 	   	this.emit("choose_source", {
    		"round": this.round,
    		"source": source
    	});
    }

    renderScanner() {
        this.video = document.getElementById("qrCodeScanner");
        this.scanResult = document.getElementById("scanResult");
        this.camList = [];
        this.highlightTimeout = null;

        this.scanner = new QrScanner(
        	this.video,
        	this.setResult.bind(this),
        	{
			    onDecodeError: error => {
			    	this.scanResult.textContent = error;
			        this.scanResult.style.color = 'inherit';
			    },
			    highlightScanRegion: true,
			    highlightCodeOutline: true,
			}
		);

		this.scanner.start().then(() => {
		    // List cameras after the scanner started to avoid listCamera's stream and the scanner's stream being requested
		    // at the same time which can result in listCamera's unconstrained stream also being offered to the scanner.
		    // Note that we can also start the scanner after listCameras, we just have it this way around in the demo to
		    // start the scanner earlier.
		    QrScanner.listCameras(true).then(cameras => cameras.forEach(camera => {
		        const option = document.createElement('option');
		        option.value = camera.id;
		        option.text = camera.label;
		        this.camList.push(option);
		    }));
		});
    }

    setResult(result) {
	    console.log(result.data);
	    this.scanResult.textContent = new Date().toString() + " --> " + result.data;
	    this.scanResult.style.color = 'teal';
	    clearTimeout(this.highlightTimeout);
	    this.highlightTimeout = setTimeout(() => this.scanResult.style.color = 'inherit', 100);
	}

}