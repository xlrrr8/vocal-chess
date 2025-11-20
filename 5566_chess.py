import chess
import speech_recognition as sr
import pyttsx3

def speak(text):
    engine = pyttsx3.init()
    engine.say(text)
    engine.runAndWait()

def get_voice_command():
    recognizer = sr.Recognizer()
    with sr.Microphone() as source:
        print("Speak your chess move (e.g., 'e2e4', 'E2 E4', or 'E2 to E4'):")
        audio = recognizer.listen(source)
    try:
        command = recognizer.recognize_google(audio)
        print("You said:", command)
        return command
    except sr.UnknownValueError:
        speak("Sorry, I did not understand that.")
        return None

def parse_move_input(user_command):
    user_command = user_command.lower()
    user_command = user_command.replace("to", "")
    user_command = user_command.replace(" ",  "")
    return user_command

def main():
    board = chess.Board()
    speak("Welcome to vocal chess. Start by making your move.")
    while not board.is_game_over():
        move_made = False
        while not move_made:
            user_command = get_voice_command()
            if user_command:
                if user_command.lower().strip() in ["quit", "exit"]:
                    speak("Exiting vocal chess. Goodbye!")
                    return
                try:
                    move_text = parse_move_input(user_command)
                    move = chess.Move.from_uci(move_text)
                    if move in board.legal_moves:
                        board.push(move)
                        move_made = True
                        speak(f"Move {move_text} played.")
                    else:
                        speak("Invalid move. Try again.")
                except Exception:
                    speak("Invalid format. Please say the move like 'e2e4', 'E2 E4', or 'E2 to E4'.")
        print(board)

if __name__ == "__main__":
    main()
