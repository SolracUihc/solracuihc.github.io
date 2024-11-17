const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const audioSelect = document.getElementById('audio-select');
const beatResultsDiv = document.getElementById('beat-results');

// Create an analyser node
const analyser = audioContext.createAnalyser();
analyser.fftSize = 2048; // Size of the FFT

// Variables to store frequency data and beat results
let frequencyData = [];
let beatResults = [];

// Load audio and process it
document.getElementById('load-audio').addEventListener('click', () => {
    const selectedAudio = audioSelect.value;
    if (selectedAudio) {
        // Resume the AudioContext upon user interaction
        audioContext.resume().then(() => {
            console.log('Playback resumed successfully');

            // Fetch the audio file
            fetch(selectedAudio)
                .then(response => response.arrayBuffer())
                .then(data => audioContext.decodeAudioData(data, (buffer) => {
                    playAudio(buffer);
                    frequencyData = getFrequencyData(buffer);
                    beatResults = detectBeats(buffer);
                    console.log('Frequency Data:', frequencyData);
                    console.log('Beat Results:', beatResults);
                }, (error) => {
                    console.error('Error decoding audio data:', error);
                }))
                .catch(error => {
                    console.error('Error fetching audio file:', error);
                });
        }).catch(error => {
            console.error('Error resuming playback:', error);
        });
    } else {
        alert('Please select an audio file.');
    }
});

// Play the loaded audio
function playAudio(buffer) {
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    source.start();
}

// Get frequency data (without drawing a spectrogram)
function getFrequencyData(buffer) {
    const frequencyDataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(frequencyDataArray);
    return frequencyDataArray; // Return frequency data for further use
}

// Simple beat detection
function detectBeats(buffer) {
    const sampleRate = audioContext.sampleRate;
    const channelData = buffer.getChannelData(0); // Use the first channel
    const threshold = 0.1; // Set a threshold for beat detection
    const beats = [];

    for (let i = 0; i < channelData.length; i++) {
        if (Math.abs(channelData[i]) > threshold) {
            beats.push(i / sampleRate); // Record the time of the detected beat
        }
    }

    // Display beat results
    beatResultsDiv.innerHTML = beats.map(time => `Beat at: ${time.toFixed(2)}s`).join('<br>');
    return beats; // Return beat results for further use
}
