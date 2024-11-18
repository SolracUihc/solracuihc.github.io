import { MediaPipeHands } from "./MediaPipeHands.js";
import { ScenesManager } from "./ScenesManager.js";
import { GameController } from "./GameController.js";

/**
 * App class initializes the 3D application, sets up scene, camera, 
 * hand tracking, and user interface controls.
 */
export class App {
  constructor() {

    /**
     * ===========================================================
     * SETTING UP SCENE AND CONTROLLERS
     * ===========================================================
     */
    // Set up the scene, camera, and renderer
    ScenesManager.setup();

    // Build the scene with objects and controls
    this.gameController = new GameController();
    this.gameController.build();

    /**
     * ===========================================================
     * Web Cam Feed connected to the GameController
     * ===========================================================
     */
    // Check if webcam access is available
    if (this.hasGetUserMedia()) {
      const enableWebcamButton = document.getElementById("webcamButton");
      enableWebcamButton.addEventListener("click", (e) => {
        if (this.hasCamera) return; // Prevent multiple camera accesses
        e.preventDefault();
        this.hasCamera = true;

        // Initialize MediaPipeHands for hand tracking
        const videoElement = document.getElementById("inputVideo");
        this.mediaPipeHands = new MediaPipeHands(videoElement, (landmarks) =>
          this.gameController.onMediaPipeHandsResults(landmarks)
        );
        this.mediaPipeHands.start(); // Start the hand tracking
        enableWebcamButton.remove(); // Remove the button after enabling the camera
        this.gameController.playIntro(); // Make the welcome screen visible
      });
    } else {
      console.warn("getUserMedia() is not supported by your browser");
    }

    // Set animation loop for rendering
    ScenesManager.renderer.setAnimationLoop(() => this.gameController.animate());
  }

  /**
   * Check if the browser supports getUserMedia for webcam access.
   * @returns {boolean} True if supported, false otherwise.
   */
  hasGetUserMedia() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }
}

// Initialize the app when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => new App());