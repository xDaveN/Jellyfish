document.addEventListener("DOMContentLoaded", function() {
    // Check if the title is "Jellyfin" before changing it
    if (document.title === "Jellyfin")
    {
        document.title = "Jellyfish";
    }

    // Create a MutationObserver to prevent any changes to the title
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                // Only change the title if it's set to "Jellyfin"
                if (document.title === "Jellyfin") {
                    document.title = "Jellyfish";
                }
            }
        });
    });

    // Observe the document title for changes
    observer.observe(document.querySelector('title'), { childList: true });

    // Set up a fallback in case of attempts to change the title through direct assignment
    Object.defineProperty(document, 'title', {
        set: function(value) {
            // Only allow the title to change if the new value is "Jellyfin"
            if (value === "Jellyfin") {
                document.querySelector('title').textContent = "Jellyfish";
            } else {
                document.querySelector('title').textContent = value;
            }
        },
        get: function() {
            return document.querySelector('title').textContent;
        }
    });
});
