// script.js

// Load audio data
async function loadAudioData() {
    const response = await fetch('audio/havana.json');
    const feature = await response.json();
    // Populate track selector
    const trackSelector = document.getElementById('track-selector');
    
    const option = document.createElement('option');
    option.value = feature.file; // Adjust based on your data structure
    option.textContent = feature.name; // Adjust based on your data structure
    trackSelector.appendChild(option);

    response = await fetch('audio/badguy.json');
    feature = await response.json();

    option = document.createElement('option');
    option.value = feature.file; // Adjust based on your data structure
    option.textContent = feature.name; // Adjust based on your data structure
    trackSelector.appendChild(option);
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
