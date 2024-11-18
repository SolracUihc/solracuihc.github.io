// Import MediaPipe Hands from CDN
const mpHands = window.Hands;

export class HandDetector {
    constructor() {
        this.hands = null;
        this.isInitialized = false;
        this.lastLandmarks = [];
        this.handScale = 0.8;
        this.distScale = 3;
        this.handOffsetZDistance = 0;
    }

    calculateHandDepth(landmarks) {
        const wrist = landmarks[0];
        const pointsToCheck = [5, 9, 3, 17];
        
        // Calculate average palm size
        let distances = pointsToCheck.map(index => {
            const point = landmarks[index];
            return Math.sqrt(
                Math.pow(wrist.x - point.x, 2) + 
                Math.pow(wrist.y - point.y, 2) + 
                Math.pow(wrist.z - point.z, 2)
            );
        });
        
        const palmSize = Math.max(...distances);
        
        // Calculate depth based on palm size
        const depth = palmSize * 10;
        return [depth, depth+this.handOffsetZDistance, wrist];
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
                maxNumHands: 2,
                modelComplexity: 1,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            // Set up the results handler
            this.hands.onResults((results) => {
                if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                    this.lastLandmarks = results.multiHandLandmarks;
                } else {
                    this.lastLandmarks = [];
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
            
            // Return array of hand data
            if (this.lastLandmarks.length > 0) {
                return this.lastLandmarks.map((landmarks, index) => {
                    const palm = landmarks[0];
                    let [depth, depth2Offset, wrist] = this.calculateHandDepth(landmarks);
                    console.log(depth);
                    return {
                        landmarks: landmarks,
                        depth: depth,
                        depth2Offset: depth2Offset,
                        wrist: wrist,
                        confidence: 1.0,  // MediaPipe doesn't provide per-landmark confidence
                        handIndex: index  // Add hand index for identification
                    };
                });
            }
            return [];
        } catch (error) {
            console.error('Error detecting hands:', error);
            return [];
        }
    }
}
