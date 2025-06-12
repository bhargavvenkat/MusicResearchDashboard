document.addEventListener('DOMContentLoaded', () => {
    // === Get references to the HTML elements we'll be working with ===
    const composerGrid = document.getElementById('composer-grid');
    const searchInput = document.getElementById('composer-search');
    const filterButtonsContainer = document.querySelector('.filter-buttons');

    // If the composerGrid container doesn't exist, we're not on the right page, so stop.
    if (!composerGrid) return;

    // === State variables to hold our data and current filter ===
    let allComposers = []; // This will store the data from the JSON file.
    let activeFilter = 'all'; // The default filter is 'all'.

    // === Main function to start everything ===
    // It's an `async` function to allow us to use `await` for fetching data.
    async function initializePage() {
        try {
            // 1. FETCH THE DATA
            // Use the `fetch` API to get the JSON file from our new 'json' folder.
            const response = await fetch('../json/composers.json');
            
            // Check if the file was found and the request was successful.
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // 2. PARSE THE DATA
            // Convert the raw response data into a JavaScript array of objects.
            allComposers = await response.json(); 
            
            // 3. RENDER AND SET UP
            // Now that we have the data, we can display it and enable the filters.
            renderComposers();
            setupEventListeners();
        } catch (error) {
            // If anything goes wrong (e.g., file not found, invalid JSON), show an error.
            console.error("Could not fetch or parse composer data:", error);
            composerGrid.innerHTML = '<p class="card-placeholder" style="color: #ff8b8b;">Error: Could not load composer data. Please check the console for details.</p>';
        }
    }

    // === Function to build the HTML and display the composer cards ===
    function renderComposers() {
        const searchTerm = searchInput.value.toLowerCase().trim();

        // Filter the master list of composers based on the current search term and active filter.
        const filteredComposers = allComposers.filter(composer => {
            const nameMatch = composer.name.toLowerCase().includes(searchTerm);
            const categoryMatch = activeFilter === 'all' || composer.categories.includes(activeFilter);
            return nameMatch && categoryMatch;
        });

        // If no composers match the filter, display a message.
        if (filteredComposers.length === 0) {
            composerGrid.innerHTML = '<p class="card-placeholder">No composers found matching your criteria.</p>';
            return;
        }

        // Use `map` to turn each composer object into an HTML string and then `join` them all together.
        const cardsHtml = filteredComposers.map(composer => {
            // Build the list of works as HTML list items.
            const worksHtml = composer.works.map(work => `<li>${work}</li>`).join('');
            
            // Use a template literal to build the complete HTML for the card.
            return `
                <div class="composer-card" data-category="${composer.categories.join(' ')}" data-name="${composer.name}">
                    <h2>${composer.name}</h2>
                    <div class="composer-meta">
                        <span>${composer.period}</span>
                        <span>${composer.country}</span>
                    </div>
                    <div class="composer-bio">
                        <p><strong>Defining Contribution:</strong> ${composer.contribution}</p>
                    </div>
                    <div class="composer-works">
                        <h3>Key Works:</h3>
                        <ul>
                            ${worksHtml}
                        </ul>
                    </div>
                    <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(composer.youtube_query)}" target="_blank" class="listen-btn">Listen on YouTube</a>
                </div>
            `;
        }).join('');

        // Finally, inject the generated HTML into the grid container.
        composerGrid.innerHTML = cardsHtml;
    }

    // === Function to set up the event listeners for the filter buttons and search bar ===
    function setupEventListeners() {
        filterButtonsContainer.addEventListener('click', (event) => {
            // Only act if a button was clicked.
            if (event.target.tagName === 'BUTTON') {
                activeFilter = event.target.dataset.filter;
                
                // Update which button looks "active".
                filterButtonsContainer.querySelector('.active').classList.remove('active');
                event.target.classList.add('active');
                
                // Re-render the cards with the new filter applied.
                renderComposers();
            }
        });

        // Whenever the user types in the search bar, re-render the cards.
        searchInput.addEventListener('input', renderComposers);
    }

    // === Let's go! ===
    initializePage();
});