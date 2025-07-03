// This script is designed to be embedded directly into Jellyfin's index.html
// It uses Jellyfin's native ApiClient.ajax for authenticated requests,
// constructing the correct API URL and adding the X-Emby-Token header.

(function() {
    'use strict';

    // IMPORTANT: Replace with your actual Jellyfin API Key
    // You can generate one in Jellyfin: Dashboard -> API Keys
    const API_KEY = 'YOUR_JELLYFIN_API_KEY_HERE';

    const getJellyfinServerAddress = () => window.location.origin;

    // Function to inject Material Design Icons stylesheet (Standard)
    const injectMaterialIcons = () => {
        if (!document.getElementById('material-icons-stylesheet')) {
            const link = document.createElement('link');
            link.id = 'material-icons-stylesheet';
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
            document.head.appendChild(link);
            console.log("Jellyfin Random Movie: Material Design Icons stylesheet (Standard) injected.");
        }
    };

    // Function to inject custom CSS rules
    const injectCustomCss = () => {
        if (!document.getElementById('random-movie-button-custom-css')) {
            const style = document.createElement('style');
            style.id = 'random-movie-button-custom-css';
            style.innerHTML = `
                .random-movie-button .md-icon {
                    font-family: 'Material Icons' !important;
                    font-style: normal !important;
                    font-size: 24px !important;
                }
                button#randomMovieButton {
                    padding: 0px !important;
                    margin: 0px 5px 0px 10px !important;
                }
            `;
            document.head.appendChild(style);
            console.log("Jellyfin Random Movie: Custom CSS injected.");
        }
    };
    const getRandomMovie = async () => {
        const userId = ApiClient.getCurrentUserId();

        if (!userId) {
            console.error("Jellyfin Random Movie: User ID not found. Are you logged in?");
            alert("Please log in to use the random movie feature.");
            return null;
        }

        if (!API_KEY || API_KEY === 'YOUR_JELLYFIN_API_KEY_HERE') {
            console.error("Jellyfin Random Movie: API Key is not set in the script. Please update the API_KEY constant.");
            alert("API Key is missing. Please set your Jellyfin API Key in the script.");
            return null;
        }

        const serverAddress = getJellyfinServerAddress();
        const timestamp = Date.now(); // Cache buster
        const fetchLimit = 20; // Fetch 20 random movies, then pick one client-side

        // Construct the full API URL
        const apiUrl = `${serverAddress}/Users/${userId}/Items?IncludeItemTypes=Movie&Recursive=true&SortBy=Random&Limit=${fetchLimit}&Fields=ExternalUrls&_=${timestamp}`;
        console.log("Jellyfin Random Movie: Fetching random movie from:", apiUrl);

        try {
            // Use ApiClient.ajax for requests within the Jellyfin UI context
            const response = await ApiClient.ajax({
                type: 'GET',
                url: apiUrl, // Full absolute URL
                headers: {
                    'X-Emby-Token': API_KEY,
                    'Content-Type': 'application/json'
                },
                dataType: 'json' // Expect JSON response, ApiClient.ajax will parse it
            });

            // ApiClient.ajax returns the parsed JSON directly if dataType is 'json'
            const data = response;

            if (data && data.Items && data.Items.length > 0) {
                // Pick a truly random movie from the fetched batch client-side
                const randomIndex = Math.floor(Math.random() * data.Items.length);
                return data.Items[randomIndex];
            } else {
                throw new Error("No movies found or API returned empty list.");
            }
        } catch (error) {
            console.error("Jellyfin Random Movie: Error fetching random movie:", error);
            // Attempt to get a more specific error message from the API response
            const errorMessage = error.responseJSON && error.responseJSON.Message ? error.responseJSON.Message : error.statusText || error.message || 'Unknown API Error';
            alert(`Error getting random movie: ${errorMessage}. Check console for details.`);
            return null;
        }
    };

    const navigateToMovie = (movie) => {
        if (movie && movie.Id) {
            const serverAddress = getJellyfinServerAddress();
            const serverId = ApiClient.serverId();

            const movieUrl = `${serverAddress}/web/index.html#!/details?id=${movie.Id}${serverId ? `&serverId=${serverId}` : ''}`;
            console.log("Jellyfin Random Movie: Navigating to:", movieUrl);
            window.location.href = movieUrl;
        } else {
            console.error("Jellyfin Random Movie: Invalid movie object or ID:", movie);
            alert("Could not navigate to movie details. Movie ID is missing.");
        }
    };

    const addButton = () => {
        const headerRight = document.querySelector('.headerRight');
        const searchInputContainer = document.querySelector('.searchInput');

        if (!headerRight && !searchInputContainer) {
            console.log("Jellyfin Random Movie: Suitable button container not found. Retrying...");
            return;
        }

        let buttonContainer = document.getElementById('randomMovieButtonContainer');
        if (!buttonContainer) {
            buttonContainer = document.createElement('div');
            buttonContainer.id = 'randomMovieButtonContainer';
        }

        let randomButton = document.getElementById('randomMovieButton');
        if (!randomButton) {
            randomButton = document.createElement('button');
            randomButton.id = 'randomMovieButton';
            randomButton.className = 'random-movie-button emby-button button-flat button-flat-hover';
            randomButton.title = 'Play a random movie from your library';
            randomButton.innerHTML = `
                <i class="md-icon random-icon">casino</i>
            `;

            randomButton.addEventListener('click', async () => {
                randomButton.disabled = true;
                randomButton.innerHTML = '<i class="md-icon random-icon">more_horiz</i>'; // Loading state icon

                try {
                    const movie = await getRandomMovie();
                    if (movie) {
                        navigateToMovie(movie);
                    }
                } catch (error) {
                    console.error("Jellyfin Random Movie: Failed to get random movie:", error);
                    alert("Failed to find a random movie. Check console for details.");
                } finally {
                    randomButton.disabled = false;
                    randomButton.innerHTML = `
                        <i class="md-icon random-icon">casino</i>
                    `;
                }
            });

            buttonContainer.appendChild(randomButton);

            if (headerRight) {
                headerRight.prepend(buttonContainer);
                console.log("Jellyfin Random Movie: Button added to headerRight.");
            } else if (searchInputContainer) {
                searchInputContainer.parentNode.insertBefore(buttonContainer, searchInputContainer.nextSibling);
                console.log("Jellyfin Random Movie: Button added after searchInput.");
            }
        }
    };

    const waitForApiClient = () => {
        // Ensure ApiClient and its necessary methods are available
        if (typeof ApiClient !== 'undefined' && typeof ApiClient.getCurrentUserId === 'function' && typeof ApiClient.ajax === 'function') {
            console.log("Jellyfin Random Movie: ApiClient is available. Starting UI observation.");
            injectMaterialIcons(); // Ensure Material Icons are loaded
            injectCustomCss();   // Inject custom CSS
            const observer = new MutationObserver((mutations, obs) => {
                const headerRight = document.querySelector('.headerRight');
                const searchInputContainer = document.querySelector('.searchInput');
                if (headerRight || searchInputContainer) {
                    addButton();
                    obs.disconnect();
                    console.log("Jellyfin Random Movie: Observers disconnected.");
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });

            // Also try to add the button immediately if UI is already ready
            const headerRight = document.querySelector('.headerRight');
            const searchInputContainer = document.querySelector('.searchInput');
            if (headerRight || searchInputContainer) {
                 addButton();
                 observer.disconnect();
                 console.log("Jellyfin Random Movie: Button added immediately (UI already ready).");
            }

        } else {
            console.log("Jellyfin Random Movie: Waiting for ApiClient...");
            setTimeout(waitForApiClient, 200);
        }
    };

    waitForApiClient();

})();