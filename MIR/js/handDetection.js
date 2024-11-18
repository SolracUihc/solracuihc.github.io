// Import MediaPipe Hands from CDN
const mpHands = window.Hands;

export class HandDetector {
    constructor() {
        this.hands = null;
        this.isInitialized = false;
        this.lastPrediction = null;
    }

    async initialize() {
        try {
            this.hands = new mpHands({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
                }
            });

            // Configure the hand detection
            this.hands.setOptions({
                maxNumHands: 1,
                modelComplexity: 1,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            // Set up the results handler
            this.hands.onResults((results) => {
                if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                    const palm = results.multiHandLandmarks[0][0]; // First landmark is the wrist/palm
                    this.lastPrediction = {
                        x: -palm.x,
                        y: -palm.y,
                        z: palm.z,
                        confidence: results.multiHandedness[0].score
                    };
                } else {
                    this.lastPrediction = null;
                }
            });

            this.isInitialized = true;
            console.log('Hand detection model loaded');
        } catch (error) {
            console.error('Error loading hand detection model:', error);
            throw error;
        }
    }

    async detectHands(video) {
        if (!this.isInitialized) {
            throw new Error('Hand detector not initialized');
        }

        try {
            await this.hands.send({ image: video });
            return this.lastPrediction;
        } catch (error) {
            console.error('Error detecting hands:', error);
            return null;
        }
    }
}
