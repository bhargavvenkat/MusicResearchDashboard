document.addEventListener('DOMContentLoaded', () => {

    const scaleListContainer = document.getElementById('scale-list-container');
    const searchInput = document.getElementById('scale-search');

    if (!scaleListContainer) return; // Exit if we're not on the right page

    // State
    let allScales = [];

    // Maps flats to sharps for keyboard dot mapping
    const noteAliasMap = {
        'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
    };

    // Placeholder for audio functionality
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    let audioCtx;
    if (AudioContext) {
        audioCtx = new AudioContext();
    }
    
    // --- Main Initialization ---
    async function initializePage() {
        try {
            const response = await fetch('json/scales.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allScales = await response.json();
            renderScales();
            setupEventListeners();
        } catch (error) {
            console.error("Could not fetch or parse scales data:", error);
            scaleListContainer.innerHTML = '<p class="card-placeholder" style="color: #ff8b8b;">Error: Could not load scales data. Please check the console.</p>';
        }
    }

    // --- Rendering Functions ---
    function renderScales() {
        const searchTerm = searchInput.value.toLowerCase().trim();

        const filteredScales = allScales.filter(scale => {
             const ragaName = scale.raga === '-' ? scale.westernScale : scale.raga;
             const searchTerms = `${scale.no} ${ragaName.toLowerCase()} ${scale.westernScale.toLowerCase()}`;
             return searchTerms.includes(searchTerm);
        });

        if (filteredScales.length === 0) {
            scaleListContainer.innerHTML = '<p class="card-placeholder">No scales found matching your criteria.</p>';
            return;
        }

        const cardsHtml = filteredScales.map(scale => {
            const ragaName = scale.raga === '-' ? scale.westernScale : scale.raga;
            const westernName = scale.raga !== '-' && scale.westernScale ? `<span class="scale-meta">${scale.westernScale}</span>` : '';
            const ragaNumberHTML = parseInt(scale.no) <= 72 ? `<div class="raga-number">#${scale.no}</div>` : '';
            const keyboardHTML = generateMiniKeyboardHTML(scale);

            // This is the full card structure from your original, well-styled JS
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
                            <p class="western-notes-display">${scale.westernAsc}</p>
                        </div>
                        <div class="scale-column">
                            <h3>Descending</h3>
                            <p class="carnatic-notes">${scale.carnaticDesc}</p>
                            <p class="western-notes-display">${scale.westernDesc}</p>
                        </div>
                    </div>

                    ${keyboardHTML}
                    
                    <button class="listen-btn play-scale-btn" data-scale-notes="${scale.westernAsc.replace(/ C$/, '')}">Play Scale</button>
                </div>`;
        }).join('');
        
        scaleListContainer.innerHTML = cardsHtml;
    }

    function generateMiniKeyboardHTML(scale) {
        const notesInScale = new Set();
        // Add notes from both ascending and descending scales
        scale.westernAsc.split(' ').forEach(note => notesInScale.add(note));
        scale.westernDesc.split(' ').forEach(note => notesInScale.add(note));

        let keyboardHTML = `<div class="mini-keyboard-wrapper"><div class="mini-keyboard-container">`;
        
        // White keys
        ['C', 'D', 'E', 'F', 'G', 'A', 'B'].forEach(key => {
            const hasDot = notesInScale.has(key);
            keyboardHTML += `<div class="mini-key mini-white ${hasDot ? 'has-dot' : ''}" data-note="${key}"></div>`;
        });
        
        // Black keys
        ['C#', 'D#', 'F#', 'G#', 'A#'].forEach(key => {
            const hasDot = notesInScale.has(key) || Object.entries(noteAliasMap).some(([flat, sharp]) => sharp === key && notesInScale.has(flat));
            keyboardHTML += `<div class="mini-key mini-black ${hasDot ? 'has-dot' : ''}" data-note="${key}"></div>`;
        });
        
        keyboardHTML += '</div></div>';
        return keyboardHTML;
    }

    // --- Event Listeners and Audio ---
    function setupEventListeners() {
        searchInput.addEventListener('input', renderScales);

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
        if (!audioCtx) {
            alert("Web Audio API not supported in this browser.");
            return;
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        console.log("Audio playback is not fully implemented. Notes:", notesString);
        alert("Audio playback for this view is not implemented yet. Check the console for the note sequence!");
    }

    // --- Start the process ---
    initializePage();
});