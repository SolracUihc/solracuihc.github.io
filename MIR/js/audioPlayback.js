export class AudioPlayer {
    constructor() {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        this.source = null;
        this.buffer = null;
        this.startTime = 0;
        this.isPlaying = false;
    }

    async loadAudio(url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            this.buffer = await this.context.decodeAudioData(arrayBuffer);
        } catch (error) {
            console.error('Error loading audio:', error);
            throw error;
        }
    }

    play() {
        if (!this.buffer) {
            console.error('No audio loaded');
            return;
        }

        this.source = this.context.createBufferSource();
        this.source.buffer = this.buffer;
        this.source.connect(this.context.destination);
        
        this.startTime = this.context.currentTime;
        this.source.start(0);
        this.isPlaying = true;

        this.source.onended = () => {
            this.isPlaying = false;
            this.source.disconnect();
        };
    }

    pause() {
        if (this.source && this.isPlaying) {
            this.source.stop();
            this.isPlaying = false;
            this.source.disconnect();
        }
    }

    getCurrentTime() {
        if (!this.isPlaying) return 0;
        return this.context.currentTime - this.startTime;
    }

    setVolume(volume) {
        if (this.source) {
            const gainNode = this.context.createGain();
            gainNode.gain.value = volume;
            this.source.connect(gainNode);
            gainNode.connect(this.context.destination);
        }
    }
}