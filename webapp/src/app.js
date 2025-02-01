import Player from './Player.js';
import Generator from './Generator.js';


window.onload = function(e){
    if (document.getElementById("video")) {
        console.log("video player");
        new Player();
    } else if (document.getElementById("qrCode")) {
        console.log("generator");
        new Generator();
    } else {
        console.error("no identification");
    }
}