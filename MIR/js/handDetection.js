// handDetection.js

let model;

// Load handpose model
async function loadHandDetectionModel() {
    model = await handpose.load(); // Load the handpose model
}

// Detect hands in the video feed
async function detectHands(videoElement) {
    if (!model) return null; // Ensure the model is loaded

    const predictions = await model.estimateHands(videoElement); // Detect hands
    if (predictions.length > 0) {
        return predictions[0].landmarks; // Return landmarks of the first detected hand
    } else {
        return null; // No hands detected
    }
}

// Load model on page load
loadHandDetectionModel();
