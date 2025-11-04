/* ==================  FULL WORKING JS  ================== */
const DATA_SOURCES = [
    {id:'wts_en',  name:'Japanese Property Registration', url:'https://raw.githubusercontent.com/solracuihc/solracuihc.github.io/master/Street_Index_processed_with_coords.xlsx'},
    {id:'1938_en', name:'1938 Street Index',               url:'https://raw.githubusercontent.com/solracuihc/solracuihc.github.io/master/Street_Index_processed_with_coords.xlsx'}
];

let sourceData = {}, map = null, markerLayer = null, currentResults = [];

function populateDataSourceDropdown() {
    const sel = document.getElementById('dataSource');
    sel.innerHTML = '<option value="both">Both</option>';
    DATA_SOURCES.forEach(s => sel.add(new Option(s.name, s.id)));
    sel.value = 'both';
}

/* ---- LOAD XLSX + COORDS ---- */
async function loadData() {
    const fetchAndParse = async url => {
        const res = await fetch(url);
        const buf = await res.arrayBuffer();
        const wb = XLSX.read(buf, {type:'array'});
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

        return rows.map(r => {
            // ── 1. Normal text columns (unchanged) ─────────────────────
            const historicalName   = String(r['historical name']   || '').trim();
            const modernName       = String(r['modern name']       || '').trim();
            const buildingName     = String(r['building name']     || '').trim();
            const index            = String(r['index']             || '').trim();
            const streetInfo       = String(r['street information']|| '').trim();
            const source           = String(r['source']            || '').trim();

            // ── 2. NEW: parse "(y, x)" string ───────────────────────────
            let coord_x = NaN, coord_y = NaN;
            const coordStr = r['historical street coordinates'];
            if (typeof coordStr === 'string') {
                // Remove parentheses & split
                const cleaned = coordStr.replace(/[()]/g, '').trim();
                const parts   = cleaned.split(',').map(s => s.trim());
                if (parts.length === 2) {
                    // NOTE: the original file stores (lat, lng) → Leaflet needs [lat, lng]
                    coord_x = parseFloat(parts[0]);   // latitude  (y)
                    coord_y = parseFloat(parts[1]);   // longitude (x)
                }
            }

            return {
                'historical name': historicalName,
                'modern name'    : modernName,
                'building name'  : buildingName,
                'index'          : index,
                'street information': streetInfo,
                'source'         : source,
                coord_x,   // longitude
                coord_y    // latitude
            };
        });
    };
    for (const s of DATA_SOURCES) sourceData[s.id] = await fetchAndParse(s.url);
}

/* ---- MAP ---- */

// 1. Initialise map + create marker layer
function initMap() {
    if (map) return;
    const el = document.getElementById('map');
    el.style.display = 'block';
    map = L.map('map').setView([22.3193, 114.1694], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);
    markerLayer = L.layerGroup().addTo(map);   // ← THIS LINE WAS MISSING
}

// clear everything
function clearMap() {
    // document.getElementById('map').style.display = 'none';
    if (markerLayer) markerLayer.clearLayers();
}

// 2. Fly to a result + open its popup
function flyTo(idx) {
    const r = currentResults[idx];
    if (!r || isNaN(r.coord_x)) return;
    map.flyTo([r.coord_y, r.coord_x], 17);
    markerLayer.eachLayer(m => {
        if (m._idx === idx) m.openPopup();
    });
}

/* ---- SEARCH ---- */
function lev(a,b){
    const m=[]; for(let i=0;i<=b.length;i++){m[i]=[i];}
    for(let i=1;i<=a.length;i++)m[0][i]=i;
    for(let j=1;j<=b.length;j++)for(let i=1;i<=a.length;i++)
        m[j][i]=Math.min(m[j][i-1]+1, m[j-1][i]+1, m[j-1][i-1]+(a[i-1]===b[j-1]?0:1));
    return m[b.length][a.length];
}
function search(term, data, field){
    if (!term) return [];
    const out=[];
    data.forEach(it=>{
        let best=0;
        ['historical name','modern name','building name','index','street information'].forEach(f=>{
            const v = (it[f]||'').toLowerCase();
            const sim = 1 - lev(term,v)/Math.max(term.length,v.length);
            if (v.includes(term) || sim>0.85) {
                out.push({...it, sim, field:f});
                // console.log(it);
                best=Math.max(best,sim);
            }
        });
    });
    return out.sort((a,b)=>b.sim-a.sim);
}

/* ---- SUGGESTIONS ---- */
const inputs = {
    name:    document.getElementById('nameInput'),
    modern:  document.getElementById('modernInput'),
    index:   document.getElementById('indexInput'),
    general: document.getElementById('generalSearchInput')
};
const suggDiv = document.getElementById('suggestions');

