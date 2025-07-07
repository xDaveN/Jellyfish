(function() {
    console.log("Jellyfin Rating Script: Script loaded."); // Changed log message

    const checkInterval = 500; // Check every 500ms

    function applyRatingAttributes() { // Renamed function for clarity
        // console.log("Jellyfin Rating Script: Attempting to apply rating attributes."); // Uncomment for verbose logs

        const elements = document.querySelectorAll('.mediaInfoOfficialRating');
        // console.log(`Jellyfin Rating Script: Found ${elements.length} elements with class 'mediaInfoOfficialRating'.`); // Uncomment for verbose logs

        if (elements.length > 0) {
            elements.forEach((el, index) => {
                const txt = el.textContent.trim();
                if (!el.hasAttribute('rating') || el.getAttribute('rating') !== txt) {
                    el.setAttribute('rating', txt); // Set 'rating' attribute
                    // console.log(`Jellyfin Rating Script: Added/Updated rating='${txt}' for element ${index}.`); // Uncomment for verbose logs
                }
            });
        }
    }

    // Run once immediately when the script loads
    applyRatingAttributes();
    console.log("Jellyfin Rating Script: Ran immediately on load.");

    // Then, set up continuous polling
    setInterval(applyRatingAttributes, checkInterval);
    console.log(`Jellyfin Rating Script: Started continuous polling every ${checkInterval}ms.`);
})();