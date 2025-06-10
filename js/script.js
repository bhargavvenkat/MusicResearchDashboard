document.addEventListener('DOMContentLoaded', () => {

    // --- THEME SWITCHER LOGIC (UNIFIED) ---
    function initializeThemeSwitcher() {
        const themeToggle = document.getElementById('theme-checkbox');
        if (!themeToggle) return; // Only run if the toggle exists

        const applyTheme = (theme) => {
            // Use a class on the body for easy CSS targeting
            document.body.classList.toggle('light-mode', theme === 'light');
            themeToggle.checked = (theme === 'light');
        };

        // On page load, apply the saved theme or default to dark
        const savedTheme = localStorage.getItem('theme') || 'dark';
        applyTheme(savedTheme);

        // Listen for clicks on the toggle to change the theme
        themeToggle.addEventListener('change', () => {
            const newTheme = themeToggle.checked ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
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
    function initializeFrequencyPlayer() {
        const table = document.querySelector('table');
        if (!table) return; // Only run if a table exists

        // Add interactive class to all frequency cells
        const allCells = table.querySelectorAll('tbody td');
        allCells.forEach(cell => {
            if (cell.textContent.includes('Hz')) {
                cell.classList.add('interactive-freq');
            }
        });

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
            const cell = e.target.closest('td.interactive-freq');
            if (!cell) return;
            
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
});