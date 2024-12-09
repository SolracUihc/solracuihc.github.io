import base64

from flask import Flask, jsonify, request
from flask_cors import CORS

import music

app = Flask(__name__)
CORS(app)
    
@app.route('/api/audio/<audio_id>', methods=['GET'])
def get_audio(audio_id):
    try:
        audio = audio_id
        return jsonify(audio=audio), 200

    except Exception as e:
        return jsonify(error=str(e)), 500

@app.route('/api/stream', methods=['GET'])
def get_stream():
    """
    HOW TO TEST: (In Postman)
    GET http://127.0.0.1:5000/api/stream?url=https://ia801509.us.archive.org/24/items/fcbqy/Abba%20-%20Dancing%20Queen.mp3
    GET http://127.0.0.1:5000/api/stream?url=https://www.youtube.com/watch?v=ZRtdQ81jPUQ%26ab_channel=Ayase%2FYOASOBI
    """
    try:
        url = request.args.get('url')
        print('Loading Audio...', url)
        if not url:
            return jsonify(error="URL parameter is missing"), 400
        
        audio_data = music.load_audio_data_from_url(url)
            
        if audio_data is None:
            return jsonify(error="Failed to download or convert YouTube audio"), 500
        
        features = music.extract_music_features(audio_data)
        # audio_base64 = base64.b64encode(audio_data.getvalue()).decode('utf-8')
        # features["audio_data"] = audio_base64
        # print(features)
        return jsonify(features), 200

    except Exception as e:
        return jsonify(error=str(e)), 500
    
# @app.route('/api/extract', methods=['GET'])
# def feature():
#     try:
#         url = request.args.get('url')
#         if not url:
#             return jsonify(error="URL parameter is missing"), 400
        
#         audio_data = music.load_audio_data_from_url(url)
#         if audio_data is None:
#             return jsonify(error="Failed to download or convert YouTube audio"), 500
        
#         features = music.extract_music_features(audio_data)
#         # audio_base64 = base64.b64encode(audio_data.getvalue()).decode('utf-8')
        
#         # features["audio_data"] = audio_base64
#         return jsonify(features), 200
    
#     except Exception as e:
#         return jsonify(error=str(e)), 500

if __name__ == '__main__':
    app.run(debug=True)