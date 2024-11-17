import librosa

def hello():
    message = "Hello from Flask!"
    return message

import librosa

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
        "tempo": tempo, # single value: BPM
        "beats": beats.tolist(), # 1D array 
        "chroma_stft": chroma_stft.tolist(), # 2D array
        "rmse": rmse.tolist() # 1D array
    }
