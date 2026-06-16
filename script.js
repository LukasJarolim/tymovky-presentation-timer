import { LanguageManager } from "./FormWebScripts/js/languageManager.js";
import { WebSocketConnection, WebSocketConnectionMessageType, } from "./FormWebScripts/js/serverComunication.js";
const conn = new WebSocketConnection("", "./websocket", new LanguageManager("en", false), true);
let interval = 0;
let timer = new Date();
let limit = 0;
const currentSpan = document.getElementById("current");
const nextSpan = document.getElementById("next");
conn.AddListener((t, data) => {
    //Get command Message
    if (t != WebSocketConnectionMessageType.Message) {
        return;
    }
    //console.log("Got command:", data);
    const split = data.split("|", 2);
    if (split.length != 2) {
        console.error("invalid input:", split);
        return;
    }
    //Sort commands
    switch (split[0]) {
        case "stop": {
            window.clearInterval(interval);
            updateTimer();
            break;
        }
        case "zero": {
            updateTimer(true);
            break;
        }
        case "start": {
            window.setInterval(() => {
                updateTimer();
            }, 100);
            break;
        }
        case "current": {
            currentSpan.innerText = split[1];
            timer = new Date();
            updateTimer();
            break;
        }
        case "current-start": {
            timer = new Date(split[1]);
            updateTimer();
            break;
        }
        case "no_current": {
            timer = new Date();
            updateTimer();
            currentSpan.innerText = "-";
            break;
        }
        case "next": {
            timer = new Date();
            updateTimer();
            nextSpan.innerText = split[1];
            break;
        }
        case "no_next": {
            timer = new Date();
            updateTimer();
            nextSpan.innerText = "-";
            break;
        }
        case "timeout": {
            limit = parseInt(split[1]);
            updateTimer();
            break;
        }
        default: {
            console.warn("Unknown command: " + split[0]);
        }
    }
});
function updateTimer(zero = false) {
    //Get time and fix formating
    let remainingTime = limit - (new Date().getTime() - timer.getTime());
    let result = "";
    let colorClassAdd = false;
    if (zero) {
        timer = new Date();
        remainingTime = 0;
    }
    if (remainingTime < 0) {
        remainingTime = -remainingTime;
        result += "-";
        colorClassAdd = true;
    }
    //Convert to time
    const hours = Math.floor(remainingTime / (1000 * 60 * 60));
    const minutes = Math.floor((remainingTime / 60000) % 60);
    const seconds = Math.floor((remainingTime / 1000) % 60);
    const miliseconds = Math.floor(remainingTime % 1000);
    if (hours > 0) {
        result += hours.toString().padStart(2, "0");
        result += ":";
    }
    result += minutes.toString().padStart(2, "0");
    result += ":";
    result += seconds.toString().padStart(2, "0");
    result += ".";
    result += miliseconds.toString().padStart(3, "0");
    const time = document.getElementById("time");
    if (time != undefined) {
        time.innerText = result;
    }
}
updateTimer(true);
conn.Connect();
conn.Send("getData");
//# sourceMappingURL=script.js.map