function showSuggs(el, field){
    const val = el.value.trim().toLowerCase();
    suggDiv.innerHTML='';
    if (!val) return suggDiv.style.display='none';
    const hits = search(val, getCurrentData(), field).slice(0,3);
    if (!hits.length) return suggDiv.style.display='none';

    hits.forEach(h=>{
        const a = document.createElement('a');
        a.href='#';
        a.textContent = h[field==='general'?h.field : field==='name'?'historical name':field==='modern'?'modern name':'index'];
        a.onclick = e=>{
            e.preventDefault();
            Object.values(inputs).forEach(i=>i.value='');
            el.value = a.textContent;
            handleSearch();
        };
        suggDiv.appendChild(a);
    });
    const r = el.getBoundingClientRect();
    suggDiv.style.top = r.bottom + window.scrollY + 'px';
    suggDiv.style.left = r.left + window.scrollX + 'px';
    suggDiv.style.width = r.width + 'px';
    suggDiv.style.display = 'block';
}
Object.entries(inputs).forEach(([f,el])=>el.addEventListener('input',()=>showSuggs(el,f)));

/* ---- RESULTS ---- */
function getCurrentData(){
    const sel = document.getElementById('dataSource').value;
    return sel==='both' ? Object.values(sourceData).flat() : sourceData[sel]||[];
}

// 3. DISPLAY RESULTS – now really adds pins
function displayResults(res) {
    currentResults = res;
    const div = document.getElementById('results');
    div.innerHTML = res.length ? '' : '<p>No results to display.</p>';
    if (!res.length) return clearMap();

    initMap();
    markerLayer.clearLayers();          // ← clear old pins
    const tbl = document.createElement('table');
    const head = tbl.insertRow();
    ['Street Number','Modern Name','Building','Lot',''].forEach(t => {
        const th = document.createElement('th');
        th.textContent = t;
        head.appendChild(th);
    });
    
    res.forEach((r, i) => {
        // --- table row ---
        const tr = tbl.insertRow();
        tr.className = 'tr-collapsible';
        tr.dataset.idx = i;
        ['historical name','modern name','building name','index'].forEach(k => {
            const td = tr.insertCell();
            td.innerHTML = escape(r[k] || '');
        });
        const tdT = tr.insertCell();
        tdT.innerHTML = '<span class="toggle-icon">▼</span>';

        // --- extra info row ---
        const ex = tbl.insertRow();
        ex.className = 'extra-row';
        ex.dataset.idx = i;
        const exTd = ex.insertCell();
        exTd.colSpan = 5;
        exTd.innerHTML = `<strong>Street Info:</strong> ${escape(r['street information'])}<br><strong>Source:</strong> ${escape(r['source'])}`;

        // toggle
        tdT.onclick = e => {
            e.stopPropagation();
            const open = ex.style.display === 'table-row';
            ex.style.display = open ? 'none' : 'table-row';
            tdT.querySelector('.toggle-icon').textContent = open ? '▼' : '▲';
        };
        tr.onclick = () => flyTo(i);

        // --- ADD PIN (THIS WAS BROKEN BEFORE) ---
        if (r.coord_y && r.coord_x) {
            const marker = L.marker([r.coord_y, r.coord_x])
                .bindPopup(`<b>${escape(r['historical name'])}</b><br>${escape(r['modern name'])}<br>Lot: ${escape(r['index'])}`);
            marker._idx = i;
            marker.addTo(markerLayer)               // ← ADD TO LAYER
                  .on('click', () => flyTo(i));
        }
    });
    div.appendChild(tbl);
}

function escape(t){const d=document.createElement('div');d.textContent=t;return d.innerHTML;}

/* ---- SEARCH / CLEAR ---- */
function handleSearch(){
    const active = Object.entries(inputs).find(([_,el])=>el.value.trim());
    if (!active) return showError('Enter one field');
    const [field, el] = active;
    const hits = search(el.value.trim().toLowerCase(), getCurrentData(), field);
    const mode = document.getElementById('searchMode').value;
    const final = mode==='best' ? hits.slice(0,1) : hits;
    displayResults(final);
    suggDiv.style.display='none';
    showError('');
}
function handleClear(){
    Object.values(inputs).forEach(i=>i.value='');
    displayResults([]);
    showError('');
}
function showError(msg){document.getElementById('errorMessage').textContent=msg;}

/* ---- MODALS ---- */
document.getElementById('instructionsButton').onclick = ()=>document.getElementById('instructionsModal').style.display='flex';
document.getElementById('abbreviationsButton').onclick = ()=>document.getElementById('abbreviationsModal').style.display='flex';
document.querySelectorAll('.close').forEach(c=>c.onclick=()=>c.closest('.modal').style.display='none');
window.onclick = e=>{ if(e.target.classList.contains('modal')) e.target.style.display='none'; };

/* ---- BUTTONS ---- */
document.getElementById('searchButton').onclick = handleSearch;
document.getElementById('clearButton').onclick = handleClear;

/* ---- INIT ---- */
document.addEventListener('DOMContentLoaded', async ()=>{
    populateDataSourceDropdown();
    await loadData();
    document.getElementById('dataSource').addEventListener('change',()=>{/* refresh sugg if needed */});
});