document.addEventListener('DOMContentLoaded', () => {

    // --- THEME SWITCHER LOGIC ---
    function initializeThemeSwitcher() {
        const themeToggle = document.getElementById('theme-checkbox');
        if (!themeToggle) return; // Only run if the toggle exists on the page

        // 1. Check for a saved theme in localStorage
        const currentTheme = localStorage.getItem('theme');
        if (currentTheme === 'light') {
            document.body.classList.add('light-mode');
            themeToggle.checked = true;
        }

        // 2. Listen for clicks on the toggle
        themeToggle.addEventListener('change', () => {
            if (themeToggle.checked) {
                // If checked, switch to light mode
                document.body.classList.add('light-mode');
                localStorage.setItem('theme', 'light');
            } else {
                // If unchecked, switch to dark mode
                document.body.classList.remove('light-mode');
                localStorage.setItem('theme', 'dark');
            }
        });
    }


    // --- INTERACTIVE AURORA BACKGROUND EFFECT ---
    function initializeAurora() {
        const aurora = document.querySelector('.background-aurora');
        if (!aurora) return;
        document.addEventListener('mousemove', e => {
            aurora.style.setProperty('--mouse-x', `${e.clientX}px`);
            aurora.style.setProperty('--mouse-y', `${e.clientY}px`);
        });
    }


    // --- FREQUENCY TABLE (WEB AUDIO) LOGIC ---
    // In script.js, replace the whole function with this one

function initializeFrequencyPlayer() {
    const table = document.querySelector('table');
    if (!table) return; // Only run if a table exists on the page

    // --- NEW: Add interactive class to all frequency cells on load ---
    const allCells = table.querySelectorAll('tbody td');
    allCells.forEach(cell => {
        if (cell.textContent.includes('Hz')) {
            cell.classList.add('interactive-freq');
        }
    });
    // --- End of new code ---

       const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
        console.warn('Web Audio API is not supported in this browser.');
        const hint = document.querySelector('.hint');
        if (hint) hint.style.display = 'none';
        return;
    }

    const audioContext = new AudioContext();
    let currentOscillator = null;

    table.addEventListener('click', (e) => {
        const cell = e.target.closest('td.interactive-freq'); // Target only interactive cells
        if (!cell) return; // If the click wasn't on an interactive cell, do nothing
        
        if (currentOscillator) {
            currentOscillator.stop();
            currentOscillator.disconnect();
        }

        const currentlyPlayingCell = document.querySelector('.playing');
        if (currentlyPlayingCell) {
            currentlyPlayingCell.classList.remove('playing');
        }
        
        cell.classList.add('playing');

        const frequency = parseFloat(cell.textContent);
        if (isNaN(frequency)) {
            cell.classList.remove('playing');
            return;
        }

        const oscillator = audioContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 1);
        currentOscillator = oscillator;

        setTimeout(() => {
            if (cell.classList.contains('playing')) {
                 cell.classList.remove('playing');
            }
        }, 1000);
    });
}


    

    // --- INITIALIZE EVERYTHING ---
    initializeThemeSwitcher();
    initializeAurora();
    initializeFrequencyPlayer();
    initializeComposerPage();


    
});