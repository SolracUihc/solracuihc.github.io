import { WebcamHandler } from './webcam.js';
import { HandDetector } from './handDetection.js';
import { HandAnimator } from './handAnimation.js';
import { DataFetcher } from './dataFetch.js';
import { AudioPlayer } from './audioPlayback.js';
import { GameAnimator } from './3DAnimation.js';
import { CollisionDetector } from './collisionDetection.js';
import { ScoreManager } from './scoreManagement.js';

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
            'boxMaxY': 2 
        };

        this.webcam = new WebcamHandler();
        this.handDetector = new HandDetector(settings);
        this.gameAnimator = new GameAnimator(settings);
        this.handAnimator = new HandAnimator(this.gameAnimator.scene, settings);
        this.dataFetcher = new DataFetcher();
        this.audioPlayer = new AudioPlayer();
        this.collisionDetector = new CollisionDetector();
        this.scoreManager = new ScoreManager();
        
        this.isRunning = false;
        this.currentSong = null;
        this.nextBeatIndex = 0;
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

            console.log('BM', this.currentSong.beatMap);

            await this.audioPlayer.loadAudio(this.currentSong.audioUrl);
            
            // Hide loading screen before starting the game
            document.getElementById('loading').classList.add('hidden');
            
            this.gameAnimator.reset_seed(this.currentSong.audioUrl);
            this.audioPlayer.play();
            this.gameLoop();
        } catch (error) {
            console.log(error.message);
            console.error('Error loading game:', error);
            alert('Failed to load the game. Please try again.');
            this.reloadMenu();
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

        // Update game objects
        const currentTime = this.audioPlayer.getCurrentTime();
        this.updateBeats(currentTime);
        this.gameAnimator.updateBoxes(currentTime);

        // Render scene
        this.gameAnimator.render();

        // Continue loop
        requestAnimationFrame(() => this.gameLoop());
    }

    updateBeats(currentTime) {
        while (
            this.nextBeatIndex < this.currentSong.beatMap.length &&
            this.currentSong.beatMap[this.nextBeatIndex].time <= currentTime + 2
        ) {
            const beatData = this.currentSong.beatMap[this.nextBeatIndex];
            this.gameAnimator.createBox(beatData);
            this.nextBeatIndex++;
        }
    }

    async updateSongList(category) {
        this.currentSong = null;
        document.getElementById('start-game').classList.add('disabled');

        const songs = await this.dataFetcher.getSongsByCategory(category);
        const songList = document.getElementById('song-list');
        songList.innerHTML = '';

        songs.forEach(song => {
            const button = document.createElement('button');
            button.textContent = song.title;
            button.onclick = () => {
                this.currentSong = song;
                document.getElementById('start-game').classList.remove('disabled');
            };
            songList.appendChild(button);
        });
    }

    endGame() {
        this.isRunning = false;
        this.audioPlayer.pause();
        this.gameAnimator.clear();
        this.handAnimator.clear();

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
