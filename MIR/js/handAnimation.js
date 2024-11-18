// handAnimation.js

function animateHands(handLandmarks) {
    const canvas = document.getElementById('animation-canvas');
    const context = canvas.getContext('2d');
    canvas.width = window.innerWidth; // Set canvas width
    canvas.height = window.innerHeight; // Set canvas height

    // Clear the canvas for the new frame
    context.clearRect(0, 0, canvas.width, canvas.height);

    if (handLandmarks) {
        // Draw circles for each landmark
        handLandmarks.forEach(([x, y]) => {
            context.fillStyle = 'rgba(255, 0, 0, 0.5)'; // Semi-transparent red
            context.beginPath();
            context.arc(x, y, 5, 0, Math.PI * 2);
            context.fill();
        });
    }
}

// Game loop to continuously detect hands and animate
async function gameLoop() {
    const videoElement = document.getElementById('webcam-video');
    const handLandmarks = await detectHands(videoElement); // Get hand landmarks
    animateHands(handLandmarks); // Animate based on detected hands
    requestAnimationFrame(gameLoop); // Loop
}

// Start the game loop
gameLoop();
