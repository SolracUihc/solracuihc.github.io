// script.js

// Load audio data
async function loadAudioData() {
    // Display loading message
    const loadingMessage = document.getElementById('loading-message');
    loadingMessage.textContent = 'Loading audio data...';

    try {
        let data_dict = {};
        
        // Fetch first audio feature
        let response = await fetch('audio/havana.json');
        let feature = await response.json();

        // Populate track selector
        const trackSelector = document.getElementById('track-selector');
        let option = document.createElement('option');
        data_dict["beats"] = feature.beats;
        data_dict["spectrogram"] = feature.spectrogram;
        option.value = data_dict; // Adjust based on your data structure
        option.textContent = feature.name; // Adjust based on your data structure
        trackSelector.appendChild(option);

        // Fetch second audio feature
        response = await fetch('audio/badguy.json');
        feature = await response.json();

        option = document.createElement('option');
        data_dict["beats"] = feature.beats;
        data_dict["spectrogram"] = feature.spectrogram;
        option.value = data_dict; // Adjust based on your data structure
        option.textContent = feature.name; // Adjust based on your data structure
        trackSelector.appendChild(option);

        // Remove loading message
        loadingMessage.textContent = 'Finished loading audio data.';
    } catch (error) {
        // Handle errors gracefully
        loadingMessage.textContent = 'Error loading audio data.';
        console.error("Error fetching audio data:", error);
    } 
}

// Start the game
function startGame() {
    const selectedTrack = document.getElementById('track-selector').value;
    // Load and play audio here
    // Initialize 3D boxes based on audio data
    document.getElementById('menu').style.display = 'none';
    document.getElementById('gamePhase').style.display = 'block';
    // Additional game logic goes here
}

// Event listeners
document.getElementById('start-button').addEventListener('click', startGame);

// Initialize
loadAudioData();
