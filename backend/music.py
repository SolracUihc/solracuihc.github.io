import os
from io import BytesIO

import librosa
import yt_dlp


def hello():
    message = "Hello from Flask!"
    return message

def extract_music_features(audio_file):
    # Load audio file
    y, sr = librosa.load(audio_file)

    # Extract music features using librosa
    # onset info
    onset_frames = librosa.onset.onset_detect(y=y, sr=sr)
    onset_times = librosa.frames_to_time(onset_frames, sr=sr)

    tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
    # Pitch class
    chroma_stft = librosa.feature.chroma_stft(y=y, sr=sr)
    # Root Mean Square Energy: can be plotted over time to visualize the energy envelope of the audio signal
    rmse = librosa.feature.rms(y=y)
    
    return {
        "onset_times": onset_times.tolist(), # 1D array
        "tempo": float(tempo[0]), # single value: BPM
        "beats": beats.tolist(), # 1D array 
        "chroma_stft": chroma_stft.tolist(), # 2D array
        "rmse": rmse.tolist() # 1D array
    }
    
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