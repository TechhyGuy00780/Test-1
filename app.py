from flask import Flask, jsonify, request
from flask_cors import CORS
import numpy as np
import cv2
from deepface import DeepFace
import os
import tensorflow as tf
import warnings

# Suppress TensorFlow logs
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
tf.compat.v1.logging.set_verbosity(tf.compat.v1.logging.ERROR)

warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=DeprecationWarning)

app = Flask(__name__)
CORS(app)

@app.route('/analyze-mood', methods=['POST'])
def analyze():
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image uploaded"}), 400

        image_file = request.files['image']
        np_img = np.frombuffer(image_file.read(), np.uint8)
        img = cv2.imdecode(np_img, cv2.IMREAD_COLOR)

        if img is None:
            return jsonify({"error": "Invalid image format"}), 400

        # DeepFace AI Analysis
        result = DeepFace.analyze(img, actions=['emotion'], enforce_detection=False)

        if 'dominant_emotion' in result[0]:
            detected_mood = result[0]['dominant_emotion']
            emotions = {k: float(v) for k, v in result[0]['emotion'].items()}  # Convert to Python float
        else:
            detected_mood = "Unknown"
            emotions = {}

        return jsonify({"mood": detected_mood, "emotions": emotions})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/capture', methods=['GET'])
def capture():
    try:
        cap = cv2.VideoCapture(0)  # Open the default webcam

        if not cap.isOpened():
            return jsonify({"error": "Webcam not accessible"}), 500

        ret, frame = cap.read()
        cap.release()

        if not ret:
            return jsonify({"error": "Failed to capture image"}), 500

        # DeepFace AI Analysis
        result = DeepFace.analyze(frame, actions=['emotion'], enforce_detection=False)

        if 'dominant_emotion' in result[0]:
            detected_mood = result[0]['dominant_emotion']
            emotions = {k: float(v) for k, v in result[0]['emotion'].items()}  # Convert to Python float
        else:
            detected_mood = "Unknown"
            emotions = {}

        return jsonify({"mood": detected_mood, "emotions": emotions})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
