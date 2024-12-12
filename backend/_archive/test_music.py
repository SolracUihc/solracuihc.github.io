import os
import json
from io import BytesIO

import librosa
import numpy as np
from matplotlib import pyplot as plt

import music

"""
Generate test beatmaps for each beatmaps
Outputs under res/beatmap_vis/.
"""
def test_maps():
    # paths
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    audio_dir = os.path.join(base_dir, 'backend', 'res', 'audio')
    beatmap_dir = os.path.join(base_dir, 'backend', 'res', 'beatmaps')
    vis_dir = os.path.join(base_dir, 'backend', 'res', 'beatmap_vis')

    os.makedirs(vis_dir, exist_ok=True)

    # process
    for audio_file in os.listdir(audio_dir):
        if not audio_file.lower().endswith('.mp3'):
            continue

        try:
            print(f'Generating visualization for {audio_file}...')

            input_file = os.path.join(audio_dir, audio_file)
            beatmap_file = os.path.join(beatmap_dir, f'{os.path.splitext(audio_file)[0]}.json')
            
            if not os.path.exists(beatmap_file):
                print(f'Beatmap does not exist for {audio_file}, skipping...')
                continue

            with open(beatmap_file, 'r') as f:
                beatmap = json.load(f)

            output_file = os.path.join(vis_dir, f'{os.path.splitext(audio_file)[0]}.png')
            output_file_flow = os.path.join(vis_dir, f'{os.path.splitext(audio_file)[0]}_flow.png')
            output_file_rsme = os.path.join(vis_dir, f'{os.path.splitext(audio_file)[0]}_rsme.png')
            
            print(len(beatmap), beatmap[0])

            ###############
            ## visualize ##
            ###############
            y, sr = librosa.load(input_file)

            # STFT
            D = np.abs(librosa.stft(y))  
            DB = librosa.amplitude_to_db(D, ref=np.max)

            ## plot stft
            thres = 500 #1500
            plt.imshow(DB[:,:thres], aspect='auto', origin='lower')
            plt.xlabel('Time')
            plt.ylabel('Frequency')

            max_energy = max([beat['energy'] for beat in beatmap])
            colors = ['r', 'g', 'b']
            for beat in beatmap:
                if beat['time']*sr/512 > thres:
                    continue
                plt.axvline(x=beat['time']*sr/512, color=colors[beat['type']], linestyle='--', linewidth=1)
                # , alpha=beat['energy']/max_energy

            plt.savefig(output_file)
            plt.close()

            ## plot flow
            onset_env = librosa.onset.onset_strength(y=y, sr=sr)
            times = librosa.times_like(onset_env, sr=sr)
            beats = librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr)
            rmse = librosa.feature.rms(y=y)[0]  # root mean square energy

            # high_energy_threshold = np.percentile(rmse, 80)     # upper 20% percentile
            # low_energy_threshold = np.percentile(rmse, 50)      # lower 50% percentile
            
            window_size_flow = 20
            high_energy_threshold = np.percentile(onset_env[beats], 80)     # upper 20% percentile
            low_energy_threshold = np.percentile(onset_env[beats], 50)      # lower 50% percentile

            window_size = 20
            # rmse = [music.moving_average_energy(rmse, i, beats, window_size) for i, beat in enumerate(beats)]
            energy = onset_env

            # plt.plot(onset_env[:thres])
            plt.plot(energy[:thres])

            for beat in beatmap:
                if beat['time']*sr/512 > thres:
                    continue
                plt.axvline(x=beat['time']*sr/512, color=colors[beat['type']], linestyle='--', linewidth=1)
                # , alpha=beat['energy']/max_energy

            plt.axhline(y=high_energy_threshold, color='r', linestyle='--', linewidth=1)
            plt.axhline(y=low_energy_threshold, color='g', linestyle='--', linewidth=1)
            
            plt.savefig(output_file_flow)
            plt.close()

            ## plot rmse
            plt.plot(rmse[:thres])

            for beat in beatmap:    
                if beat['time']*sr/512 > thres:
                    continue
                plt.axvline(x=beat['time']*sr/512, color=colors[beat['type']], linestyle='--', linewidth=1)
                # , alpha=beat['energy']/max_energy

            plt.savefig(output_file_rsme)
            plt.close()

            print(f'Successfully generated visualization for {audio_file}')

        except Exception as e:
            print(f'Error processing {audio_file}: {str(e)}')

if __name__ == '__main__':
    test_maps()