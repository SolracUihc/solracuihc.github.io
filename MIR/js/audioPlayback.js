export class AudioPlayer {
    constructor() {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        this.source = null;
        this.buffer = null;
        this.startTime = 0;
        this.isPlaying = false;
    }

    async loadAudio(url) {
        console.log('Loading audio:', url);
        if (url.startsWith('res/')) {
            try {
                const response = await fetch(`../backend/${url}`);
                const arrayBuffer = await response.arrayBuffer();
                this.buffer = await this.context.decodeAudioData(arrayBuffer);
            } catch (error) {
                console.error('Error loading audio:', error);
                throw error;
            }
        } else {
            try {
                const response = await fetch(url);
                const arrayBuffer = await response.arrayBuffer();
                this.buffer = await this.context.decodeAudioData(arrayBuffer);
            } catch (error) {
                console.error('Error loading audio:', error);
                throw error;
            }
        }
    }

    play() {
        if (!this.buffer) {
            console.error('No audio loaded');
            return;
        }
    
        const silentDuration = 2.5;
        const sampleRate = this.context.sampleRate;
        const silentBuffer = this.context.createBuffer(
            this.buffer.numberOfChannels,
            sampleRate * silentDuration,
            sampleRate
        );
    
        const combinedBuffer = this.context.createBuffer(
            this.buffer.numberOfChannels,
            silentBuffer.length + this.buffer.length,
            sampleRate
        );
    
        for (let channel = 0; channel < this.buffer.numberOfChannels; channel++) {
            const silentData = silentBuffer.getChannelData(channel);
            const combinedData = combinedBuffer.getChannelData(channel);
            
            combinedData.set(silentData, 0);
            
            const audioData = this.buffer.getChannelData(channel);
            combinedData.set(audioData, silentBuffer.length);
        }
    
        this.source = this.context.createBufferSource();
        this.source.buffer = combinedBuffer;
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