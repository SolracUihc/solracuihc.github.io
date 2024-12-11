import librosa
import numpy as np
import plotly.graph_objects as go
from IPython.display import display, HTML
import ipywidgets as widgets
import time
import threading
from IPython.display import Audio, display

def create_interactive_music_plot(y, sr, onset_env, rmse, onset_frames, duration=None):
    """
    Create an interactive plot with a progress bar for music visualization
    """
    # Calculate times
    times = librosa.times_like(onset_env, sr=sr)[:909]
    
    # Create the plotly figure
    fig = go.Figure()
    
    # Add onset envelope
    fig.add_trace(go.Scatter(
        x=times,
        y=onset_env[:909],
        name='Onset Envelope',
        line=dict(color='blue')
    ))
    
    # Add RMS energy
    fig.add_trace(go.Scatter(
        x=times,
        y=rmse[:909]/max(rmse)*onset_env.max(),
        name='RMS Energy',
        line=dict(color='green')
    ))
    
    # Add beat frames
    onset_frames = [f for f in onset_frames if f < 909]
    for frame in onset_frames:
        fig.add_trace(go.Scatter(
            x=[times[frame], times[frame]],
            y=[0, onset_env.max()],
            mode='lines',
            line=dict(color='red', width=1, dash='dot'),
            showlegend=False,
            opacity=0.5
        ))
    
    # Update layout
    fig.update_layout(
        title='Onset Envelope with Beat Frames',
        xaxis_title='Time',
        yaxis_title='Onset Strength',
        hovermode='x',
        width=1200,
        height=400
    )
    
    # Create progress bar
    progress = widgets.FloatProgress(
        value=0,
        min=0,
        max=duration if duration else len(y)/sr,
        description='Playing:',
        bar_style='info',
        style={'bar_color': '#1db954'},
        orientation='horizontal'
    )
    
    # Create play button
    play_button = widgets.Button(
        description='Play',
        icon='play',
        style={'button_color': '#1db954'}
    )
    
    # Create time indicator
    time_label = widgets.Label(value='0:00 / 0:00')
    
    def format_time(seconds):
        return f"{int(seconds//60)}:{int(seconds%60):02d}"
    
    def update_progress():
        total_duration = duration if duration else len(y)/sr
        start_time = time.time()
        while progress.value < total_duration:
            if not hasattr(update_progress, 'playing'):
                break
            current_time = time.time() - start_time
            progress.value = current_time
            time_label.value = f"{format_time(current_time)} / {format_time(total_duration)}"
            time.sleep(0.1)
        
        if hasattr(update_progress, 'playing'):
            delattr(update_progress, 'playing')
            play_button.description = 'Play'
            play_button.icon = 'play'
            progress.value = 0
            time_label.value = f"0:00 / {format_time(total_duration)}"
    
    def on_play_button_clicked(b):
        if hasattr(update_progress, 'playing'):
            delattr(update_progress, 'playing')
            play_button.description = 'Play'
            play_button.icon = 'play'
        else:
            setattr(update_progress, 'playing', True)
            play_button.description = 'Stop'
            play_button.icon = 'stop'
            # Start progress update in a separate thread
            threading.Thread(target=update_progress).start()
            # Play audio
            # display(Audio(y, rate=sr, autoplay=True))
    
    play_button.on_click(on_play_button_clicked)
    
    # Create control box
    controls = widgets.HBox([play_button, progress, time_label])
    
    # Display everything
    # return display(fig), display(controls)
    return fig, controls

# Example usage:
"""
create_interactive_music_plot(
    y=y,  # your audio signal
    sr=sr,  # sample rate
    onset_env=onset_env,  # onset envelope
    rmse=rmse,  # RMS energy
    onset_frames=onset_frames,  # onset frames
    duration=None  # optional: specify duration in seconds
)
"""
