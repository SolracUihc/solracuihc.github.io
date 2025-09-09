const dataSources = [
    { id: 'wts_en', name: 'War Time Streets', url: 'https://raw.githubusercontent.com/solracuihc/solracuihc.github.io/master/war_time_streets_inUse.xlsx' },
    { id: 'en', name: 'Sample Data (en)', url: 'https://raw.githubusercontent.com/solracuihc/solracuihc.github.io/master/sample_street_data_en.xlsx' }
];

let sourceData = {};

async function loadData() {
    async function fetchAndParse(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to load ${url}`);
            const data = await response.arrayBuffer();
            const workbook = XLSX.read(new Uint8Array(data), { type: 'array' });
            return XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]).map(row => ({
                'historical name': String(row['historical name'] || '').trim(),
                'modern name': String(row['modern name'] || '').trim(),
                'index': String(row['index'] || '').trim(),
                'source': String(row['source'] || '').trim()
            }));
        } catch (e) {
            showError(`Failed to load data from ${url}`);
            return [];
        }
    }

    for (const source of dataSources) {
        sourceData[source.id] = await fetchAndParse(source.url);
    }
    if (Object.values(sourceData).every(data => !data.length)) {
        showError('No data loaded.');
    }
}

function populateDataSourceDropdown() {
    const select = document.getElementById('dataSource');
    dataSources.forEach(source => {
        const option = document.createElement('option');
        option.value = source.id;
        option.textContent = source.name;
        select.appendChild(option);
    });
    const bothOption = document.createElement('option');
    bothOption.value = 'both';
    bothOption.textContent = 'Both';
    bothOption.selected = true;
    select.appendChild(bothOption);
}

function getCurrentData() {
    const source = document.getElementById('dataSource').value;
    return source === 'both' ? Object.values(sourceData).flat() : sourceData[source] || [];
}

function normalizeInput(input) {
    return input ? input.trim().toLowerCase() : '';
}

function search(input, data, field) {
    if (!input || !data.length) return [];

    function levenshtein(a, b) {
        const matrix = Array(b.length + 1).fill().map(() => Array(a.length + 1).fill(0));
        for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
        for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
        for (let j = 1; j <= b.length; j++) {
            for (let i = 1; i <= a.length; i++) {
                matrix[j][i] = Math.min(
                    matrix[j][i - 1] + 1,
                    matrix[j - 1][i] + 1,
                    matrix[j - 1][i - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
                );
            }
        }
        return matrix[b.length][a.length];
    }

    const results = [];
    data.forEach(item => {
        if (field === 'general') {
            const targets = [
                { value: item['historical name'], key: 'historical name' },
                { value: item['modern name'], key: 'modern name' },
                { value: item['index'], key: 'index' }
            ];
            const matches = targets.map(t => {
                const val = (t.value || '').toLowerCase();
                const distance = levenshtein(input, val);
                const maxLen = Math.max(input.length, val.length);
                const similarity = maxLen ? 1 - distance / maxLen : 0;
                return { ...item, similarity, matchedField: t.key };
            }).filter(m => m.similarity > 0.7 || (m[m.matchedField] || '').toLowerCase().includes(input));
            if (matches.length) results.push(...matches);
        } else {
            const fieldKey = field === 'name' ? 'historical name' : field === 'modern' ? 'modern name' : 'index';
            const target = (item[fieldKey] || '').toLowerCase();
            const distance = levenshtein(input, target);
            const maxLen = Math.max(input.length, target.length);
            const similarity = maxLen ? 1 - distance / maxLen : 0;
            if (target.includes(input) || similarity > 0.7) {
                results.push({ ...item, similarity });
            }
        }
    });
    console.log(`Search for field '${field}' with input '${input}':`, results);
    return results.sort((a, b) => b.similarity - a.similarity);
}

function generateGeneralSuggestions(results) {
    if (!results.length) return [{ text: 'No matches found.', value: null, result: null }];
    return results.slice(0, 3).map(item => ({
        text: item.matchedField === 'historical name' ? item['historical name'] :
              item.matchedField === 'modern name' ? item['modern name'] : item['index'],
        item
    }));
}

function generateSpecificSuggestions(results, field) {
    if (!results.length) return [{ text: 'No matches found.', value: null, result: null }];
    const displayField = field === 'index' ? 'index' : field === 'modern' ? 'modern name' : 'historical name';
    return results.slice(0, 3).map(item => ({
        text: item[displayField] || '',
        item
    }));
}

function displayResults(results) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = results.length ? '' : '<p>No results to display.</p>';
    
    if (results.length) {
        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Street Number</th>
                    <th>Modern Street Name</th>
                    <th>Lot Number</th>
                    <th>Source</th>
                </tr>
            </thead>
            <tbody>
                ${results.map(item => `
                    <tr>
                        <td>${item['historical name'] || ''}</td>
                        <td>${item['modern name'] || ''}</td>
                        <td>${item['index'] || ''}</td>
                        <td>${item['source'] || ''}</td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        resultsDiv.appendChild(table);
    }
}

