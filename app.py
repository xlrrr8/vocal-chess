from flask import Flask, render_template, request, jsonify
import chess

app = Flask(__name__)

# Global board state (for simplicity in this single-player/local context)
board = chess.Board()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/state', methods=['GET'])
def get_state():
    return jsonify({
        'fen': board.fen(),
        'turn': 'white' if board.turn == chess.WHITE else 'black',
        'is_game_over': board.is_game_over(),
        'legal_moves': [move.uci() for move in board.legal_moves]
    })

@app.route('/move', methods=['POST'])
def make_move():
    data = request.json
    move_uci = data.get('move')
    
    if not move_uci:
        return jsonify({'success': False, 'message': 'No move provided'}), 400

    # Clean up input (remove spaces, "to", etc. if raw voice input is sent)
    # However, frontend should ideally send clean UCI or SAN. 
    # We'll assume the frontend sends something close to UCI or SAN.
    
    try:
        # Try to parse as UCI first
        move = chess.Move.from_uci(move_uci)
    except ValueError:
        # If not UCI, maybe it's SAN? But python-chess needs a board context for SAN
        try:
            move = board.parse_san(move_uci)
        except ValueError:
             return jsonify({'success': False, 'message': 'Invalid move format'}), 400

    if move in board.legal_moves:
        board.push(move)
        return jsonify({
            'success': True, 
            'fen': board.fen(),
            'is_game_over': board.is_game_over(),
            'turn': 'white' if board.turn == chess.WHITE else 'black'
        })
    else:
        return jsonify({'success': False, 'message': 'Illegal move'}), 400

@app.route('/reset', methods=['POST'])
def reset_game():
    global board
    board = chess.Board()
    return jsonify({'success': True, 'fen': board.fen()})

if __name__ == '__main__':
    app.run(debug=True)
