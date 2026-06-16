import { LanguageManager } from "./FormWebScripts/js/languageManager.js";
import { WebSocketConnection, WebSocketConnectionMessageType } from "./FormWebScripts/js/serverComunication.js";
const conn = new WebSocketConnection("", "./websocket", new LanguageManager("en", false), true);
const currentSpan = document.getElementById("current") as HTMLSpanElement;
const nextSpan = document.getElementById("next") as HTMLSpanElement;
const timeSpan = document.getElementById("time") as HTMLSpanElement;
conn.AddListener((t: WebSocketConnectionMessageType, data: string) => {
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
		case "current": {
			currentSpan.innerText = split[1];
			break;
		}
		case "time": {
			timeSpan.innerText = split[1];
			break;
		}
		case "timeRed": {
			if (split[1] == "true") {
				timeSpan.classList.add("red");
			} else {
				timeSpan.classList.remove("red");
			}
			break;
		}
		case "no_current": {
			currentSpan.innerText = "-";
			break;
		}
		case "next": {
			nextSpan.innerText = split[1];
			break;
		}
		case "no_next": {
			nextSpan.innerText = "-";
			break;
		}
		default: {
			console.warn("Unknown command: " + split[0]);
		}
	}
});
conn.Connect();
conn.Send("getData");
