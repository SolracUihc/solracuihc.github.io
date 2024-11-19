import os
from io import BytesIO

import numpy as np
import requests
import tempfile

import librosa
import yt_dlp
import json

def min_max_normalize(data):
    # Extract x and y values
    x_values = [item['x'] for item in data]
    y_values = [item['y'] for item in data]

    # Calculate min and max for x and y
    x_min, x_max = min(x_values), max(x_values)
    y_min, y_max = min(y_values), max(y_values)

    # Normalize each dictionary
    normalized_data = []
    for item in data:
        normalized_item = {
            'time': item['time'],
            'x': round((item['x'] - x_min) / (x_max - x_min), 2),
            'y': round((item['y'] - y_min) / (y_max - y_min), 2),
            'z': item['z'],
            'points': item['points'],
        }
        normalized_data.append(normalized_item)

    return normalized_data

def extract_music_features_ccc(audio_file):
    # Load audio file
    y, sr = librosa.load(audio_file)

    D = np.abs(librosa.stft(y))  # Short-time Fourier transform
    DB = librosa.amplitude_to_db(np.abs(D), ref=np.max)

    # Extract beats
    tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
    rmse = librosa.feature.rms(y=y)

    # print(rmse.shape, y.shape, max(beats), DB.shape)

    # Prepare the beatMap
    beat_map = []
    for beat in beats:
        # Convert frame to time
        time = librosa.frames_to_time(beat, sr=sr)
        # Create the beatMap entry
        beat_map.append({
            'time': round(time,2),
            'x': round(float(rmse[0][beat]),2),#round(abs(max(DB.T[beat]))),
            'y': np.where(DB.T[beat] == max(DB.T[beat]))[0][0],
            'z': 0,
            'points': 100  # You can adjust this as needed
        })
 
    normalized_data = min_max_normalize(beat_map)
    return normalized_data

def download_youtube_as_mp3(youtube_url):
    try:
        # Define options for yt-dlp
        ydl_opts = {
            'format': 'bestaudio/best',
            'quiet': True,
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
            'outtmpl': 'downloaded_audio.%(ext)s',  # Save the audio temporarily
        }
        
        # Use yt-dlp to download the YouTube audio
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([youtube_url])
        
        # Read the downloaded MP3 file into a BytesIO buffer
        with open('downloaded_audio.mp3', 'rb') as f:
            mp3_buffer = BytesIO(f.read())
        
        # Clean up by removing the temporary MP3 file
        os.remove('downloaded_audio.mp3')

        # Reset the buffer position to the beginning
        mp3_buffer.seek(0)
        
        return mp3_buffer

    except Exception as e:
        print(f"An error occurred during download with yt-dlp: {e}")
        return None

def load_audio_data_from_url(url):
    if 'youtube' in url:
        audio_data = download_youtube_as_mp3(url)
        return audio_data

    if url.startswith('file://') or os.path.exists(url):
        with open(url, 'rb') as f:
            audio_buffer = BytesIO(f.read())
        return audio_buffer

    response = requests.get(url)
    audio_buffer = BytesIO(response.content)
    return audio_buffer
