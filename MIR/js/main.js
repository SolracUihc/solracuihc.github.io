// main.js

// Initialize global variables
let score = 0; // Player score
let isGameActive = false; // Flag to track if the game is active
const scoreDisplay = document.getElementById('score'); // Score display element
const endGameButton = document.getElementById('end-game-button'); // End game button
const playAgainButton = document.getElementById('play-again-button'); // Play again button

// Start the game
function startGame() {
    score = 0; // Reset score
    isGameActive = true; // Set game to active

    // Hide the start button and show the end game button
    document.getElementById('start-button').classList.add('hidden');
    endGameButton.classList.remove('hidden');

    // Start the game loop
    gameLoop();
}

// End the game
function endGame() {
    isGameActive = false; // Set game to inactive
    // Show play again button and display final score
    playAgainButton.classList.remove('hidden');
    document.getElementById('final-score-value').textContent = score;
}

// Game loop to handle capturing frames and detecting hands
async function gameLoop() {
    if (!isGameActive) return; // Exit if the game is not active

    // Get the video element for hand detection
    const videoElement = document.getElementById('webcam-video');
    
    // Detect hands and get coordinates
    const handLandmarks = await detectHands(videoElement);
    
    // Animate based on detected hands
    animateHands(handLandmarks);

    // Check for collisions and update score
    checkCollisions(handLandmarks);

    // Update the score display
    scoreDisplay.textContent = score;

    // Request the next animation frame
    requestAnimationFrame(gameLoop);
}

// Function to check for collisions
function checkCollisions(handLandmarks) {
    // Implement collision detection logic here
    if (handLandmarks) {
        // For example, check if any hand landmark intersects with a target
        // This is a placeholder for collision detection logic
        // Update the score based on collision results
        score += 1; // Increment score for demonstration
    }
}

// Event listeners for buttons
document.getElementById('start-button').addEventListener('click', startGame);
endGameButton.addEventListener('click', endGame);
playAgainButton.addEventListener('click', () => {
    window.location.href = 'end.html'; // Redirect to the end page
});

// Redirect to the home page when the play again button is clicked
document.getElementById('play-again-button').addEventListener('click', () => {
    window.location.href = 'index.html'; // Redirect to home page
});

// Start the game when the page loads or when the button is clicked
window.onload = () => {
    // Optionally load any initial data or models here
};
