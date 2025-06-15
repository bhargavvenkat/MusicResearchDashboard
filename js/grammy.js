(function() {
    const theme = localStorage.getItem('grammy-theme') || 'dark';
    if (theme === 'light') document.body.classList.add('light-mode');
})();

document.addEventListener('DOMContentLoaded', () => {
    const grammyGrid = document.getElementById('grammy-grid');
    const songSearch = document.getElementById('song-search');
    const decadeFilters = document.getElementById('decade-filters');
    const pageHeader = document.querySelector('.page-header');
    let allSongs = [], currentDecade = 'all', currentSearchTerm = '';

    async function main() {
        createThemeSwitcher();
        renderSkeletonLoaders();
        try {
            const response = await fetch('../json/grammy.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            allSongs = await response.json();
            setupDecadeFilters(allSongs);
            setupEventListeners();
            renderFilteredSongs();
        } catch (error) {
            console.error("Failed to load song data:", error);
            grammyGrid.innerHTML = `<p class="error-message">Could not load song data. Please try refreshing the page.</p>`;
        }
    }

    function renderSkeletonLoaders() {
        grammyGrid.innerHTML = Array(9).fill(`
            <div class="card-placeholder">
                <div class="placeholder-line title"></div>
                <div class="placeholder-line meta"></div>
                <div class="placeholder-line"></div>
                <div class="placeholder-line short"></div>
            </div>`).join('');
    }

    function createSongCardHTML(song) {
        return `
            <a href="${song.youtubeLink}" target="_blank" rel="noopener noreferrer" class="grammy-card" style="--animation-delay: ${song.id % 6 * 0.05}s">
                <h2>${song.songName}</h2>
                <div class="grammy-meta">
                    <span class="artist">${song.artist}</span>
                    <span class="year">${song.year}</span>
                </div>
                <div class="grammy-description">
                    <p>${song.description}</p>
                </div>
            </a>`;
    }

    function renderFilteredSongs() {
        let filteredSongs = allSongs.filter(song => 
            (currentDecade === 'all' || song.decade === currentDecade) &&
            (song.songName.toLowerCase().includes(currentSearchTerm) ||
             song.artist.toLowerCase().includes(currentSearchTerm) ||
             String(song.year).includes(currentSearchTerm))
        );
        if (filteredSongs.length > 0) {
            grammyGrid.innerHTML = filteredSongs.map(createSongCardHTML).join('');
        } else {
            grammyGrid.innerHTML = `<p class="no-results-message">No songs match your criteria.</p>`;
        }
    }

    function setupDecadeFilters(songs) {
        const decades = [...new Set(songs.map(song => song.decade))].sort();
        decadeFilters.innerHTML = `<button class="filter-btn active" data-decade="all">All</button>` + 
                                  decades.map(d => `<button class="filter-btn" data-decade="${d}">${d}</button>`).join('');
    }

    function setupEventListeners() {
        songSearch.addEventListener('input', e => {
            currentSearchTerm = e.target.value.toLowerCase().trim();
            renderFilteredSongs();
        });
        decadeFilters.addEventListener('click', e => {
            if (e.target.matches('.filter-btn') && !e.target.classList.contains('active')) {
                decadeFilters.querySelector('.active').classList.remove('active');
                e.target.classList.add('active');
                currentDecade = e.target.dataset.decade;
                renderFilteredSongs();
            }
        });
    }

    function createThemeSwitcher() {
        const switcher = document.createElement('button');
        switcher.className = 'theme-switcher';
        switcher.setAttribute('aria-label', 'Toggle light and dark mode');
        const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
        const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
        switcher.innerHTML = document.body.classList.contains('light-mode') ? moonIcon : sunIcon;
        const style = document.createElement('style');
        style.textContent = `.theme-switcher { position: absolute; top: 2rem; right: 2rem; background: var(--card-bg-color); border: 1px solid var(--border-color); color: var(--text-muted); width: 40px; height: 40px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease; } .theme-switcher:hover { color: var(--text-color); border-color: var(--accent-secondary); } @media (max-width: 480px) { .theme-switcher { top: 1rem; right: 1rem; } }`;
        document.head.appendChild(style);
        switcher.addEventListener('click', () => {
            const isLightMode = document.body.classList.toggle('light-mode');
            switcher.innerHTML = isLightMode ? moonIcon : sunIcon;
            localStorage.setItem('grammy-theme', isLightMode ? 'light' : 'dark');
        });
        (pageHeader || document.body).appendChild(switcher);
    }
    
    main();
});