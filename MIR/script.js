const audioSelect = document.getElementById('audioSelect');
const previewBtn = document.getElementById('previewBtn');
const audioDataDiv = document.getElementById('audioData');

// Load audio files list from GitHub
const audioFiles = [
    // List your audio JSON files here
    'badguy.json',
    'havana.json',
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
    const url = `https://raw.githubusercontent.com/SolracUihc/solracuihc.github.io/SolracUihc-patch-1/MIR/audio/${selectedFile}`;
    
    console.log('Fetching data from:', url); // Log the URL being fetched
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text(); // Get the response as text first
        })
        .then(text => {
            try {
                const data = JSON.parse(text); // Parse the text as JSON
                audioDataDiv.textContent = JSON.stringify(data, null, 2);
            } catch (e) {
                console.error('Error parsing JSON:', e);
                audioDataDiv.textContent = 'Error parsing JSON: ' + e.message;
            }
        })
        .catch(error => {
            console.error('Error fetching the audio data:', error);
            audioDataDiv.textContent = 'Error loading data: ' + error.message;
        });
});
