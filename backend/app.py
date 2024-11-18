import base64

from flask import Flask, jsonify, request
from flask_cors import CORS

import music
from streamer import MusicStreamer
from scene import Scene

app = Flask(__name__)
CORS(app)

MUSIC_OBJECT = MusicStreamer()
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

@app.route('/api/start_streaming/<scene_id>', methods=['GET'])
def start_streaming(scene_id):
    try:
        MUSIC_OBJECT.stop_playing()
        print('SCENE START', scene_id)
        SCENE.initialize_scene(scene_id)
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

@app.route('/api/stream', methods=['GET'])
def get_stream():
    try:
        beat_info = SCENE.get_state()
        return jsonify(beat_info=beat_info), 200

    except Exception as e:
        return jsonify(error=str(e)), 500
    
@app.route('/api/extract', methods=['GET'])
def feature():
    try:
        url = request.args.get('url')
        if not url:
            return jsonify(error="URL parameter is missing"), 400
        
        audio_data = music.download_youtube_as_mp3(url)
        if audio_data is None:
            return jsonify(error="Failed to download or convert YouTube audio"), 500
        
        features = music.extract_music_features(audio_data)
        audio_base64 = base64.b64encode(audio_data.getvalue()).decode('utf-8')
        
        features["audio_data"] = audio_base64
        return jsonify(features), 200
    
    except Exception as e:
        return jsonify(error=str(e)), 500

if __name__ == '__main__':
    app.run(debug=True)