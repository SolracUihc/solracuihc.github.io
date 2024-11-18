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
        this.webcam = new WebcamHandler();
        // this.handDetector = new HandDetector();
        this.gameAnimator = new GameAnimator();
        this.handAnimator = new HandAnimator(this.gameAnimator.scene);
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
            // await this.handDetector.initialize();
            await this.dataFetcher.fetchSongList();

            this.setupEventListeners();
            
            document.getElementById('loading').classList.add('hidden');
        } catch (error) {
            console.error('Initialization error:', error);
            alert('Failed to initialize game. Please check console for details.');
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
        
        await this.audioPlayer.loadAudio(this.currentSong.audioUrl);
        this.audioPlayer.play();

        this.gameLoop();
    }

    async gameLoop() {
        if (!this.isRunning) return;

        // Detect hands
        const frame = this.webcam.getFrame();
        const handPosition = await this.handDetector.detectHands(frame);

        if (handPosition) {
            // Update hand visualization
            this.handAnimator.updateHandPosition(handPosition);

            // Check collisions
            const collisions = this.collisionDetector.checkCollision(
                handPosition,
                this.gameAnimator.boxes
            );

            // Update score
            this.scoreManager.updateScore(collisions);
        }

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
        document.getElementById('start-game').className = 'disabled';

        const songs = await this.dataFetcher.getSongsByCategory(category);
        const songList = document.getElementById('song-list');
        songList.innerHTML = '';

        songs.forEach(song => {
            const button = document.createElement('button');
            button.textContent = song.title;
            button.onclick = () => {
                this.currentSong = song;
                document.getElementById('start-game').className = '';
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