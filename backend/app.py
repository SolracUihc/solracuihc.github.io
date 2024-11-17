from flask import Flask, jsonify, request
from flask_cors import CORS
import music

app = Flask(__name__)
CORS(app)

@app.route('/api/hello', methods=['GET'])
def hello_world():
    try:
        message = music.hello()
        return jsonify(message=message), 200

    except Exception as e:
        return jsonify(error=str(e)), 500

if __name__ == '__main__':
    app.run(debug=True)