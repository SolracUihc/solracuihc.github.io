// script.js

// Load audio data
async function loadAudioData() {
    const response = await fetch('audio/beats.json');
    const beats = await response.json();
    // Populate track selector
    const trackSelector = document.getElementById('track-selector');
    beats.forEach(track => {
        const option = document.createElement('option');
        option.value = track.file; // Adjust based on your data structure
        option.textContent = track.name; // Adjust based on your data structure
        trackSelector.appendChild(option);
    });
}

// Start the game
function startGame() {
    const selectedTrack = document.getElementById('track-selector').value;
    // Load and play audio here
    // Initialize 3D boxes based on audio data
    document.getElementById('menu').style.display = 'none';
    document.getElementById('gameCanvas').style.display = 'block';
    // Additional game logic goes here
}

// Event listeners
document.getElementById('start-button').addEventListener('click', startGame);

// Initialize
loadAudioData();
