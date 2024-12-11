import os
from io import BytesIO

import numpy as np
import requests
import tempfile

import librosa
# import yt_dlp
import json

def min_max_normalize(data):
    """ normalizes x and y to ranges 0 to 1"""
    x_values = [item['x'] for item in data]
    y_values = [item['y'] for item in data]

    x_min, x_max = min(x_values), max(x_values)
    y_min, y_max = min(y_values), max(y_values)

    normalized_data = []
    for item in data: # normalize x and y
        normalized_item = item
        item['x'] = round((item['x'] - x_min) / (x_max - x_min), 2)
        item['y'] = round((item['y'] - y_min) / (y_max - y_min), 2)
        normalized_data.append(normalized_item)

    return normalized_data

def moving_average_energy(rmse, beat, beats, window_size=4):
    """ calculate the avg energy around a beat (±window_size) """
    # index range of the window
    start = max(0, beat - window_size)  # > 0
    end = min(len(beats), beat + window_size + 1)  # < last beat
    
    # take average RMS energy
    avg_energy = np.mean(rmse[beats[start:end]])
    return avg_energy

def extract_music_features(audio_file):
    # load audio file
    y, sr = librosa.load(audio_file)

    # STFT
    D = np.abs(librosa.stft(y))  
    DB = librosa.amplitude_to_db(D, ref=np.max)

    # extract beats / tempo / rmse
    # tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
    onset_env = librosa.onset.onset_strength(y=y, sr=sr)
    times = librosa.times_like(onset_env, sr=sr)
    beats = librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr)
    ## NOTE: times[beats] shows the time of each beat; 
    ##       onset_env[beats] shows the strength of each beat

    rmse = librosa.feature.rms(y=y)[0]  # root mean square energy

    # calculate time for each beat
    times = librosa.frames_to_time(beats, sr=sr)

    # prepare the beatMap
    beat_map = []
    no_skip = 1
    window_size = 2  # using ±2 beats, total window size is 9 beats (incl. current beat)

    # high_energy_threshold = np.percentile(rmse, 80)     # upper 20% percentile
    # low_energy_threshold = np.percentile(rmse, 50)      # lower 50% percentile
    high_energy_threshold = np.percentile(onset_env[beats], 80)     # upper 20% percentile
    low_energy_threshold = np.percentile(onset_env[beats], 50)      # lower 50% percentile

    # loop
    for i, beat in enumerate(beats):
        time = times[i]

        # average energy using the surrounding 9 beats (4 before, 4 after)
        avg_energy = onset_env[beat] #moving_average_energy(rmse, i, beats, window_size)
        ### FORCE REGULAR BEAT
        
        # # determine: current beat is in a high-energy (climax) section
        if avg_energy > high_energy_threshold:
            # add more beats during climax (higher density)
            if i < len(beats) - 1:
                # next_time = times[i + 1]
                # interpolated_time = (time + next_time) / 2  # midpoint between two beats
                beat_map.append({
                    'time': round(time, 2),
                    'x': round(float(rmse[beat]), 2),
                    'y': np.where(DB.T[beat] == max(DB.T[beat]))[0][0],
                    'z': 0,
                    'energy': float(onset_env[beat]),
                    'avg_energy': float(avg_energy),
                    'type': 2,
                    'points': 150  # more points for climax
                })
        
        # regular beat
        if avg_energy > low_energy_threshold:
            # high-energy beat, always add it
            beat_map.append({
                'time': round(time, 2),
                'x': round(float(rmse[beat]), 2),
                'y': np.where(DB.T[beat] == max(DB.T[beat]))[0][0],
                'z': 0,
                'energy': float(onset_env[beat]),
                'avg_energy': float(avg_energy),
                'type': 1,
                'points': 100  # full points for high-energy beats
            })
            no_skip = 1  # reset skip flag after a high-energy beat
        elif no_skip == 1:
            # low-energy beat, but only add it if the last one wasn't skipped
            beat_map.append({
                'time': round(time, 2),
                'x': round(float(rmse[beat]), 2),
                'y': np.where(DB.T[beat] == max(DB.T[beat]))[0][0],
                'z': 0,
                'energy': float(onset_env[beat]),
                'avg_energy': float(avg_energy),
                'type': 0,
                'points': 50  # less points for low-energy beats
            })
            no_skip = 0  # set skip flag for next low-energy beat
        else:
            # skip this low-energy beat
            no_skip = 1  # reset skip flag for the next beat

    # normalize the beat map
    normalized_data = min_max_normalize(beat_map)
    return normalized_data

def download_youtube_as_mp3(youtube_url):
    try:
        # options for yt-dlp
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
        
        # use yt-dlp to download the YouTube audio
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([youtube_url])
        
        # read the downloaded MP3 file into a BytesIO buffer
        with open('downloaded_audio.mp3', 'rb') as f:
            mp3_buffer = BytesIO(f.read())
        
        # clean up and reset buffer to beggining
        os.remove('downloaded_audio.mp3')
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
