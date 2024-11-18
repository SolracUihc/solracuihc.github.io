export class WebcamHandler {
    constructor() {
        this.video = document.querySelector('#webcam');
        this.stream = null;
        
        // Apply horizontal flip to video element
        this.video.style.transform = 'scaleX(-1)';
    }

    async initialize() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: 640,
                    height: 480,
                    facingMode: 'user'
                }
            });
            
            this.video.srcObject = this.stream;
            
            return new Promise((resolve) => {
                this.video.onloadedmetadata = () => {
                    this.video.play();
                    resolve(true);
                };
            });
        } catch (error) {
            console.error('Error initializing webcam:', error);
            throw error;
        }
    }

    getFrame() {
        return this.video;
    }

    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        this.video.srcObject = null;
    }
}