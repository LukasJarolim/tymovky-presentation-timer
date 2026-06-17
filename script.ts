import { LanguageManager } from "./FormWebScripts/js/languageManager.js";
import {
  WebSocketConnection,
  WebSocketConnectionMessageType,
} from "./FormWebScripts/js/serverComunication.js";
const conn = new WebSocketConnection(
  "",
  "./websocket",
  new LanguageManager("en", false),
  true,
);
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
      if (currentSpan.innerText != split[1]) {
        (currentSpan.parentElement as HTMLElement).style.animation = "none";
        void (currentSpan.parentElement as HTMLElement).offsetHeight;
        (currentSpan.parentElement as HTMLElement).style.animation = "";
        currentSpan.classList.add("red");
        setTimeout(() => {
          currentSpan.classList.remove("red");
        }, 10000);
      }
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
      if (currentSpan.innerText != "-") {
        (currentSpan.parentElement as HTMLElement).style.animation = "none";
        void (currentSpan.parentElement as HTMLElement).offsetHeight;
        (currentSpan.parentElement as HTMLElement).style.animation = "";
        currentSpan.classList.add("red");
        setTimeout(() => {
          currentSpan.classList.remove("red");
        }, 10000);
      }
      currentSpan.innerText = "-";
      break;
    }
    case "next": {
      if (nextSpan.innerText != split[1]) {
        (nextSpan.parentElement as HTMLElement).style.animation = "none";
        void (nextSpan.parentElement as HTMLElement).offsetHeight;
        (nextSpan.parentElement as HTMLElement).style.animation = "";
        nextSpan.classList.add("red");
        setTimeout(() => {
          nextSpan.classList.remove("red");
        }, 10000);
      }
      nextSpan.innerText = split[1];
      break;
    }
    case "no_next": {
      if (nextSpan.innerText != "-") {
        (nextSpan.parentElement as HTMLElement).style.animation = "none";
        void (nextSpan.parentElement as HTMLElement).offsetHeight;
        (nextSpan.parentElement as HTMLElement).style.animation = "";
        nextSpan.classList.add("red");
        setTimeout(() => {
          nextSpan.classList.remove("red");
        }, 10000);
      }
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
