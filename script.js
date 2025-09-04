// Data storage
let enData = [];
let zhData = [];

// Data Loader Component
async function loadData() {
    const enUrl = 'https://raw.githubusercontent.com/solracuihc/solracuihc.github.io/master/sample_street_data_en.xlsx';
    const zhUrl = 'https://raw.githubusercontent.com/solracuihc/solracuihc.github.io/master/sample_street_data_zh.xlsx';

    async function fetchAndParse(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.arrayBuffer();
            const uint8Array = new Uint8Array(data);
            const workbook = XLSX.read(uint8Array, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(sheet);
            return json.map(row => ({
                'historical name': String(row['historical name'] || '').trim(),
                'index': String(row['index'] || '').trim(),
                'modern name': String(row['modern name'] || '').trim(),
                'source': String(row['source'] || '').trim()
            }));
        } catch (e) {
            showError(`Failed to load file from ${url}. Check the URL.`);
            return [];
        }
    }

    enData = await fetchAndParse(enUrl);
    zhData = await fetchAndParse(zhUrl);

    if (enData.length === 0 && zhData.length === 0) {
        showError('No data loaded from either file.');
    }
}

// Get current data based on source selection
function getCurrentData() {
    const source = document.getElementById('dataSource').value;
    if (source === 'en') return enData;
    if (source === 'zh') return zhData;
    return [...enData, ...zhData];
}

// Input Handler Component
function normalizeInput(input, field) {
    if (!input) return { normalized: '', type: field };
    const normalized = input.trim().toLowerCase();
    // For general search, guess type based on format
    if (field === 'general') {
        const isIndex = normalized.includes('.') || /\b[a-z]+\.\d+/.test(normalized);
        return { normalized, type: isIndex ? 'index' : 'name' };
    }
    return { normalized, type: field }; // 'name' or 'index'
}

// Search Engine Component
function search(inputObj, data) {
    if (!inputObj.normalized || data.length === 0) return [];
    
    const results = [];
    
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
        let target = '';
        let similarity = 0;
        if (inputObj.type === 'index') {
            target = (item['index'] || '').toLowerCase();
            const distance = levenshtein(inputObj.normalized, target);
            const maxLen = Math.max(inputObj.normalized.length, target.length);
            similarity = maxLen ? 1 - distance / maxLen : 0;
        } else {
            // For name, only search historical name
            target = (item['historical name'] || '').toLowerCase();
            const distance = levenshtein(inputObj.normalized, target);
            const maxLen = Math.max(inputObj.normalized.length, target.length);
            similarity = maxLen ? 1 - distance / maxLen : 0;
            if (target.includes(inputObj.normalized)) {
                similarity = 1;
            }
        }
        
        if (target === inputObj.normalized || similarity > 0.7 || target.includes(inputObj.normalized)) {
            results.push({ ...item, similarity });
        }
    });
    
    // Sort by similarity descending
    return results.sort((a, b) => b.similarity - a.similarity);
}

// Filter results based on mode
function filterResultsByMode(results, mode) {
    if (mode === 'best') {
        return results.slice(0, 1); // Most similar only
    } else {
        // Search All: all matches, sorted alphabetically by modern name
        return results.sort((a, b) => (a['modern name'] || '').localeCompare(b['modern name'] || ''));
    }
}

// Suggestion Generator Component
function generateSuggestions(results, inputObj) {
    if (results.length === 0) return [{ text: 'No close matches found.', value: null, result: null }];
    return results.slice(0, 3).map(item => ({
        text: inputObj.type === 'index' ? item['index'] : item['historical name'],
        item // Full item for selection
    }));
}

