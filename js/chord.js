document.addEventListener('DOMContentLoaded', () => {
    const chordListContainer = document.getElementById('chord-list-container');
    const searchInput = document.getElementById('chord-search');
    const keySelector = document.getElementById('key-selector');
    const globalKeyboard = document.getElementById('global-keyboard-section');

    if (!chordListContainer) return;

    // --- State Variables ---
    let allChords = [];
    let activeKey = 'C';
    let selectedChord = null;
    let audioReady = false;
    
    // --- Constants ---
    const allNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = AudioContext ? new AudioContext() : null;
    const pianoSamples = {};
    
    // --- FIX #1: Correct the path to go UP one directory from 'pages' ---
    const SAMPLES_PATH = '../assets/audio/midi-audio/'; 
    const SAMPLES_EXTENSION = '.wav';

    // --- Core Functions ---

    async function loadPianoSamples() {
        if (!audioCtx) {
            console.warn("AudioContext not supported. Audio playback will be disabled.");
            return false;
        }
        const notesToLoad = [];
        for (const octave of [2, 3, 4]) {
            for (const note of allNotes) {
                notesToLoad.push(`${note}${octave}`);
            }
        }
        
        const promises = notesToLoad.map(async (noteToLoad) => {
            const fileName = encodeURIComponent(noteToLoad) + SAMPLES_EXTENSION;
            const filePath = SAMPLES_PATH + fileName;
            try {
                const response = await fetch(filePath);
                if (!response.ok) throw new Error(`Sample not found`);
                const arrayBuffer = await response.arrayBuffer();
                pianoSamples[noteToLoad] = await audioCtx.decodeAudioData(arrayBuffer);
            } catch (error) {
                 // Silently fail for individual notes
            }
        });

        await Promise.all(promises);

        if (Object.keys(pianoSamples).length > 0) {
            console.log("Piano samples loaded. Audio enabled.");
            return true;
        } else {
            console.warn("No piano samples found. Audio playback is disabled.");
            return false;
        }
    }

 // Inside the initializePage function in chord.js

async function initializePage() {
    try {
        const [chordsResponse, audioStatus] = await Promise.all([
            // CONFIRM THIS LINE IS CORRECT
            fetch('../json/chord.json'), 
            loadPianoSamples()
        ]);
//... rest of the function

            if (!chordsResponse.ok) {
                throw new Error(`Could not load chords.json. Please check the file path and ensure it's valid JSON.`);
            }
            
            allChords = await chordsResponse.json();
            audioReady = audioStatus;
            
            renderChords();
            setupEventListeners();
            updateKeyboardHighlights();

        } catch (error) {
            console.error("Initialization Error:", error);
            chordListContainer.innerHTML = `<p class="card-placeholder" style="color:#ff8b8b;">${error.message}</p>`;
        }
    }

    // --- (The rest of your UI Rendering, Event Handling, and Utility functions remain the same) ---

    function renderChords() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const filteredChords = allChords.filter(chord => {
            return `${chord.name} ${chord.symbol}`.toLowerCase().includes(searchTerm);
        });

        if (filteredChords.length === 0) {
            chordListContainer.innerHTML = '<p class="card-placeholder">No chords found.</p>';
            return;
        }
        
        const cardsHtml = filteredChords.map(chord => {
            const transposedNotes = transposeChord(chord.intervals, activeKey);
            const chordSymbol = activeKey + (chord.symbol || '');
            const isActive = selectedChord && selectedChord.name === chord.name;
            const activeClass = isActive ? 'active' : '';

            const playButtonHtml = audioReady ? `
                <div class="chord-button-container">
                    <button class="play-chord-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10,15L15.19,12L10,9V15M21.56,7.17C21.69,7.64 21.78,8.27 21.84,9.07C21.91,9.87 21.94,10.56 21.94,11.16L22,12C22,14.19 21.84,15.8 21.56,16.83C21.31,17.73 20.73,18.31 19.83,18.56C19.36,18.69 18.73,18.78 17.93,18.84C17.13,18.91 16.44,18.94 15.84,18.94L15,19C12.81,19 11.2,18.84 10.17,18.56C9.27,18.31 8.69,17.73 8.44,16.83C8.31,16.36 8.22,15.73 8.16,14.93C8.09,14.13 8.06,13.44 8.06,12.84L8,12C8,9.81 8.16,8.2 8.44,7.17C8.69,6.27 9.27,5.69 10.17,5.44C11.2,5.16 12.81,5 15,5L15.84,5.06C16.44,5.06 17.13,5.09 17.93,5.16C18.73,5.22 19.36,5.31 19.83,5.44C20.73,5.69 21.31,6.27 21.56,7.17Z"/></svg>
                        <span>Play Chord</span>
                    </button>
                </div>` : '';

            return `
                <div class="card chord-card ${activeClass}" data-name="${chord.name}">
                    <div class="card-header">
                        <div class="card-title">
                            <h2>${chordSymbol}</h2>
                            <span class="chord-name">${chord.name}</span>
                        </div>
                    </div>
                    <div class="chord-info">
                        <h3>Notes</h3>
                        <p>${transposedNotes.join(' - ')}</p>
                    </div>
                    ${playButtonHtml}
                </div>`;
        }).join('');
        chordListContainer.innerHTML = cardsHtml;
    }

    function updateKeyboardHighlights() {
        document.querySelectorAll('.key').forEach(k => {
            k.classList.remove('is-root', 'is-in-chord');
        });

        if (selectedChord) {
            const rootNoteName = activeKey;
            const rootKey = globalKeyboard.querySelector(`.key[data-note="${rootNoteName}3"]`);
            if (rootKey) rootKey.classList.add('is-root');

            const transposedNotes = transposeChord(selectedChord.intervals, rootNoteName);
            const rootNoteIndex = allNotes.indexOf(rootNoteName);

            transposedNotes.forEach(noteName => {
                const noteIndex = allNotes.indexOf(noteName);
                const octave = (noteIndex < rootNoteIndex) ? 4 : 3;
                const fullNoteName = `${noteName}${octave}`;
                
                const keyElement = globalKeyboard.querySelector(`.key[data-note="${fullNoteName}"]`);
                if (keyElement) {
                    keyElement.classList.add('is-in-chord');
                }
            });
        }
    }

    function setupEventListeners() {
        searchInput.addEventListener('input', renderChords);
        
        keySelector.addEventListener('click', e => {
            if (e.target.tagName === 'BUTTON' && !e.target.classList.contains('active')) {
                activeKey = e.target.dataset.key;
                keySelector.querySelector('.active').classList.remove('active');
                e.target.classList.add('active');
                renderChords();
                updateKeyboardHighlights();
            }
        });

        chordListContainer.addEventListener('click', e => {
            const card = e.target.closest('.chord-card');
            if (!card) return;

            const chordName = card.dataset.name;
            const chordObject = allChords.find(c => c.name === chordName);
            if (!chordObject) return;

            if (e.target.closest('.play-chord-btn')) {
                if (audioReady) {
                    playChord(chordObject.intervals, activeKey);
                }
                return;
            }

            if (selectedChord?.name === chordName) {
                selectedChord = null;
            } else {
                selectedChord = chordObject;
                globalKeyboard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            
            renderChords();
            updateKeyboardHighlights();
        });

        globalKeyboard.addEventListener('click', e => {
            if (!audioReady) return;
            const key = e.target.closest('.key');

            if (key && key.dataset.note) {
                if (audioCtx.state === 'suspended') audioCtx.resume();
                playNote(key.dataset.note);
                key.classList.add('is-playing');
                setTimeout(() => key.classList.remove('is-playing'), 200);
            }
        });

        document.addEventListener('click', e => {
            if (!selectedChord) return;

            const isClickOnCard = e.target.closest('.chord-card');
            const isClickOnKeyboard = e.target.closest('#global-keyboard-section');
            const isClickOnKeySelector = e.target.closest('#key-selector');

            if (!isClickOnCard && !isClickOnKeyboard && !isClickOnKeySelector) {
                selectedChord = null;
                renderChords();
                updateKeyboardHighlights();
            }
        });
    }

    function playNote(noteName) {
        if (!audioReady || !pianoSamples[noteName]) return;
        const source = audioCtx.createBufferSource();
        source.buffer = pianoSamples[noteName];
        source.connect(audioCtx.destination);
        source.start(0);
    }
    
    function playChord(intervals, rootKey) {
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        const notesToPlay = transposeChord(intervals, rootKey, true);
        notesToPlay.forEach(note => playNote(note));
    }

    function transposeChord(intervals, targetKey, forPlayback = false) {
        const rootIndex = allNotes.indexOf(targetKey);
        if (rootIndex === -1) return [];

        return intervals.map(interval => {
            const noteIndex = (rootIndex + interval) % 12;
            const noteName = allNotes[noteIndex];
            if (forPlayback) {
                const octave = (rootIndex + interval >= 12) ? 4 : 3;
                return `${noteName}${octave}`;
            }
            return noteName;
        });
    }

    // --- Initialize ---
    initializePage();
});