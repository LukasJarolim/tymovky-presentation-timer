import { LanguageManager } from "./FormWebScripts/js/languageManager.js";
import { GlobalDialogManager } from "./FormWebScripts/js/formDialogScript.js";
import {
  WebSocketConnection,
  WebSocketConnectionMessageType,
} from "./FormWebScripts/js/serverComunication.js";
const currentSpan = document.getElementById("current") as HTMLSpanElement;
const nextSpan = document.getElementById("next") as HTMLSpanElement;
const timeSpan = document.getElementById("time") as HTMLSpanElement;
const audioCtx = new AudioContext();
const currentTimeouts: number[] = [];
const nextTimeouts: number[] = [];

function startApp() {
  const conn = new WebSocketConnection(
    "",
    "./websocket",
    new LanguageManager("en", false),
    true,
  );
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
          playGong();
          resetAnim();
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
        resetAnim();
        if (currentSpan.innerText != "-") {
          playGong();
        }
        currentSpan.innerText = "-";
        break;
      }
      case "next": {
        if (nextSpan.innerText != split[1]) {
          resetAnim();
        }
        nextSpan.innerText = split[1];
        break;
      }
      case "no_next": {
        resetAnim();
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
}

function resetAnim() {
  (currentSpan.parentElement as HTMLElement).style.animation = "none";
  void (currentSpan.parentElement as HTMLElement).offsetHeight;
  (currentSpan.parentElement as HTMLElement).style.animation = "";
  (nextSpan.parentElement as HTMLElement).style.animation = "none";
  void (nextSpan.parentElement as HTMLElement).offsetHeight;
  (nextSpan.parentElement as HTMLElement).style.animation = "";
  currentSpan.classList.add("red");
  while (currentTimeouts.length > 0) {
    clearTimeout(currentTimeouts.pop());
  }
  currentTimeouts.push(
    setTimeout(() => {
      currentSpan.classList.remove("red");
    }, 10000),
  );
  nextSpan.classList.add("red");
  while (nextTimeouts.length > 0) {
    clearTimeout(nextTimeouts.pop());
  }
  nextTimeouts.push(
    setTimeout(() => {
      nextSpan.classList.remove("red");
    }, 10000),
  );
}

function playGong() {
  if (audioCtx.state === "suspended") audioCtx.resume();
  const now = audioCtx.currentTime;

  //Make tones
  const tones = [
    { čas: 0.0, zakladni: 392.0, delka: 2 },
    { čas: 0.22, zakladni: 293.66, delka: 1.5 },
  ];

  tones.forEach((t) => {
    //Components of tone
    const components = [
      { freq: t.zakladni, gain: 0.3 },
      { freq: t.zakladni * 2.001, gain: 0.08 },
      { freq: t.zakladni * 0.5, gain: 0.05 },
    ];

    //Generate each component
    components.forEach((component) => {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(component.freq, now + t.čas);
      gainNode.gain.setValueAtTime(0, now + t.čas);
      gainNode.gain.linearRampToValueAtTime(component.gain, now + t.čas + 0.04);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + t.čas + t.delka);
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.start(now + t.čas);
      osc.stop(now + t.čas + t.delka + 0.1);
    });
  });
}

//Test
GlobalDialogManager.ShowAlert(
  "Informace",
  "Aktivujte aplikaci kliknutím na OK.",
  () => {
    startApp();
  },
);
