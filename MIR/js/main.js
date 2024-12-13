import { WebcamHandler } from './webcam.js';
import { HandDetector } from './handDetection.js';
import { HandAnimator } from './handAnimation.js';
import { DataFetcher } from './dataFetch.js';
import { AudioPlayer } from './audioPlayback.js';
import { GameAnimator } from './3DAnimation.js';
import { CollisionDetector } from './collisionDetection.js';
import { ScoreManager } from './scoreManagement.js';
import { GUIManager } from './guiManager.js';

import { timeString } from './mathUtils.js';

class Game {
    constructor() {
        const settings = {
            // **Scaling of Hand**
            // handDetector
            'handOffsetZDistance': -2, // Depth offset
            // handAnimator
            'distScale': 6, // Scaling of the position of hand
            'handScale': 6, // Scaling of the size of the hand
            'depthScale': 1, // Scaling of the depth of the hand
            // **Game Animator**
            'boxMinX': -2,
            'boxMaxX': 2,
            'boxMinY': .5,
            'boxMaxY': 2,
            // **Audio Player**
            'silenceDuration': 2.5, // seconds
            'hitTimeOffset': 2.5, // seconds
            'hintTimeWindow': .7, // seconds
            'hitTimeWindow': .2, // seconds
            // **Game**
            'boxCreationTimeOffset': .6 // seconds
        };

        this.webcam = new WebcamHandler();
        this.handDetector = new HandDetector(settings);
        this.gameAnimator = new GameAnimator(settings);
        this.handAnimator = new HandAnimator(this.gameAnimator.scene, settings);
        this.dataFetcher = new DataFetcher();
        this.audioPlayer = new AudioPlayer(settings);
        this.collisionDetector = new CollisionDetector();
        this.scoreManager = new ScoreManager();
        this.guiManager = new GUIManager();
        
        this.isRunning = false;
        this.currentSong = null;
        this.nextBeatIndex = 0;
        this.nextGroundIndex = 0;

        this.boxCreationTimeOffset = settings?.boxCreationTimeOffset ?? .5;
        this.groundTimeOffset = settings?.silenceDuration ?? 2.5;
    }

    async initialize() {
        try {
            document.getElementById('loading').classList.remove('hidden');
            
            await this.webcam.initialize();
            await this.handDetector.initialize();
            await this.dataFetcher.fetchSongList();

            this.setupEventListeners();
            
            document.getElementById('loading').classList.add('hidden');
        } catch (error) {
            console.error('Initialization error:', error);
            alert('Failed to initialize game. Please check console for details. Error:' + error);
        }
    }

    setupEventListeners() {
        document.getElementById('start-game').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('end-game')?.addEventListener('click', () => {
            this.endGame();
        });

        document.getElementById('song-category')?.addEventListener('change', (e) => {
            this.updateSongList(e.target.value);
        });
    }

    async startGame() {
        if (!this.currentSong) {
            alert('Please Select a Song First.');
            return;
        }

        this.isRunning = true;
        this.nextBeatIndex = 0;
        document.getElementById('menu-container').classList.add('hidden');
        
        // Show loading screen
        document.getElementById('loading').classList.remove('hidden');
        
        try {
            // First try to load from beatMapUrl if it exists
            console.log('BMF', this.currentSong);
            if (this.currentSong.beatMapUrl) {
                try {
                    console.log('Loading beatMap from file:', this.currentSong.beatMapUrl);
                    const response = await fetch(`../backend/${this.currentSong.beatMapUrl}`);
                    if (response.ok) {
                        this.currentSong.beatMap = await response.json();
                        console.log('Loaded beatMap from file:', this.currentSong.beatMapUrl);
                    } else {
                        throw new Error('Failed to load beatMap file');
                    }
                } catch (error) {
                    console.log('Failed to load beatMap from file, falling back to API');
                }
            }

            // If beatMap is still empty, load from API
            if (!this.currentSong.beatMap || this.currentSong.beatMap.length === 0) {
                const url = encodeURIComponent(this.currentSong.audioUrl);
                const response = await fetch(`http://127.0.0.1:5000/api/stream?url=${url}`, {
                    method: 'GET',
                }).catch((error) => {
                    console.error('Error loading game:', error);
                    alert('The backend is not set up properly. Please make sure the backend server is running.');
                    this.reloadMenu();
                });
                
                if (!response) return;
                
                const data = await response.json();
                this.currentSong.beatMap = data;
                console.log('Loaded beatMap from API');
            }

            // console.log('BM', this.currentSong.beatMap);

            await this.audioPlayer.loadAudio(this.currentSong.audioUrl);
            
            // Hide loading screen before starting the game
            document.getElementById('loading').classList.add('hidden');
            
            this.gameAnimator.reset_seed(this.currentSong.audioUrl);

            // 3 2 1 
            document.getElementById('countdown').classList.remove('hidden'); 
            document.getElementById('countdown').querySelector('h1').textContent = 3;
            this.countdownValue = 3;
            this.countdownInterval = setInterval(this.countdownStartGame.bind(this), 1000);
        } catch (error) {
            console.log(error.message);
            console.error('Error loading game:', error);
            alert('Failed to load the game. Please try again.');
            this.reloadMenu();
        }
    }

