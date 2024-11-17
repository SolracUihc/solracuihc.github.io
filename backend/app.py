from flask import Flask, jsonify, request
from flask_cors import CORS
import music
from scene import Scene

app = Flask(__name__)
CORS(app)

MUSIC_OBJECT = music.MusicStreamer()
SCENE = Scene(MUSIC_OBJECT)

@app.route('/api/hello', methods=['GET'])
def hello_world():
    try:
        message = music.hello()
        return jsonify(message=message), 200

    except Exception as e:
        return jsonify(error=str(e)), 500
    
@app.route('/api/audio/<audio_id>', methods=['GET'])
def get_audio(audio_id):
    try:
        audio = audio_id
        return jsonify(audio=audio), 200

    except Exception as e:
        return jsonify(error=str(e)), 500

@app.route('/api/start_streaming', methods=['GET'])
def start_streaming():
    try:
        MUSIC_OBJECT.start_playing()
        return jsonify(message='ok'), 200

    except Exception as e:
        return jsonify(error=str(e)), 500

@app.route('/api/stop_streaming', methods=['GET'])
def stop_streaming():
    try:
        MUSIC_OBJECT.stop_playing()
        return jsonify(message='ok'), 200

    except Exception as e:
        return jsonify(error=str(e)), 500

# @app.route('/api/stream', methods=['GET'])
# def get_stream():
#     try:
#         beat_info = MUSIC_OBJECT.get_stream()
#         return jsonify(beat_info=beat_info), 200

#     except Exception as e:
#         return jsonify(error=str(e)), 500

if __name__ == '__main__':
    app.run(debug=True)