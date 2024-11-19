export class AudioPlayer {
    constructor() {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        this.source = null;
        this.buffer = null;
        this.startTime = 0;
        this.isPlaying = false;
        this.youtubePlayer = null;
        this.isYouTube = false;
    }

    async loadAudio(url) {
        console.log('Loading audio:', url);
        if (url.includes('youtube')) {
            this.isYouTube = true;
            await this.setupYouTubePlayer(url);
        } else if (url.startsWith('res/')) {
            this.isYouTube = false;
            try {
                const response = await fetch(`../backend/${url}`);
                const arrayBuffer = await response.arrayBuffer();
                this.buffer = await this.context.decodeAudioData(arrayBuffer);
            } catch (error) {
                console.error('Error loading audio:', error);
                throw error;
            }
        } else {
            this.isYouTube = false;
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

    getYouTubeVideoId(url) {
        const urlParams = new URLSearchParams(new URL(url).search);
        return urlParams.get('v');
    }

    setupYouTubePlayer(url) {
        return new Promise((resolve, reject) => {
            const videoId = this.getYouTubeVideoId(url);
            if (!videoId) {
                reject(new Error('Invalid YouTube URL'));
                return;
            }

            // Show YouTube container
            document.getElementById('youtube-container').classList.remove('hidden');

            if (!window.YT) {
                reject(new Error('YouTube API not loaded'));
                return;
            }

            this.youtubePlayer = new YT.Player('youtube-player', {
                height: '200',
                width: '200',
                videoId: videoId,
                playerVars: {
                    'controls': 0,
                    'showinfo': 0,
                    'rel': 0,
                    'modestbranding': 1
                },
                events: {
                    'onReady': () => resolve(),
                    'onStateChange': (event) => {
                        if (event.data === YT.PlayerState.ENDED) {
                            this.isPlaying = false;
                            document.getElementById('youtube-container').classList.add('hidden');
                        }
                    }
                }
            });
        });
    }

    play() {
        if (this.isYouTube) {
            if (this.youtubePlayer && this.youtubePlayer.playVideo) {
                this.youtubePlayer.playVideo();
                this.startTime = Date.now() / 1000;
                this.isPlaying = true;
            }
        } else {
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
    }

    pause() {
        if (this.isYouTube) {
            if (this.youtubePlayer && this.youtubePlayer.pauseVideo) {
                this.youtubePlayer.pauseVideo();
                this.isPlaying = false;
            }
        } else if (this.source && this.isPlaying) {
            this.source.stop();
            this.isPlaying = false;
            this.source.disconnect();
        }
    }

    getCurrentTime() {
        if (!this.isPlaying) return 0;
        
        if (this.isYouTube) {
            return this.youtubePlayer ? this.youtubePlayer.getCurrentTime() : 0;
        }
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