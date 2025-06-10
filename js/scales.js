document.addEventListener('DOMContentLoaded', () => {

    // === DOM ELEMENTS ===
    const scaleListContainer = document.getElementById('scale-list-container');
    const searchInput = document.getElementById('scale-search');
    const keySelector = document.getElementById('key-selector');

    if (!scaleListContainer) return; // Exit if we're not on the scales page

    // === GLOBAL STATE ===
    let allScales = [];
    let activeKey = 'C';

    // === MUSIC THEORY HELPERS ===
    const allNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteAliasMap = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };

    // Placeholder for audio
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    let audioCtx;
    if (AudioContext) audioCtx = new AudioContext();

    // --- MAIN INITIALIZATION ---
    async function initializePage() {
        try {
            const response = await fetch('json/scales.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            allScales = await response.json();
            renderScales();
            setupEventListeners();
        } catch (error) {
            console.error("Could not fetch or parse scales data:", error);
            scaleListContainer.innerHTML = '<p class="card-placeholder" style="color: #ff8b8b;">Error: Could not load scales data.</p>';
        }
    }

    // --- TRANSPOSITION ENGINE ---
    function transposeScale(notesArray, targetKey) {
        const targetKeyIndex = allNotes.indexOf(targetKey);
        if (targetKeyIndex === -1) return notesArray;

        return notesArray.map(note => {
            const normalizedNote = note.endsWith('b') ? noteAliasMap[note] : note;
            const originalIndex = allNotes.indexOf(normalizedNote.replace(/ /g, ''));
            if (originalIndex === -1) return note;

            const newIndex = (originalIndex + targetKeyIndex) % 12;
            return allNotes[newIndex];
        });
    }

    // --- RENDERING LOGIC ---
    function renderScales() {
        const searchTerm = searchInput.value.toLowerCase().trim();

        const filteredScales = allScales.filter(scale => {
            const ragaName = scale.raga === '-' ? scale.westernScale : scale.raga;
            const searchTerms = `${scale.no} ${ragaName.toLowerCase()} ${scale.westernScale.toLowerCase()}`;
            return searchTerms.includes(searchTerm);
        });

        if (filteredScales.length === 0) {
            scaleListContainer.innerHTML = '<p class="card-placeholder">No scales found.</p>';
            return;
        }

        const cardsHtml = filteredScales.map(scale => {
            const originalAscNotes = scale.westernAsc.split(' ');
            const originalDescNotes = scale.westernDesc.split(' ');
            
            const transposedAsc = transposeScale(originalAscNotes, activeKey);
            const transposedDesc = transposeScale(originalDescNotes, activeKey);

            const ragaName = scale.raga === '-' ? scale.westernScale : scale.raga;
            const westernName = scale.raga !== '-' && scale.westernScale ? `<span class="scale-meta">${scale.westernScale}</span>` : '';
            const ragaNumberHTML = parseInt(scale.no) <= 72 ? `<div class="raga-number">#${scale.no}</div>` : '';
            
            // =========================================================================
            //  THE DEFINITIVE FIX IS HERE:
            //  We pass the *TRANSPOSED* notes to the keyboard builder. This makes
            //  the dots move to the correct keys when you change the key.
            // =========================================================================
            const keyboardHTML = generateMiniKeyboardHTML(transposedAsc, transposedDesc);

            return `
                <div class="composer-card scale-card">
                    <div class="card-header">
                        <div class="card-title">
                            <h2>${ragaName}</h2>
                            ${westernName}
                        </div>
                        ${ragaNumberHTML}
                    </div>
                    <div class="note-display-section">
                        <div class="scale-column">
                            <h3>Ascending</h3>
                            <p class="carnatic-notes">${scale.carnaticAsc}</p>
                            <p class="western-notes-display">${transposedAsc.join(' ')}</p>
                        </div>
                        <div class="scale-column">
                            <h3>Descending</h3>
                            <p class="carnatic-notes">${scale.carnaticDesc}</p>
                            <p class="western-notes-display">${transposedDesc.join(' ')}</p>
                        </div>
                    </div>
                    ${keyboardHTML}
                    <button class="listen-btn play-scale-btn" data-scale-notes="${transposedAsc.join(',').replace(/,C$/, '')}">Play Scale</button>
                </div>`;
        }).join('');
        
        scaleListContainer.innerHTML = cardsHtml;
    }

    // This function receives the set of notes to display and correctly places dots on the static C-to-C keyboard.
    function generateMiniKeyboardHTML(ascNotes, descNotes) {
        const notesInScale = new Set([...ascNotes, ...descNotes]);
        let keyboardHTML = `<div class="mini-keyboard-wrapper"><div class="mini-keyboard-container">`;

        // White keys
        ['C', 'D', 'E', 'F', 'G', 'A', 'B'].forEach(key => {
            const hasDot = notesInScale.has(key);
            keyboardHTML += `<div class="mini-key mini-white ${hasDot ? 'has-dot' : ''}" data-note="${key}"></div>`;
        });
        
        // Black keys
        ['C#', 'D#', 'F#', 'G#', 'A#'].forEach(key => {
            const hasDot = notesInScale.has(key);
            keyboardHTML += `<div class="mini-key mini-black ${hasDot ? 'has-dot' : ''}" data-note="${key}"></div>`;
        });

        keyboardHTML += '</div></div>';
        return keyboardHTML;
    }

    // --- EVENT LISTENERS ---
    function setupEventListeners() {
        searchInput.addEventListener('input', renderScales);

        keySelector.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                activeKey = e.target.dataset.key;
                keySelector.querySelector('.active').classList.remove('active');
                e.target.classList.add('active');
                renderScales();
            }
        });

        scaleListContainer.addEventListener('click', (e) => {
            const playButton = e.target.closest('.play-scale-btn');
            if (playButton) {
                e.stopPropagation();
                const notes = playButton.dataset.scaleNotes;
                playScale(notes);
            }
        });
    }

    function playScale(notesString) {
        if (!audioCtx) return alert("Web Audio API not supported in this browser.");
        if (audioCtx.state === 'suspended') audioCtx.resume();
        console.log("Audio playback not yet implemented. Notes to play:", notesString);
        alert("Audio playback for this view is not implemented yet. Check the console for the note sequence!");
    }

    // --- START THE APP ---
    initializePage();
});