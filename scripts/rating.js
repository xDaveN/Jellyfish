/**
 * Efficiently applies rating attributes to media elements for CSS styling
 * Features: Performance optimization, error handling, mutation observer, and cleanup
 */
(function() {
    'use strict';

    console.log("Jellyfin Rating Script: Loaded.");

    // Configuration
    const CONFIG = {
        targetSelector: '.mediaInfoOfficialRating',
        attributeName: 'rating',
        fallbackInterval: 1000, // Fallback polling interval
        debounceDelay: 100, // Debounce delay for rapid changes
        maxRetries: 3
    };

    let observer = null;
    let fallbackTimer = null;
    let debounceTimer = null;
    let processedElements = new WeakSet();

    /**
     * Processes rating elements and applies attributes
     */
    function processRatingElements() {
        try {
            const elements = document.querySelectorAll(CONFIG.targetSelector);
            let processedCount = 0;

            elements.forEach((element, index) => {
                // Skip if already processed and unchanged
                if (processedElements.has(element)) {
                    const currentRating = element.textContent?.trim();
                    const existingRating = element.getAttribute(CONFIG.attributeName);
                    if (currentRating === existingRating) {
                        return;
                    }
                }

                const ratingText = element.textContent?.trim();
                if (ratingText && ratingText.length > 0) {
                    // Normalize rating text (remove extra spaces, standardize format)
                    const normalizedRating = normalizeRating(ratingText);

                    if (element.getAttribute(CONFIG.attributeName) !== normalizedRating) {
                        element.setAttribute(CONFIG.attributeName, normalizedRating);
                        processedElements.add(element);
                        processedCount++;

                        // Add accessibility attributes
                        if (!element.getAttribute('aria-label')) {
                            element.setAttribute('aria-label', `Content rated ${normalizedRating}`);
                        }

                        // Add title for hover tooltip
                        if (!element.getAttribute('title')) {
                            element.setAttribute('title', `Rating: ${normalizedRating}`);
                        }
                    }
                }
            });

            if (processedCount > 0) {
                console.log(`Jellyfin Rating Script: Processed ${processedCount} rating elements.`);
            }

        } catch (error) {
            console.error("Jellyfin Rating Script: Error processing elements:", error);
        }
    }

    /**
     * Normalizes rating text for consistent formatting
     */
    function normalizeRating(rating) {
        if (!rating) return '';

        // Remove extra whitespace and normalize
        let normalized = rating.replace(/\s+/g, ' ').trim().toUpperCase();

        // Handle common variations and standardize formats
        const ratingMappings = {
            'NOT RATED': 'NR',
            'NOT-RATED': 'NR',
            'UNRATED': 'NR',
            'NO RATING': 'NR',
            'APPROVED': 'APPROVED',
            'PASSED': 'PASSED'
        };

        return ratingMappings[normalized] || rating.trim();
    }

    /**
     * Debounced version of processRatingElements
     */
    function debouncedProcess() {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(processRatingElements, CONFIG.debounceDelay);
    }

    /**
     * Sets up MutationObserver for efficient DOM monitoring
     */
    function setupMutationObserver() {
        if (!window.MutationObserver) {
            console.warn("Jellyfin Rating Script: MutationObserver not supported, falling back to polling.");
            return false;
        }

        try {
            observer = new MutationObserver((mutations) => {
                let shouldProcess = false;

                mutations.forEach((mutation) => {
                    // Check for added nodes
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                if (node.matches && node.matches(CONFIG.targetSelector)) {
                                    shouldProcess = true;
                                } else if (node.querySelector && node.querySelector(CONFIG.targetSelector)) {
                                    shouldProcess = true;
                                }
                            }
                        });
                    }

                    // Check for text content changes
                    if (mutation.type === 'characterData' || mutation.type === 'childList') {
                        const target = mutation.target;
                        if (target.nodeType === Node.ELEMENT_NODE &&
                            (target.matches(CONFIG.targetSelector) || target.closest(CONFIG.targetSelector))) {
                            shouldProcess = true;
                        }
                    }
                });

                if (shouldProcess) {
                    debouncedProcess();
                }
            });

            // Start observing
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true,
                characterDataOldValue: false
            });

            console.log("Jellyfin Rating Script: MutationObserver initialized.");
            return true;

        } catch (error) {
            console.error("Jellyfin Rating Script: Failed to setup MutationObserver:", error);
            return false;
        }
    }

    /**
     * Sets up fallback polling mechanism
     */
    function setupFallbackPolling() {
        fallbackTimer = setInterval(processRatingElements, CONFIG.fallbackInterval);
        console.log(`Jellyfin Rating Script: Fallback polling started (${CONFIG.fallbackInterval}ms interval).`);
    }

    /**
     * Cleanup function
     */
    function cleanup() {
        if (observer) {
            observer.disconnect();
            observer = null;
        }
        if (fallbackTimer) {
            clearInterval(fallbackTimer);
            fallbackTimer = null;
        }
        if (debounceTimer) {
            clearTimeout(debounceTimer);
            debounceTimer = null;
        }
        processedElements = new WeakSet();
    }

    /**
     * Initialize the rating system
     */
    function initialize() {
        // Clean up any existing instances
        cleanup();

        // Process existing elements immediately
        processRatingElements();

        // Set up efficient monitoring
        const observerSetup = setupMutationObserver();

        // Always set up fallback polling as backup
        setupFallbackPolling();

        console.log("Jellyfin Rating Script: Initialization complete.");
    }

    // Handle page visibility changes to optimize performance
    if (typeof document.visibilityState !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                // Re-process when page becomes visible
                setTimeout(processRatingElements, 100);
            }
        });
    }

    // Handle navigation changes (for SPAs)
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            setTimeout(initialize, 500); // Re-initialize after navigation
        }
    }).observe(document, { subtree: true, childList: true });

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

    // Cleanup on page unload
    window.addEventListener('beforeunload', cleanup);

    // Expose cleanup function globally for manual cleanup if needed
    window.jellyfinRatingCleanup = cleanup;

})();