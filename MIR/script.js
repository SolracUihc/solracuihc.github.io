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

// Function to convert spectrogram to audio
function playAudioFromSpectrogram(spectrogram) {
    // Create a new AudioBuffer
    const numSamples = spectrogram[0].length;
    const numChannels = spectrogram.length;
    const audioBuffer = audioContext.createBuffer(numChannels, numSamples, audioContext.sampleRate);

    // Fill the audio buffer with the spectrogram data
    for (let channel = 0; channel < numChannels; channel++) {
        audioBuffer.copyToChannel(new Float32Array(spectrogram[channel]), channel);
    }

    // Create a source node from the audio buffer
    audioBufferSourceNode = audioContext.createBufferSource();
    audioBufferSourceNode.buffer = audioBuffer;

    // Connect the source to the audio context's destination (speakers)
    audioBufferSourceNode.connect(audioContext.destination);

    // Start playing the audio
    audioBufferSourceNode.start(0);
    isPlaying = true;

    // Set up an event to reset the play state when the audio ends
    audioBufferSourceNode.onended = () => {
        isPlaying = false;
    };
}

// Function to pause the audio playback
function pauseAudio() {
    if (isPlaying) {
        audioBufferSourceNode.stop(); // Stop the audio
        isPlaying = false;
    }
}

// Start the game
function startGame() {
    const selectedTrack = document.getElementById('track-selector').value;
    document.getElementById('menu').style.display = 'none';
    document.getElementById('gamePhase').style.display = 'block';
    // Load and play audio here
    //let audioContext = new (window.AudioContext || window.webkitAudioContext)();
    //let audioBufferSourceNode;
    //let isPlaying = false;
    //document.getElementById('play-button').addEventListener('click', playAudioFromSpectrogram(selectedTrack.spectrogram));
    //document.getElementById('pause-button').addEventListener('click', pauseAudio);
    // Initialize 3D boxes based on audio data
    // Additional game logic goes here
}

// Event listeners
document.getElementById('start-button').addEventListener('click', startGame);

// Initialize
loadAudioData();
