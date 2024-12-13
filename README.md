# AI Music Project: 3D Hand Motion Music Game

## Start Playing!

Without using the backend, you can play the game via any of the following methods:
* **Method 1**: Local Running
  * Clone this project to the local, and execute `python3 -m http.server` in the terminal AT THE PROJECT ROOT.
  * Visit http://127.0.0.1:8000/ to play the game. 
* **Method 2**: Online Running
    * You can directly play the game on https://solracuihc.github.io/ or a backup in https://ash3327.github.io/ai_music_project/.

Note that you CANNOT choose the songs marked with '(Backend)' without running the backend.

## Generation of Beat Maps

* All relevant files are within `backend/`, and commands should be executed under `backend/`.
* Run `batch_process.py` to process all the audio files in `res/audio/` and generate json files in `res/beatmaps/`.
  * Songs with existing beatmaps will be skipped.

## List of Songs

* The list of songs can be found in `MIR/songData.json`.
* The audio files are stored in `backend/res/audio/`. The file paths are specified in `MIR/songData.json`
  * Online sources & urls are also supported (requires the backend if not predownloaded). The URL MUST BE DIRECTED TO AN AUDIO FILE (ends with .mp3).
  * Does NOT support youtube videos.

## Backend: Setting Up 

* The backend server is only needed if the song specified within `MIR/songData.json` does not have a `beatMapUrl` field or the specified file is missing.
* All relevant files are within `backend/`.
* Install ffmpeg properly and check with `ffmpeg` on cmd.
* Enter the subfolder `backend` and create a new virtual environment:
    ```bash
    python -m venv venv
    .\venv\Script\activate # windows
    source ./venv/bin/activate # linux
    ```
* Install required packages:
    ```bash
    pip install -r requirements.txt
    ```
* Set up the backend Flask server by running `app.py`:
    ```bash
    python app.py
    ```

## Recent Updates

**Instructions**
* Provide clearer instructions to the user.
* E.g. counting down so that the user can prepare.

**Support of Local Audio Added**
* Local audio is put within `backend/res/audio/<file_name>.mp3`, which is referred in `MIR/songData.json` as `res/audio/<file_name>.mp3`.

**Consistent Speed of Boxes**
* In `MIR/js/3DAnimation.js`, every motion change is now updated with a factor of `timeDiff` within `updateBoxes()`, which ensures that the boxes move at the same speed regardless of the frame rate.

**Precomputing**
* Audios are stored in `backend/res/audio/<file_name>.mp3`.
* In `backend/`, execute `batch_process.py`.
* This will generate `backend/res/beatmaps/<file_name>.json` as the json files for every audio in `backend/res/audio/`.
* You STILL NEED TO MANUALLY CHANGE the `songData.json` by specifying the `beatMapUrl` of the song. If this field is missing or the file it is pointing to is missing, API call to backend will be used instead to load the audio.

## Methodology...

Please view the document [here](./README-methodology.md).

## References
* Built upon the article: https://tympanus.net/codrops/2024/10/24/creating-a-3d-hand-controller-using-a-webcam-with-mediapipe-and-three-js/
* Forked from [\[Cai3ra/webcam-3D-handcontrols\]](https://github.com/Cai3ra/webcam-3D-handcontrols).