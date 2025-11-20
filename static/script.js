console.log("Script starting...");
document.addEventListener('DOMContentLoaded', () => {
    const logBox = document.getElementById('log');
    if (logBox) {
        logBox.innerHTML = '<p style="color: green; font-weight: bold;">JS LOADED SUCCESSFULLY</p>';
        logBox.style.borderColor = 'green';
    }
});
var board = null
var game = new Chess() // We use chess.js for client-side validation visualization if needed, but main logic is backend

// Initialize board
function onDragStart(source, piece, position, orientation) {
    // do not pick up pieces if the game is over
    if (game.game_over()) return false

    // only pick up pieces for the side to move
    if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false
    }
}

// We will rely on backend for move validation, so we won't use onDrop to update local state immediately
// Instead, we'll use the board as a visualizer for the backend state.
// Actually, for smoother UI, let's allow drag-drop and validate with backend.

var config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: handleManualMove,
    onSnapEnd: onSnapEnd
}
board = Chessboard('board', config)

// Sync with backend state on load
updateBoardState();

function handleManualMove(source, target) {
    // Construct move string (e.g., "e2e4")
    var move = source + target;
    sendMoveToBackend(move);
    return 'snapback'; // Snap back first, let updateBoardState handle the actual move
}

function onSnapEnd() {
    // board.position(game.fen())
}

function updateBoardState() {
    fetch('/state')
        .then(response => response.json())
        .then(data => {
            board.position(data.fen);
            document.getElementById('status').innerText = data.is_game_over ? "Game Over" : (data.turn === 'white' ? "White's Turn" : "Black's Turn");
        });
}

function sendMoveToBackend(move) {
    fetch('/move', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ move: move }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                board.position(data.fen);
                document.getElementById('status').innerText = data.is_game_over ? "Game Over" : (data.turn === 'white' ? "White's Turn" : "Black's Turn");
                speak("Move played");
                log("Move played: " + move);
            } else {
                speak("Invalid move");
                log("Invalid move: " + data.message);
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            log("Error processing move");
        });
}

// Voice Recognition
const startBtn = document.getElementById('start-voice-btn');
const logDiv = document.getElementById('log');

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    startBtn.addEventListener('click', () => {
        try {
            recognition.start();
            log("Attempting to start microphone...");
        } catch (e) {
            log("Error starting recognition: " + e.message);
        }
    });

    recognition.onstart = () => {
        log("Microphone is active. Speak now!");
        startBtn.classList.add('listening');
        startBtn.innerText = "Listening...";
    };

    recognition.onresult = (event) => {
        const command = event.results[0][0].transcript;
        log("Recognized: " + command);

        // Simple parsing: remove "to", spaces, etc.
        // "e2 to e4" -> "e2e4"
        let move = command.toLowerCase().replace(/to/g, '').replace(/\s/g, '').replace(/-/g, '');

        // Basic check if it looks like a move (4 chars)
        // We rely on backend to validate strictly
        sendMoveToBackend(move);
    };

    recognition.onspeechend = () => {
        log("Speech ended. Processing...");
        recognition.stop();
        startBtn.classList.remove('listening');
        startBtn.innerHTML = '<span class="icon">🎤</span> Speak Move';
    };

    recognition.onend = () => {
        startBtn.classList.remove('listening');
        startBtn.innerHTML = '<span class="icon">🎤</span> Speak Move';
    };

    recognition.onerror = (event) => {
        log("Error occurred: " + event.error);
        if (event.error === 'not-allowed') {
            log("Microphone access denied. Please allow permission.");
        } else if (event.error === 'no-speech') {
            log("No speech detected. Please try again.");
        }
        startBtn.classList.remove('listening');
        startBtn.innerHTML = '<span class="icon">🎤</span> Speak Move';
    };
} else {
    log("CRITICAL: Web Speech API not supported in this browser. Please use Chrome, Edge, or Safari.");
    startBtn.disabled = true;
    startBtn.innerText = "Voice Not Supported";
}

// Text to Speech
function speak(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
    }
}

function log(text) {
    logDiv.innerHTML = `<p>${text}</p>`;
}

// Reset Game
document.getElementById('reset-btn').addEventListener('click', () => {
    fetch('/reset', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                board.start();
                log("Game reset.");
                speak("Game reset.");
                document.getElementById('status').innerText = "White's Turn";
            }
        });
});
