// Data storage
let streetData = [];

// Data Loader Component
async function loadData() {
    try {
        // Replace with your GitHub raw URL
        const response = await fetch('https://raw.githubusercontent.com/SolracUihc/solracuihc.github.io/master/streets.xlsx');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.arrayBuffer();
        const uint8Array = new Uint8Array(data);
        const workbook = XLSX.read(uint8Array, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet);
        streetData = json.map(row => ({
            name: String(row.name).trim(),
            index: String(row.index).trim()
        }));
        if (streetData.length === 0) {
            showError('Excel file is empty or invalid.');
        }
    } catch (e) {
        showError('Failed to load or parse Excel file from GitHub. Check the URL and ensure the repo is public.');
    }
}

// Input Handler Component
function normalizeInput(input, field) {
    if (!input) return { normalized: '', type: field };
    const normalized = input.trim().toLowerCase();
    return { normalized, type: field }; // 'name' or 'index'
}

// Search Engine Component
function search(inputObj, data) {
    if (!inputObj.normalized || data.length === 0) return [];
    
    const results = [];
    const fieldToSearch = inputObj.type;
    const returnField = inputObj.type === 'index' ? 'name' : 'index';
    
    // Simple Levenshtein distance for fuzzy matching
    function levenshtein(a, b) {
        const matrix = Array(b.length + 1).fill().map(() => Array(a.length + 1).fill(0));
        for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
        for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
        for (let j = 1; j <= b.length; j++) {
            for (let i = 1; i <= a.length; i++) {
                const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(
                    matrix[j][i - 1] + 1,
                    matrix[j - 1][i] + 1,
                    matrix[j - 1][i - 1] + indicator
                );
            }
        }
        return matrix[b.length][a.length];
    }
    
    data.forEach(item => {
        const target = item[fieldToSearch].toLowerCase();
        const distance = levenshtein(inputObj.normalized, target);
        const maxLen = Math.max(inputObj.normalized.length, target.length);
        const similarity = 1 - distance / maxLen;
        
        if (target === inputObj.normalized || similarity > 0.7 || target.includes(inputObj.normalized)) {
            results.push({ ...item, similarity });
        }
    });
    
    return results.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
}

// Suggestion Generator Component
function generateSuggestions(results, inputObj) {
    if (results.length === 0) return ['No close matches found. Try a different input.'];
    const field = inputObj.type;
    return results.slice(0, 3).map(item => ({
        text: `Did you mean "${item[field]}"?`,
        value: item[field],
        result: inputObj.type === 'index' ? item.name : item.index
    }));
}

// Result Display Component
function displayResults(results, inputObj) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';
    
    if (results.length === 0) {
        resultsDiv.innerHTML = '<p>No results found.</p>';
        return;
    }
    
    results.forEach(item => {
        const result = inputObj.type === 'index' ? item.name : item.index;
        const p = document.createElement('p');
        p.textContent = `${inputObj.type === 'index' ? 'Street Name' : 'Index'}: ${result}`;
        resultsDiv.appendChild(p);
    });
}

// Confirmation Display
function displayConfirmation(name, index) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `<p><strong>${name} is in ${index}.</strong></p>`;
}

// Error and Feedback Handler Component
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
}

// User Interface Component (event handling)
function setupEventListeners() {
    const nameInput = document.getElementById('nameInput');
    const indexInput = document.getElementById('indexInput');
    const button = document.getElementById('searchButton');
    const suggestionsDiv = document.getElementById('suggestions');
    
    function performSearch(inputElement, field) {
        const inputValue = inputElement.value;
        const inputObj = normalizeInput(inputValue, field);
        document.getElementById('errorMessage').textContent = '';
        
        if (!inputValue) {
            suggestionsDiv.innerHTML = '';
            document.getElementById('results').innerHTML = '';
            return;
        }
        
        const results = search(inputObj, streetData);
        displayResults(results, inputObj);
        
        // Display suggestions
        suggestionsDiv.innerHTML = '';
        const suggestions = generateSuggestions(results, inputObj);
        suggestions.forEach(suggestion => {
            const p = document.createElement('p');
            if (suggestion.text.startsWith('Did you mean')) {
                const link = document.createElement('a');
                link.textContent = suggestion.text;
                link.href = '#';
                link.onclick = () => {
                    if (inputObj.type === 'name') {
                        nameInput.value = suggestion.value;
                        indexInput.value = suggestion.result;
                    } else {
                        indexInput.value = suggestion.value;
                        nameInput.value = suggestion.result;
                    }
                    displayConfirmation(
                        inputObj.type === 'name' ? suggestion.value : suggestion.result,
                        inputObj.type === 'index' ? suggestion.value : suggestion.result
                    );
                    suggestionsDiv.innerHTML = '';
                    return false;
                };
                p.appendChild(link);
            } else {
                p.textContent = suggestion.text;
            }
            suggestionsDiv.appendChild(p);
        });
        
        return results;
    }
    
    function handleSearchButton() {
        const nameValue = nameInput.value;
        const indexValue = indexInput.value;
        let results = [];
        
        if (nameValue && !indexValue) {
            results = performSearch(nameInput, 'name');
        } else if (indexValue && !nameValue) {
            results = performSearch(indexInput, 'index');
        } else {
            showError('Please enter either a street name or an index, not both.');
            return;
        }
        
        if (results.length > 0) {
            const topResult = results[0];
            if (nameValue) {
                nameInput.value = topResult.name;
                indexInput.value = topResult.index;
                displayConfirmation(topResult.name, topResult.index);
            } else {
                indexInput.value = topResult.index;
                nameInput.value = topResult.name;
                displayConfirmation(topResult.name, topResult.index);
            }
            suggestionsDiv.innerHTML = '';
        }
    }
    
    nameInput.addEventListener('keyup', () => {
        if (!indexInput.value) performSearch(nameInput, 'name');
    });
    indexInput.addEventListener('keyup', () => {
        if (!nameInput.value) performSearch(indexInput, 'index');
    });
    button.addEventListener('click', handleSearchButton);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    setupEventListeners();
});