function showError(message) {
    document.getElementById('errorMessage').textContent = message;
}

function setupEventListeners() {
    const inputs = {
        name: document.getElementById('nameInput'),
        modern: document.getElementById('modernInput'),
        index: document.getElementById('indexInput'),
        general: document.getElementById('generalSearchInput')
    };
    const searchButton = document.getElementById('searchButton');
    const clearButton = document.getElementById('clearButton');
    const instructionsButton = document.getElementById('instructionsButton');
    const suggestionsDiv = document.getElementById('suggestions');
    const dataSourceSelect = document.getElementById('dataSource');
    const searchModeSelect = document.getElementById('searchMode');
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
        const inputValue = normalizeInput(inputElement.value);
        showError('');
        if (!inputValue) {
            hideSuggestions();
            return [];
        }

        const data = getCurrentData();
        const results = search(inputValue, data, field);
        suggestionsDiv.innerHTML = '';
        const suggestions = field === 'general' ? generateGeneralSuggestions(results) : generateSpecificSuggestions(results, field);
        suggestions.forEach(suggestion => {
            const p = document.createElement('p');
            const link = document.createElement('a');
            link.textContent = suggestion.text;
            link.href = '#';
            if (suggestion.item) {
                link.onclick = () => {
                    inputs.name.value = suggestion.item['historical name'] || '';
                    inputs.modern.value = suggestion.item['modern name'] || '';
                    inputs.index.value = suggestion.item['index'] || '';
                    inputs.general.value = '';
                    displayResults([suggestion.item]);
                    hideSuggestions();
                    return false;
                };
            }
            p.appendChild(link);
            suggestionsDiv.appendChild(p);
        });

        suggestions.length && suggestions[0].item ? positionSuggestions(inputElement) : hideSuggestions();
        return results;
    }

    function handleSearch() {
        const values = Object.entries(inputs).map(([field, input]) => ({ field, value: input.value }));
        const activeInput = values.find(v => v.value);
        if (!activeInput || values.filter(v => v.value).length > 1) {
            showError('Please enter only one field.');
            hideSuggestions();
            return;
        }

        const inputValue = normalizeInput(activeInput.value);
        const results = search(inputValue, getCurrentData(), activeInput.field);
        if (results.length) {
            const filteredResults = filterResultsByMode(results, searchModeSelect.value);
            displayResults(filteredResults);
            const topResult = filteredResults[0];
            inputs.name.value = topResult['historical name'] || '';
            inputs.modern.value = topResult['modern name'] || '';
            inputs.index.value = topResult['index'] || '';
            inputs.general.value = '';
            hideSuggestions();
        } else {
            displayResults([]);
            showError('No matches found.');
        }
    }

    function handleClear() {
        Object.values(inputs).forEach(input => input.value = '');
        hideSuggestions();
        displayResults([]);
        showError('');
    }

    function filterResultsByMode(results, mode) {
        return mode === 'best' ? results.slice(0, 1) : results.sort((a, b) => (a['modern name'] || '').localeCompare(b['modern name'] || ''));
    }

    Object.entries(inputs).forEach(([field, input]) => {
        input.addEventListener('keyup', () => {
            showSuggestions(input, field);
        });
    });

    dataSourceSelect.addEventListener('change', () => {
        const active = Object.entries(inputs).find(([_, i]) => i.value);
        if (active) showSuggestions(inputs[active[0]], active[0]);
    });

    searchButton.addEventListener('click', handleSearch);
    clearButton.addEventListener('click', handleClear);
    instructionsButton.addEventListener('click', () => instructionsModal.style.display = 'flex');
    closeModal.addEventListener('click', () => instructionsModal.style.display = 'none');
    instructionsModal.addEventListener('click', e => e.target === instructionsModal && (instructionsModal.style.display = 'none'));
    document.addEventListener('click', e => !e.target.closest('input, .suggestions') && hideSuggestions());
}

document.addEventListener('DOMContentLoaded', async () => {
    populateDataSourceDropdown();
    await loadData();
    setupEventListeners();
});
