import Player from './Player.js';
import Board from './Board.js';


window.onload = function(e){
    if (document.getElementById("qrCodeScanner")) {
        console.log("video player");
        new Player(window.location.origin);
    } else if (document.getElementById("qrCode")) {
        console.log("board");
        new Board(window.location.origin);
    } else {
        console.error("no identification");
    }
}