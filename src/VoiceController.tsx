import React, { useEffect, useRef, useState } from "react";

export type VoiceStatus =
  | "idle"
  | "ready"
  | "listening"
  | "processing"
  | "error"
  | "unsupported";

interface VoiceControllerProps {
  onMove: (from: string, to: string) => void;
  onNewGame: () => void;
  onUndo: () => void;
  status: VoiceStatus;
  setStatus: (s: VoiceStatus) => void;
  setLastCommand: (cmd: string) => void;
}

const normalizeSquare = (input: string): string | null => {
  const cleaned = input.trim().replace(/\s+/g, "");
  if (/^[a-hA-H][1-8]$/.test(cleaned)) return cleaned.toLowerCase();

  const fileMap: Record<string, string> = {
    a: "a",
    b: "b",
    c: "c",
    d: "d",
    e: "e",
    f: "f",
    g: "g",
    h: "h",
  };

  const rankMap: Record<string, string> = {
    one: "1",
    two: "2",
    three: "3",
    four: "4",
    for: "4",
    five: "5",
    six: "6",
    seven: "7",
    eight: "8",
  };

  const match = cleaned.match(/^([a-hA-H])([1-8])$/);
  if (match) return match[0].toLowerCase();

  const fileLetter = cleaned[0];
  const rankWord = cleaned.slice(1);
  if (fileMap[fileLetter] && rankMap[rankWord]) {
    return `${fileMap[fileLetter]}${rankMap[rankWord]}`;
  }

  return null;
};

const parseVoiceCommand = (
  text: string
):
  | { type: "move"; from: string; to: string }
  | { type: "undo" | "newgame" | "castle"; side?: "kingside" | "queenside" }
  | null => {
  const t = text.trim();

  // 1. Python-style "Clean" Parsing (UCI fallback)
  // Removes "to" and spaces, looks for exact 4-5 char coordinates like "e2e4" or "a7a8q"
  const clean = t.toLowerCase().replace(/to|two|too/g, "").replace(/\s+/g, "");
  const uciMatch = clean.match(/^([a-h][1-8])([a-h][1-8])([qrbn])?$/);
  if (uciMatch) {
    return { type: "move", from: uciMatch[1], to: uciMatch[2] }; // Promotion handled by App default for now
  }

  // 2. Existing Natural Language Parsing
  if (/new\s*game|reset/i.test(t)) {
    return { type: "newgame" };
  }
  if (/undo|take\s*back/i.test(t)) {
    return { type: "undo" };
  }
  if (/castle|castling/i.test(t)) {
    if (/queen|long/i.test(t)) {
      return { type: "castle", side: "queenside" };
    }
    return { type: "castle", side: "kingside" };
  }

  const simpleMove = t.match(
    /([a-hA-H]\s*[1-8])\s*(to|two|too)?\s*([a-hA-H]\s*[1-8])/i
  );
  if (simpleMove) {
    const from = normalizeSquare(simpleMove[1])!;
    const to = normalizeSquare(simpleMove[3])!;
    if (from && to) return { type: "move", from, to };
  }

  const tokens = t.split(/\s+/);
  const idxMove = tokens.indexOf("move");
  if (idxMove !== -1 && tokens.length >= idxMove + 3) {
    const from = normalizeSquare(tokens[idxMove + 1]);
    const to = normalizeSquare(tokens[idxMove + 2]);
    if (from && to) return { type: "move", from, to };
  }

  return null;
};

const speak = (text: string) => {
  const utterance = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(utterance);
};

const VoiceController: React.FC<VoiceControllerProps> = ({
  onMove,
  onNewGame,
  onUndo,
  status,
  setStatus,
  setLastCommand,
}) => {
  const recognitionRef = useRef<any>(null);
  const isListeningActive = useRef(false);

  useEffect(() => {
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setStatus("unsupported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setStatus("listening");
    };

    recognition.onend = () => {
      // If we are in active listening mode, restart immediately
      if (isListeningActive.current) {
        try {
          recognition.start();
        } catch (e) {
          // ignore if already started
        }
      } else {
        setStatus("ready");
      }
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      console.log("Transcript:", transcript);
      setLastCommand(transcript);

      const command = parseVoiceCommand(transcript);
      if (!command) {
        speak("Invalid format.");
        return;
      }

      if (command.type === "move") {
        onMove(command.from, command.to);
        speak(`Move ${command.from} to ${command.to} played.`);
      } else if (command.type === "newgame") {
        onNewGame();
        speak("New game started.");
      } else if (command.type === "undo") {
        onUndo();
        speak("Move undone.");
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      if (event.error === "no-speech") {
        // Just ignore no-speech and go back to ready
        setStatus("ready");
        return;
      }
      setStatus("error");
      speak("An error occurred.");
    };

    recognitionRef.current = recognition;
    setStatus("ready");
    speak("Welcome to vocal chess. Start by making your move.");

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []); // Empty dependency array to run once on mount

  const handleToggle = () => {
    if (status === "unsupported") return;

    if (status === "listening") {
      isListeningActive.current = false;
      recognitionRef.current?.stop();
    } else {
      try {
        isListeningActive.current = true;
        recognitionRef.current?.start();
      } catch (e) {
        // Sometimes start() throws if already started
        console.error(e);
      }
    }
  };

  let label = "Tap to speak";
  if (status === "listening") label = "Listening...";
  if (status === "processing") label = "Processing...";
  if (status === "error") label = "Error – retry";
  if (status === "unsupported") label = "Not supported";

  return (
    <div className="voice-controller">
      <button
        className={[
          "mic-button",
          status === "listening" ? "mic-button-active" : "",
          status === "unsupported" ? "mic-button-disabled" : "",
        ].join(" ")}
        onClick={handleToggle}
        disabled={status === "unsupported"}
      >
        <span className="mic-icon">
          {status === "listening" ? "🛑" : "🎙"}
        </span>
      </button>
      <div className="voice-status">
        <span className="status-dot" data-status={status} />
        <span className="status-label">{label}</span>
      </div>
    </div>
  );
};

export default VoiceController;