    displayInstructions() {
        document.getElementById('instruction').classList.remove('hidden');
        document.getElementById('instruction').querySelector('h1').textContent = 'Move your hands to capture the incoming targets to gain points!';
        const instruction = document.getElementById('instruction');
        instruction.style.opacity = '1'; // Ensure it is visible
        setTimeout(() => {
            instruction.classList.add('hidden'); // Hide element after fade-out is complete
        }, 4000); // This should match the duration of the fade-out plus the initial display time
    }

    countdownStartGame() {
        this.countdownValue -= 1;
        document.getElementById('countdown').querySelector('h1').textContent = this.countdownValue != 0 ? this.countdownValue : "Ready?";
        console.log('COUNTING', this.countdownValue);
        if (this.countdownValue < 0) {
            clearInterval(this.countdownInterval);
            document.getElementById('countdown').classList.add('hidden');
            this.audioPlayer.play();
            this.displayInstructions();
            this.gameLoop();
        }
    }

    async reloadMenu() {
        this.isRunning = false;
        this.currentSong = null;
        document.getElementById('start-game').classList.add('disabled');
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('menu-container').classList.remove('hidden');
    }

    async gameLoop() {
        if (!this.isRunning) return;

        // Detect hands
        const frame = this.webcam.getFrame();
        const handsData = await this.handDetector.detectHands(frame);

        // Update hand visualization with all detected hands
        this.handAnimator.updateHandPosition(handsData);
        
        // Check collisions for each hand
        
        this.handAnimator.targets.forEach((target, index) => {
            // console.log('HND', this.handAnimator.hands[index].meshes);
            const collisions = this.collisionDetector.checkCollision(
                [target, ...this.handAnimator.hands[index].meshes],
                this.gameAnimator.boxes
            );

            // Update score
            this.scoreManager.updateScore(collisions);
        });

        // Update game beat
        const currentTime = this.audioPlayer.getCurrentTime()
        const beatTime = currentTime-this.boxCreationTimeOffset
        const audioLen = this.audioPlayer.getAudioLength()
        let actualTime = this.audioPlayer.getActualTime()
        actualTime = Math.min(Math.max(actualTime, 0), audioLen)

        // Update gui
        document.getElementById('time').textContent = `${timeString(actualTime)}/${timeString(audioLen)}`;
        this.guiManager.updateTimeBar(1-actualTime/audioLen);
        this.guiManager.updateAccuracyBar(this.scoreManager.getAccuracy()); 

        // Update boxes
        this.updateBeats(beatTime);
        this.updateBeatsGround(currentTime);
        // Update targets and check combo
        if (this.gameAnimator.updateBoxes(beatTime)) {
            this.scoreManager.missedNote();
        }

        // Render scene
        this.gameAnimator.render();

        // Continue loop
        if (!this.audioPlayer.isPlaying) {
            console.log('END GAME');
            this.endGame();
            return;
        }   
        requestAnimationFrame(() => this.gameLoop());  
    }

    updateBeats(currentTime) {
        while (
            this.nextBeatIndex < this.currentSong.beatMap.length &&
            this.currentSong.beatMap[this.nextBeatIndex].time <= currentTime-this.boxCreationTimeOffset
        ) {
            const beatData = this.currentSong.beatMap[this.nextBeatIndex];
            this.gameAnimator.createBox(beatData);
            this.nextBeatIndex++;
        }
    }
    
    updateBeatsGround(currentTime) {
        while (
            this.nextGroundIndex < this.currentSong.beatMap.length &&
            this.currentSong.beatMap[this.nextGroundIndex].time <= currentTime-this.groundTimeOffset
        ) {
            const beatData = this.currentSong.beatMap[this.nextGroundIndex];
            this.gameAnimator.updateGround(beatData);
            this.nextGroundIndex++;
        }
    }

    async updateSongList(category) {
        this.setSong(null);

        const songs = await this.dataFetcher.getSongsByCategory(category);
        const songList = document.getElementById('song-list');
        songList.innerHTML = '';

        songs.forEach(song => {
            const button = document.createElement('button');
            button.textContent = song.title;
            button.onclick = () => {
                this.setSong(song);
            };
            songList.appendChild(button);
        });
    }

    setSong(song) {
        this.currentSong = song;
        if (this.currentSong === null) {
            document.getElementById('start-game').classList.add('disabled');
        } else {
            document.getElementById('start-game').classList.remove('disabled');
        }
        document.getElementById('songName').textContent = this.currentSong?.title ?? '(None Selected)';
    }

    endGame() {
        this.isRunning = false;
        this.audioPlayer.pause();
        this.gameAnimator.clear();

        const stats = this.scoreManager.getGameStats();
        localStorage.setItem('gameStats', JSON.stringify(stats));
        
        window.location.href = 'end.html';
    }
}

// Initialize game when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.initialize();
});
