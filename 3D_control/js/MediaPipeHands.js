/**
 * MediaPipeHands class handles hand tracking using MediaPipe's Hands solution.
 * It captures video from a specified video element and processes hand tracking.
 */
export class MediaPipeHands {
  constructor(videoElement, onResultsCallback) {
    // Initialize the hand tracking model from MediaPipe
    const hands = new Hands({
      locateFile: (file) => {
        // Specify the URL for loading MediaPipe files
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });

    // Set options for the hand tracking model
    hands.setOptions({
      maxNumHands: 2, // Maximum number of hands to track
      modelComplexity: 1, // Complexity of the model (1 = high accuracy)
      minDetectionConfidence: 0.5, // Minimum confidence for detection
      minTrackingConfidence: 0.5, // Minimum confidence for tracking
    });

    // Set the callback function to handle results from the hand tracking model
    hands.onResults(onResultsCallback);

    // Initialize the camera to capture video from the video element
    this.camera = new Camera(videoElement, {
      async onFrame() {
        // Process each frame and send it to the hand tracking model
        await hands.send({ image: videoElement });
      },
      // Set camera dimensions based on device type
      width: this.isMobile() ? 720 : 1280,
      height: this.isMobile() ? 1280 : 720,
    });
  }

  /**
   * Check if the device is mobile based on window dimensions.
   * @returns {boolean} True if the device is mobile, false otherwise.
   */
  isMobile() {
    return window.innerWidth < window.innerHeight; // Compare width and height
  }

  /**
   * Start the camera to begin capturing video frames.
   */
  start() {
    if (this.camera) {
      this.camera.start(); // Start the camera if it's initialized
    }
  }
}
