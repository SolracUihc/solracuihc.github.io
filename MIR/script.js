const audioSelect = document.getElementById('audioSelect');
const previewBtn = document.getElementById('previewBtn');
const audioDataDiv = document.getElementById('audioData');

// Load audio files list from GitHub
const audioFiles = [
    // List your audio JSON files here
    'badguy.wav.json',
    'havana.wav.json',
    // Add more as needed
];

audioFiles.forEach(file => {
    const option = document.createElement('option');
    option.value = file;
    option.textContent = file;
    audioSelect.appendChild(option);
});

// Preview Data
previewBtn.addEventListener('click', () => {
    const selectedFile = audioSelect.value;
    fetch(`https://raw.githubusercontent.com/yourusername/yourrepo/main/audio/${selectedFile}`)
        .then(response => response.json())
        .then(data => {
            audioDataDiv.textContent = JSON.stringify(data, null, 2);
        })
        .catch(error => {
            console.error('Error fetching the audio data:', error);
            audioDataDiv.textContent = 'Error loading data.';
        });
});
