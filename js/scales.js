document.addEventListener('DOMContentLoaded', () => {
    const scaleListContainer = document.getElementById('scale-list-container');
    const searchInput = document.getElementById('scale-search');
    const keySelector = document.getElementById('key-selector');
    const globalKeyboard = document.getElementById('global-keyboard-section');

    if (!scaleListContainer) return;

    let allScales = [];
    let activeKey = 'C';
    let selectedScale = null;
    const allNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteAliasMap = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
    
    // --- REFINEMENT: Piano Sample Logic ---
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = AudioContext ? new AudioContext() : null;
    const pianoSamples = {};
    const SAMPLES_PATH = '../assets/audio/midi-audio/';
    const SAMPLES_EXTENSION = '.wav';
    // --- END REFINEMENT ---

    async function loadPianoSamples() {
        if (!audioCtx) return;

        // --- REFINEMENT: Load notes from C3-B4 as specified ---
        const notesToLoad = [];
        for (const octave of [3, 4]) {
            for (const note of allNotes) {
                notesToLoad.push(`${note}${octave}`);
            }
        }
        // Result: ['C3', 'C#3', ..., 'B3', 'C4', 'C#4', ..., 'B4']

        const promises = notesToLoad.map(async (noteToLoad) => {
            // The file path uses the actual note name (e.g., "C#3.wav")
            const fileName = encodeURIComponent(noteToLoad) + SAMPLES_EXTENSION;
            const filePath = SAMPLES_PATH + fileName;
            
            try {
                const response = await fetch(filePath);
                if (!response.ok) throw new Error(`Could not fetch sample: ${response.statusText}`);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
                
                // --- MAP to the keyboard ---
                // We map the loaded sound to the key one octave higher.
                // e.g., The sound from C3.wav is assigned to the C4 key.
                //       The sound from C4.wav is assigned to the C5 key.
                const baseNote = noteToLoad.slice(0, -1);
                const originalOctave = parseInt(noteToLoad.slice(-1), 10);
                const keyboardNote = `${baseNote}${originalOctave + 1}`;

                pianoSamples[keyboardNote] = audioBuffer;

            } catch (error) {
                console.warn(`Could not load or decode piano sample for ${noteToLoad} from ${filePath}:`, error);
            }
        });
        await Promise.all(promises);
    }

    async function initializePage() {
        try {
            const [scalesResponse] = await Promise.all([
                fetch('../json/scales.json'),
                loadPianoSamples()
            ]);

            if (!scalesResponse.ok) throw new Error(`HTTP error! status: ${scalesResponse.status}`);
            allScales = await scalesResponse.json();
            
            renderScales();
            setupEventListeners();
            updateKeyboardHighlights();
        } catch (error)
        {
            console.error("Could not initialize page:", error);
            scaleListContainer.innerHTML = `<p class="card-placeholder" style="color:#ff8b8b;">Error: Could not load scale data. Please check the console for details.</p>`;
        }
    }

    function renderScales() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const filteredScales = allScales.filter(scale => {
            const ragaName = scale.raga === '-' ? scale.westernScale : scale.raga;
            return `${scale.no} ${ragaName} ${scale.westernScale}`.toLowerCase().includes(searchTerm);
        });

        if (filteredScales.length === 0) {
            scaleListContainer.innerHTML = '<p class="card-placeholder">No scales found.</p>';
            return;
        }

        const cardsHtml = filteredScales.map(scale => {
            const transposedAsc = transposeScale(scale.westernAsc.split(' '), activeKey);
            const transposedDesc = transposeScale(scale.westernDesc.split(' '), activeKey);
            const ragaName = scale.raga === '-' ? scale.westernScale : scale.raga;
            const westernName = scale.raga !== '-' && scale.westernScale ? `<span class="scale-meta">${scale.westernScale}</span>` : '';
            const ragaNumberHTML = parseInt(scale.no) <= 72 ? `<div class="raga-number">#${scale.no}</div>` : '';
            const buttonsHTML = generateButtonsHTML(scale);
            const isActive = selectedScale && selectedScale.no === scale.no;
            const activeClass = isActive ? 'active' : '';

            return `
                <div class="card scale-card ${activeClass}" data-no="${scale.no}">
                    <div class="card-header"><div class="card-title"><h2>${ragaName}</h2>${westernName}</div>${ragaNumberHTML}</div>
                    <div class="note-display-section">
                        <div class="scale-group"><h3>Ascending</h3><p class="carnatic-notes">${scale.carnaticAsc}</p><p class="western-notes-display">${transposedAsc.join(' ')}</p></div>
                        <div class="scale-group"><h3>Descending</h3><p class="carnatic-notes">${scale.carnaticDesc}</p><p class="western-notes-display">${transposedDesc.join(' ')}</p></div>
                    </div>
                    ${buttonsHTML}
                </div>`;
        }).join('');
        scaleListContainer.innerHTML = cardsHtml;
    }
    
    function generateButtonsHTML(scale) {
        if (scale.youtube_query) {
            const youtubeButtonHTML = `<a href="https://www.youtube.com/results?search_query=${encodeURIComponent(scale.youtube_query)}" target="_blank" class="listen-btn"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10,15L15.19,12L10,9V15M21.56,7.17C21.69,7.64 21.78,8.27 21.84,9.07C21.91,9.87 21.94,10.56 21.94,11.16L22,12C22,14.19 21.84,15.8 21.56,16.83C21.31,17.73 20.73,18.31 19.83,18.56C19.36,18.69 18.73,18.78 17.93,18.84C17.13,18.91 16.44,18.94 15.84,18.94L15,19C12.81,19 11.2,18.84 10.17,18.56C9.27,18.31 8.69,17.73 8.44,16.83C8.31,16.36 8.22,15.73 8.16,14.93C8.09,14.13 8.06,13.44 8.06,12.84L8,12C8,9.81 8.16,8.2 8.44,7.17C8.69,6.27 9.27,5.69 10.17,5.44C11.2,5.16 12.81,5 15,5L15.84,5.06C16.44,5.06 17.13,5.09 17.93,5.16C18.73,5.22 19.36,5.31 19.83,5.44C20.73,5.69 21.31,6.27 21.56,7.17Z"/></svg><span>Listen</span></a>`;
            return `<div class="scale-button-container">${youtubeButtonHTML}</div>`;
        }
        return '';
    }

    // This function doesn't need to change. It plays whatever sample is mapped to the noteName.
    function playNote(noteName) {
        if (!audioCtx || !pianoSamples[noteName]) {
            console.warn(`Piano sample for ${noteName} not loaded or AudioContext not ready.`);
            return;
        }
        const source = audioCtx.createBufferSource();
        source.buffer = pianoSamples[noteName];
        source.connect(audioCtx.destination);
        source.start(0);
    }

    function updateKeyboardHighlights() {
        document.querySelectorAll('.key').forEach(k => {
            k.classList.remove('is-root', 'is-in-scale');
        });

        const rootNoteName = activeKey;
        const rootKey = globalKeyboard.querySelector(`.key[data-note="${rootNoteName}4"]`);
        if (rootKey) {
            rootKey.classList.add('is-root');
        }

        if (selectedScale) {
            const scaleNotesRaw = selectedScale.westernAsc.split(' ');
            const transposedNotes = transposeScale(scaleNotesRaw, rootNoteName);
            const rootNoteIndex = allNotes.indexOf(rootNoteName);

            transposedNotes.forEach(noteName => {
                const noteIndex = allNotes.indexOf(noteName);
                const octave = (noteIndex < rootNoteIndex) ? 5 : 4;
                const fullNoteName = `${noteName}${octave}`;
                
                const keyElement = globalKeyboard.querySelector(`.key[data-note="${fullNoteName}"]`);
                if (keyElement) {
                    keyElement.classList.add('is-in-scale');
                }
            });
        }
    }

    function setupEventListeners() {
        searchInput.addEventListener('input', renderScales);
        
        keySelector.addEventListener('click', e => {
            if (e.target.tagName === 'BUTTON' && !e.target.classList.contains('active')) {
                activeKey = e.target.dataset.key;
                keySelector.querySelector('.active').classList.remove('active');
                e.target.classList.add('active');
                renderScales();
                updateKeyboardHighlights();
            }
        });

        scaleListContainer.addEventListener('click', e => {
            const card = e.target.closest('.scale-card');
            if (!card) return;

            if (e.target.closest('.listen-btn')) {
                return;
            }

            const scaleId = card.dataset.no;
            const clickedScale = allScales.find(s => s.no === scaleId);

            if (clickedScale) {
                if (selectedScale && selectedScale.no === scaleId) {
                    selectedScale = null;
                } else {
                    selectedScale = clickedScale;
                }
                renderScales();
                updateKeyboardHighlights();
            }
        });

        globalKeyboard.addEventListener('click', e => {
            const key = e.target.closest('.key');
            if (key && key.dataset.note) {
                if (audioCtx && audioCtx.state === 'suspended') {
                    audioCtx.resume();
                }
                playNote(key.dataset.note);
                key.classList.add('is-playing');
                setTimeout(() => key.classList.remove('is-playing'), 200);
            }
        });
    }

    function transposeScale(notesArray, targetKey) {
        const targetKeyIndex = allNotes.indexOf(targetKey);
        if (targetKeyIndex === -1) return notesArray;
        return notesArray.map(note => {
            const normalizedNote = note.endsWith('b') ? noteAliasMap[note] : note;
            const originalIndex = allNotes.indexOf(normalizedNote.trim());
            if (originalIndex === -1) return note;
            const newIndex = (originalIndex + targetKeyIndex) % 12;
            return allNotes[newIndex];
        });
    }

    initializePage();
});