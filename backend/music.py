import os
from io import BytesIO

import numpy as np
import requests
import tempfile

import librosa
import yt_dlp
import json
import matplotlib.pyplot as plt

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

def plot_energy_curve(y, sr, output_path):
    # Calculate RMS energy
    rmse = librosa.feature.rms(y=y)[0]
    
    # Create time array
    frames = range(len(rmse))
    t = librosa.frames_to_time(frames)
    
    # Create the plot
    plt.figure(figsize=(15, 5))
    plt.plot(t, rmse, color='blue', alpha=0.7, linewidth=2)
    plt.fill_between(t, rmse, alpha=0.3, color='blue')
    
    # Add labels and title
    plt.xlabel('Time (seconds)')
    plt.ylabel('RMS Energy')
    plt.title('Audio Energy Over Time')
    
    # Add grid
    plt.grid(True, alpha=0.3)
    
    # Customize appearance
    plt.tight_layout()
    
    # Save plot
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.close()  # Close the figure to free memory

def plot_spectrogram(D, DB, sr, output_path='spectrogram.png'):
    # Create figure
    plt.figure(figsize=(15, 8))
    
    # Create spectrogram
    librosa.display.specshow(
        DB, 
        sr=sr, 
        x_axis='time', 
        y_axis='hz',
        cmap='viridis'
    )
    # Add colorbar
    plt.colorbar(format='%+2.0f dB')
    
    # Add labels and title
    plt.xlabel('Time (seconds)')
    plt.ylabel('Frequency (Hz)')
    plt.title('Spectrogram')
    
    # Adjust layout
    plt.tight_layout()
    
    # Save and close
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.close()

def moving_average_energy(rmse, beat, beats, window_size=4):
    """ Calculate the average energy around a beat (±window_size) """
    # Get the index range for the window of surrounding beats
    start = max(0, beat - window_size)  # Ensure we don't go below index 0
    end = min(len(beats), beat + window_size + 1)  # Ensure we don't go beyond the last beat
    
    # Take the average RMS energy over the specified window
    avg_energy = np.mean(rmse[beats[start:end]])
    return avg_energy

def extract_music_features_ccc(audio_file):
    # Load audio file
    y, sr = librosa.load(audio_file)
    plot_energy_curve(y, sr, 'energy_curve.png')

    # Short-time Fourier transform (STFT)
    D = np.abs(librosa.stft(y))  
    DB = librosa.amplitude_to_db(D, ref=np.max)
    print(f"Shape of DB: {DB.shape}")
    # Define the segment range (e.g., first 100 frames)
    segment = DB[:, :100]
    plot_spectrogram(D, segment, sr, 'spectrogram.png')

    # Extract beats
    tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
    rmse = librosa.feature.rms(y=y)[0]  # Root Mean Square Energy

    # Calculate time for each beat
    times = librosa.frames_to_time(beats, sr=sr)

    # Prepare the beatMap
    beat_map = []
    no_skip = 1
    window_size = 2  # Using ±2 beats, total window size is 9 beats (incl. current beat)

    high_energy_threshold = np.percentile(rmse, 80)     # Upper 20% percentile
    low_energy_threshold = np.percentile(rmse, 50)      # Lower 50% percentile
    print(f"High-energy threshold: {high_energy_threshold}")
    print(f"Low-energy threshold: {low_energy_threshold}")

    # Iterate through each beat
    for i, beat in enumerate(beats):
        time = times[i]

        # Calculate the average energy using the surrounding 9 beats (4 before, 4 after)
        avg_energy = moving_average_energy(rmse, i, beats, window_size)

        # Determine if current beat is in a high-energy (climax) section
        if avg_energy > high_energy_threshold:
            # Add more beats during climax (higher density)
            if i < len(beats) - 1:
                next_time = times[i + 1]
                interpolated_time = (time + next_time) / 2  # Midpoint between two beats
                beat_map.append({
                    'time': round(interpolated_time, 2),
                    'x': round(float(rmse[beat]), 2),
                    'y': np.where(DB.T[beat] == max(DB.T[beat]))[0][0],
                    'z': 0,
                    'points': 150  # Increased points for climax
                })
        
        # Regular beat
        if avg_energy > low_energy_threshold:
            # High-energy beat, always add it
            beat_map.append({
                'time': round(time, 2),
                'x': round(float(rmse[beat]), 2),
                'y': np.where(DB.T[beat] == max(DB.T[beat]))[0][0],
                'z': 0,
                'points': 100  # Full points for high-energy beats
            })
            no_skip = 1  # Reset skip flag after a high-energy beat
        elif no_skip == 1:
            # Low-energy beat, but only add it if the last one wasn't skipped
            beat_map.append({
                'time': round(time, 2),
                'x': round(float(rmse[beat]), 2),
                'y': np.where(DB.T[beat] == max(DB.T[beat]))[0][0],
                'z': 0,
                'points': 50  # Reduced points for low-energy beats
            })
            no_skip = 0  # Set skip flag for next low-energy beat
        else:
            # Skip this low-energy beat
            no_skip = 1  # Reset skip flag for the next beat

    # Normalize the beat map
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
