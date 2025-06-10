document.addEventListener('DOMContentLoaded', () => {

    // --- THEME SWITCHER LOGIC (REVISED FOR .light-mode class) ---
    const themeCheckbox = document.getElementById('theme-checkbox');
    const body = document.body;

    // Function to apply the correct class based on the theme
    const applyTheme = (theme) => {
        if (theme === 'light') {
            body.classList.add('light-mode');
            themeCheckbox.checked = false; // Uncheck the box for light mode
        } else { // 'dark' is the default
            body.classList.remove('light-mode');
            themeCheckbox.checked = true; // Check the box for dark mode
        }
    };

    // On page load, check for a saved theme in localStorage
    // If nothing is saved, default to dark mode.
    const savedTheme = localStorage.getItem('theme') || 'dark'; 
    applyTheme(savedTheme);

    // Add event listener for when the user clicks the switch
    themeCheckbox.addEventListener('change', () => {
        // Ternary operator: if checkbox is checked, theme is 'dark', otherwise it's 'light'
        const newTheme = themeCheckbox.checked ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme); // Save the new preference
        applyTheme(newTheme); // Apply the new theme
    });


    // --- FILTERING AND SEARCH LOGIC (This part remains the same) ---
    const searchInput = document.getElementById('composer-search');
    const filterButtonsContainer = document.querySelector('.filter-buttons');
    const composerCards = document.querySelectorAll('.composer-card');
    
    let activeFilter = 'all';

    const filterComposers = () => {
        const searchTerm = searchInput.value.toLowerCase();

        composerCards.forEach(card => {
            const cardName = card.dataset.name.toLowerCase();
            const cardCategories = card.dataset.category.split(' ');

            const nameMatch = cardName.includes(searchTerm);
            const categoryMatch = activeFilter === 'all' || cardCategories.includes(activeFilter);

            if (nameMatch && categoryMatch) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    };

    filterButtonsContainer.addEventListener('click', (event) => {
        if (event.target.tagName === 'BUTTON') {
            const button = event.target;
            activeFilter = button.dataset.filter;
            filterButtonsContainer.querySelector('.active').classList.remove('active');
            button.classList.add('active');
            filterComposers();
        }
    });

    searchInput.addEventListener('input', filterComposers);
});