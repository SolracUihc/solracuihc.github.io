import os
import json
from io import BytesIO
import music

def process_audio_files():
    # paths
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    audio_dir = os.path.join(base_dir, 'backend', 'res', 'audio')
    beatmap_dir = os.path.join(base_dir, 'backend', 'res', 'beatmaps')

    os.makedirs(beatmap_dir, exist_ok=True)

    # process
    for audio_file in os.listdir(audio_dir):
        if not audio_file.lower().endswith('.mp3'):
            continue

        try:
            print(f'Processing {audio_file}...')

            output_file = os.path.join(beatmap_dir, f'{os.path.splitext(audio_file)[0]}.json')
            
            # skip if exist
            if os.path.exists(output_file):
                print(f'Beatmap already exists for {audio_file}, skipping...')
                continue

            # read audio
            audio_path = os.path.join(audio_dir, audio_file)
            with open(audio_path, 'rb') as f:
                audio_data = BytesIO(f.read())

            # extract feats
            features = music.extract_music_features(audio_data)

            with open(output_file, 'w') as f:
                json.dump(features, f, indent=2)

            print(f'Successfully created beatmap for {audio_file}')

        except Exception as e:
            print(f'Error processing {audio_file}: {str(e)}')

if __name__ == '__main__':
    process_audio_files()
