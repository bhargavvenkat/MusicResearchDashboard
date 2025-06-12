document.addEventListener('DOMContentLoaded', () => {
    const scaleListContainer = document.getElementById('scale-list-container');
    const searchInput = document.getElementById('scale-search');
    const keySelector = document.getElementById('key-selector');

    if (!scaleListContainer) return;

    let allScales = [];
    let activeKey = 'C';
    const allNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteAliasMap = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
    const noteFrequencies = { 'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13, 'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.00, 'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88 };
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = AudioContext ? new AudioContext() : null;

    async function initializePage() {
        try {
            const response = await fetch('../json/scales.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            allScales = await response.json();
            renderScales();
            setupEventListeners();
        } catch (error) {
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
            const keyboardHTML = generateMiniKeyboardHTML(transposedAsc, transposedDesc);
            const buttonsHTML = generateButtonsHTML(scale, transposedAsc);

            // This uses the base .card style and adds .scale-card for specific layout overrides.
            return `
                <div class="card scale-card">
                    <div class="card-header"><div class="card-title"><h2>${ragaName}</h2>${westernName}</div>${ragaNumberHTML}</div>
                    <div class="note-display-section">
                        <div class="scale-group"><h3>Ascending</h3><p class="carnatic-notes">${scale.carnaticAsc}</p><p class="western-notes-display">${transposedAsc.join(' ')}</p></div>
                        <div class="scale-group"><h3>Descending</h3><p class="carnatic-notes">${scale.carnaticDesc}</p><p class="western-notes-display">${transposedDesc.join(' ')}</p></div>
                    </div>
                    ${keyboardHTML}
                    ${buttonsHTML}
                </div>`;
        }).join('');
        scaleListContainer.innerHTML = cardsHtml;
    }

    function generateButtonsHTML(scale, transposedAsc) {
        const playButtonHTML = `<button class="play-scale-btn" data-scale-notes="${transposedAsc.join(',')}">Play Scale</button>`;
        let youtubeButtonHTML = '';
        if (scale.youtube_query) {
            youtubeButtonHTML = `<a href="https://www.youtube.com/results?search_query=${encodeURIComponent(scale.youtube_query)}" target="_blank" class="listen-btn"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10,15L15.19,12L10,9V15M21.56,7.17C21.69,7.64 21.78,8.27 21.84,9.07C21.91,9.87 21.94,10.56 21.94,11.16L22,12C22,14.19 21.84,15.8 21.56,16.83C21.31,17.73 20.73,18.31 19.83,18.56C19.36,18.69 18.73,18.78 17.93,18.84C17.13,18.91 16.44,18.94 15.84,18.94L15,19C12.81,19 11.2,18.84 10.17,18.56C9.27,18.31 8.69,17.73 8.44,16.83C8.31,16.36 8.22,15.73 8.16,14.93C8.09,14.13 8.06,13.44 8.06,12.84L8,12C8,9.81 8.16,8.2 8.44,7.17C8.69,6.27 9.27,5.69 10.17,5.44C11.2,5.16 12.81,5 15,5L15.84,5.06C16.44,5.06 17.13,5.09 17.93,5.16C18.73,5.22 19.36,5.31 19.83,5.44C20.73,5.69 21.31,6.27 21.56,7.17Z"/></svg><span>Listen</span></a>`;
        }
        return `<div class="scale-button-container">${playButtonHTML}${youtubeButtonHTML}</div>`;
    }

    function setupEventListeners() {
        searchInput.addEventListener('input', renderScales);
        keySelector.addEventListener('click', e => {
            if (e.target.tagName === 'BUTTON' && !e.target.classList.contains('active')) {
                activeKey = e.target.dataset.key;
                keySelector.querySelector('.active').classList.remove('active');
                e.target.classList.add('active');
                renderScales();
            }
        });
        scaleListContainer.addEventListener('click', e => {
            const playButton = e.target.closest('.play-scale-btn');
            if (playButton) {
                e.stopPropagation();
                if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
                playScale(playButton.dataset.scaleNotes.split(','));
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

    function generateMiniKeyboardHTML(ascNotes, descNotes) {
        const notesInScale = new Set([...ascNotes, ...descNotes]);
        let keyboardHTML = `<div class="mini-keyboard-wrapper"><div class="mini-keyboard-container">`;
        ['C', 'D', 'E', 'F', 'G', 'A', 'B'].forEach(key => {
            keyboardHTML += `<div class="mini-key mini-white ${notesInScale.has(key) ? 'has-dot' : ''}" data-note="${key}"></div>`;
        });
        ['C#', 'D#', 'F#', 'G#', 'A#'].forEach(key => {
            keyboardHTML += `<div class="mini-key mini-black ${notesInScale.has(key) ? 'has-dot' : ''}" data-note="${key}"></div>`;
        });
        keyboardHTML += '</div></div>';
        return keyboardHTML;
    }

    function playScale(notes, noteIndex = 0) {
        if (!audioCtx || noteIndex >= notes.length) return;
        const freq = noteFrequencies[notes[noteIndex]];
        if (freq) {
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
            gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
            oscillator.connect(gainNode).connect(audioCtx.destination);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.3);
        }
        setTimeout(() => playScale(notes, noteIndex + 1), 150);
    }

    initializePage();
});