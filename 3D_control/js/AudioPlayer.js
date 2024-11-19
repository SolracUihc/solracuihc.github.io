export class AudioPlayer {
    constructor() {
        this.audio = new Audio();
        this.isPlaying = false;
    }

    loadSong(songUrl) {
        return new Promise((resolve, reject) => {
            this.audio.src = songUrl;
            this.audio.addEventListener('canplaythrough', () => resolve(), { once: true });
            this.audio.addEventListener('error', (error) => reject(error), { once: true });
        });
    }

    play() {
        if (!this.isPlaying) {
            this.audio.play();
            this.isPlaying = true;
        }
    }

    pause() {
        if (this.isPlaying) {
            this.audio.pause();
            this.isPlaying = false;
        }
    }

    stop() {
        this.pause();
        this.audio.currentTime = 0;
    }

    setVolume(volume) {
        this.audio.volume = Math.max(0, Math.min(1, volume));
    }

    getCurrentTime() {
        return this.audio.currentTime;
    }

    getDuration() {
        return this.audio.duration;
    }
}