// Result Display Component (as table)
function displayResults(results) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';
    
    if (results.length === 0) {
        resultsDiv.innerHTML = '<p>No results to display.</p>';
        return;
    }
    
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    ['Historical Name', 'Modern Name', 'Index', 'Source'].forEach(col => {
        const th = document.createElement('th');
        th.textContent = col;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    results.forEach(item => {
        const row = document.createElement('tr');
        ['historical name', 'modern name', 'index', 'source'].forEach(key => {
            const td = document.createElement('td');
            td.textContent = item[key] || '';
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    
    resultsDiv.appendChild(table);
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
    const generalSearchInput = document.getElementById('generalSearchInput');
    const dataSourceSelect = document.getElementById('dataSource');
    const searchModeSelect = document.getElementById('searchMode');
    const searchButton = document.getElementById('searchButton');
    const clearButton = document.getElementById('clearButton');
    const instructionsButton = document.getElementById('instructionsButton');
    const suggestionsDiv = document.getElementById('suggestions');
    const instructionsModal = document.getElementById('instructionsModal');
    const closeModal = document.getElementById('closeModal');
    
    function positionSuggestions(inputElement) {
        const rect = inputElement.getBoundingClientRect();
        suggestionsDiv.style.top = `${rect.bottom + window.scrollY}px`;
        suggestionsDiv.style.left = `${rect.left + window.scrollX}px`;
        suggestionsDiv.style.width = `${rect.width}px`;
        suggestionsDiv.style.display = 'block';
    }
    
    function hideSuggestions() {
        suggestionsDiv.style.display = 'none';
        suggestionsDiv.innerHTML = '';
    }
    
    function showSuggestions(inputElement, field) {
        const inputValue = inputElement.value;
        const inputObj = normalizeInput(inputValue, field);
        document.getElementById('errorMessage').textContent = '';
        
        if (!inputValue) {
            hideSuggestions();
            return [];
        }
        
        const currentData = getCurrentData();
        let results = search(inputObj, currentData);
        
        // Only show suggestions, do not update results
        suggestionsDiv.innerHTML = '';
        const suggestions = generateSuggestions(results, inputObj);
        suggestions.forEach(suggestion => {
            const p = document.createElement('p');
            const link = document.createElement('a');
            link.textContent = suggestion.text;
            link.href = '#';
            if (suggestion.item) {
                link.onclick = () => {
                    nameInput.value = suggestion.item['modern name'] || suggestion.item['historical name'] || '';
                    indexInput.value = suggestion.item['index'] || '';
                    generalSearchInput.value = '';
                    displayResults([suggestion.item]);
                    hideSuggestions();
                    return false;
                };
            }
            p.appendChild(link);
            suggestionsDiv.appendChild(p);
        });
        
        if (suggestions.length > 0 && suggestions[0].item) {
            positionSuggestions(inputElement);
        } else {
            hideSuggestions();
        }
        
        return results;
    }
    
    function handleSearchButton() {
        const nameValue = nameInput.value;
        const indexValue = indexInput.value;
        const generalValue = generalSearchInput.value;
        let results = [];
        
        if (nameValue && !indexValue && !generalValue) {
            const inputObj = normalizeInput(nameValue, 'name');
            results = search(inputObj, getCurrentData());
        } else if (indexValue && !nameValue && !generalValue) {
            const inputObj = normalizeInput(indexValue, 'index');
            results = search(inputObj, getCurrentData());
        } else if (generalValue && !nameValue && !indexValue) {
            const inputObj = normalizeInput(generalValue, 'general');
            results = search(inputObj, getCurrentData());
        } else {
            showError('Please enter only one field: Street Number, Lot Number, or Search.');
            hideSuggestions();
            return;
        }
        
        if (results.length > 0) {
            const mode = searchModeSelect.value;
            results = filterResultsByMode(results, mode);
            displayResults(results);
            const topResult = results[0];
            nameInput.value = topResult['modern name'] || topResult['historical name'] || '';
            indexInput.value = topResult['index'] || '';
            generalSearchInput.value = '';
            hideSuggestions();
        } else {
            displayResults([]);
            showError('No matches found.');
        }
    }
    
    function handleClear() {
        nameInput.value = '';
        indexInput.value = '';
        generalSearchInput.value = '';
        hideSuggestions();
        displayResults([]);
        showError('');
    }
    
    function showInstructions() {
        instructionsModal.style.display = 'flex';
    }
    
    function hideInstructions() {
        instructionsModal.style.display = 'none';
    }
    
    nameInput.addEventListener('keyup', () => {
        if (!indexInput.value && !generalSearchInput.value) showSuggestions(nameInput, 'name');
        else hideSuggestions();
    });
    indexInput.addEventListener('keyup', () => {
        if (!nameInput.value && !generalSearchInput.value) showSuggestions(indexInput, 'index');
        else hideSuggestions();
    });
    generalSearchInput.addEventListener('keyup', () => {
        if (!nameInput.value && !indexInput.value) showSuggestions(generalSearchInput, 'general');
        else hideSuggestions();
    });
    
    // Re-search on option changes
    dataSourceSelect.addEventListener('change', () => {
        const activeInput = nameInput.value ? nameInput : indexInput.value ? indexInput : generalSearchInput.value ? generalSearchInput : null;
        if (activeInput) {
            const field = activeInput === nameInput ? 'name' : activeInput === indexInput ? 'index' : 'general';
            showSuggestions(activeInput, field);
        }
    });
    searchModeSelect.addEventListener('change', () => {
        // Only affects button click, no action needed here
    });
    
    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('input') && !e.target.closest('.suggestions')) {
            hideSuggestions();
        }
    });
    
    // Instructions modal events
    instructionsButton.addEventListener('click', showInstructions);
    closeModal.addEventListener('click', hideInstructions);
    // Close modal when clicking outside content
    instructionsModal.addEventListener('click', (e) => {
        if (e.target === instructionsModal) {
            hideInstructions();
        }
    });
    
    searchButton.addEventListener('click', handleSearchButton);
    clearButton.addEventListener('click', handleClear);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Debug CSS loading
    const cssLink = document.querySelector('link[href="styles.css"]');
    if (!cssLink.sheet) {
        console.error('CSS file failed to load. Check path or file presence.');
    } else {
        console.log('CSS file loaded successfully.');
    }
    
    await loadData();
    setupEventListeners();
});
