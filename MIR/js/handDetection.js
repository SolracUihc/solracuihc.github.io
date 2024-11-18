export class HandDetector {
    constructor() {
        this.model = null;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            this.model = await handpose.load();
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
            const predictions = await this.model.estimateHands(video);
            if (predictions.length > 0) {
                // Get palm position
                const palm = predictions[0].landmarks[0];
                return {
                    x: -palm[0],
                    y: -palm[1],
                    z: palm[2],
                    confidence: predictions[0].score
                };
            }
            return null;
        } catch (error) {
            console.error('Error detecting hands:', error);
            return null;
        }
    }
}