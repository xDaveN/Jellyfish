// ==UserScript==
// @name         Jellyfin Theme Selector
// @namespace    jellyfin-theme-selector
// @version      2.2
// @description  Add theme selector dropdown to Jellyfin preferences menu
// @author       n00bcodr
// @match        */web/*
// @match        */web/index.html*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    console.log('[🪼🎨Jellyfish Theme Selector] Script loaded');

    const themes = {
        'Default': '',
        'Aurora': '@import url("https://cdn.jsdelivr.net/gh/n00bcodr/Jellyfish/colors/aurora.css");',
        'Banana': '@import url("https://cdn.jsdelivr.net/gh/n00bcodr/Jellyfish/colors/banana.css");',
        'Coal': '@import url("https://cdn.jsdelivr.net/gh/n00bcodr/Jellyfish/colors/coal.css");',
        'Coral': '@import url("https://cdn.jsdelivr.net/gh/n00bcodr/Jellyfish/colors/coral.css");',
        'Forest': '@import url("https://cdn.jsdelivr.net/gh/n00bcodr/Jellyfish/colors/forest.css");',
        'Grass': '@import url("https://cdn.jsdelivr.net/gh/n00bcodr/Jellyfish/colors/grass.css");',
        'Jellyblue': '@import url("https://cdn.jsdelivr.net/gh/n00bcodr/Jellyfish/colors/jellyblue.css");',
        'Jellyflix': '@import url("https://cdn.jsdelivr.net/gh/n00bcodr/Jellyfish/colors/jellyflix.css");',
        'Jellypurple': '@import url("https://cdn.jsdelivr.net/gh/n00bcodr/Jellyfish/colors/jellypurple.css");',
        'Lavender': '@import url("https://cdn.jsdelivr.net/gh/n00bcodr/Jellyfish/colors/lavender.css");',
        'Midnight': '@import url("https://cdn.jsdelivr.net/gh/n00bcodr/Jellyfish/colors/midnight.css");',
        'Mint': '@import url("https://cdn.jsdelivr.net/gh/n00bcodr/Jellyfish/colors/mint.css");',
        'Ocean': '@import url("https://cdn.jsdelivr.net/gh/n00bcodr/Jellyfish/colors/ocean.css");',
        'Peach': '@import url("https://cdn.jsdelivr.net/gh/n00bcodr/Jellyfish/colors/peach.css");',
        'Watermelon': '@import url("https://cdn.jsdelivr.net/gh/n00bcodr/Jellyfish/colors/watermelon.css");'
    };

    // Inject custom CSS for proper styling
    const injectCustomCss = () => {
        if (!document.getElementById('jellyfin-theme-selector-css')) {
            const style = document.createElement('style');
            style.id = 'jellyfin-theme-selector-css';
            style.innerHTML = `
                #theme-selector-body {
                    display: flex !important;
                    align-items: center;
                    justify-content: flex-start;
                    flex-direction: row;
                    gap: 1.5em;
                    padding: .4em .75em;
                }
                #theme-selector-select {
                    max-width: 200px !important;
                    min-width: 150px !important;
                }
            `;
            document.head.appendChild(style);
            console.log('[🪼🎨Jellyfish Theme Selector] Custom CSS injected');
        }
    };

    // Extract user ID from the ApiClient
    const extractUserId = () => {
        try {
            const userId = window.ApiClient?.getCurrentUserId?.();
            if (userId) {
                return userId;
            }
        } catch (e) {
            console.error('[🪼🎨Jellyfish Theme Selector] Error extracting user ID:', e);
        }
        console.error('[🪼🎨Jellyfish Theme Selector] Could not extract user ID');
        return null;
    };

    // Get current theme from localStorage
    const getCurrentTheme = (userId) => {
        const key = `${userId}-customCss`;
        return localStorage.getItem(key) || '';
    };

    // Set theme in localStorage
    const setTheme = (userId, themeValue) => {
        const key = `${userId}-customCss`;
        if (themeValue) {
            localStorage.setItem(key, themeValue);
            console.log('[🪼🎨Jellyfish Theme Selector] Theme set:', themeValue);
        } else {
            localStorage.removeItem(key);
            console.log('[🪼🎨Jellyfish Theme Selector] Theme cleared (default)');
        }
    };

    // Show notification using Jellyfin's built-in system
    const showNotification = (message, type = 'info') => {
        try {
            if (window.Dashboard?.alert) {
                window.Dashboard.alert(message);
            } else if (window.require) {
                window.require(['toast'], (toast) => toast(message));
            } else {
                console.log(`[🪼🎨Jellyfish Theme Selector] Notification (${type}): ${message}`);
            }
        } catch (e) {
            console.error('[🪼🎨Jellyfish Theme Selector] Failed to show notification:', e);
        }
    };

    // Check for a pending notification after a page refresh
    const checkPostRefreshNotification = () => {
        const pendingNotification = sessionStorage.getItem('jellyfin-theme-applied');
        if (pendingNotification) {
            sessionStorage.removeItem('jellyfin-theme-applied');
            setTimeout(() => {
                showNotification('Theme Applied!', 'success');
            }, 1000); // Wait a bit for the UI to be ready
        }
    };

    // Create the theme selector element
    const createThemeSelector = (userId) => {
        const container = document.createElement('div');
        container.className = 'theme-selector-container listItem-border';
        container.id = 'jellyfin-theme-selector';

        const listItem = document.createElement('div');
        listItem.className = 'listItem';
        listItem.id = 'theme-selector-item';

        const icon = document.createElement('span');
        icon.className = 'material-icons listItemIcon listItemIcon-transparent';
        icon.id = 'theme-selector-icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = 'palette';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'listItemBody';
        contentDiv.id = 'theme-selector-body';

        const textLabel = document.createElement('div');
        textLabel.className = 'listItemBodyText';
        textLabel.id = 'theme-selector-label';
        textLabel.textContent = 'Theme';

        const select = document.createElement('select');
        select.setAttribute('is', 'emby-select');
        select.className = 'emby-select-withcolor emby-select';
        select.id = 'theme-selector-select';
        select.removeAttribute('label');

        const currentThemeValue = getCurrentTheme(userId);
        let selectedThemeName = 'Default';
        for (const [name, value] of Object.entries(themes)) {
            if (value === currentThemeValue) {
                selectedThemeName = name;
                break;
            }
        }

        Object.keys(themes).forEach(themeName => {
            const option = document.createElement('option');
            option.value = themeName;
            option.textContent = themeName;
            if (themeName === selectedThemeName) {
                option.selected = true;
            }
            select.appendChild(option);
        });

        select.addEventListener('change', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const newThemeName = e.target.value;
            const newThemeValue = themes[newThemeName];
            console.log('[🪼🎨Jellyfish Theme Selector] Theme changed to:', newThemeName);

            setTheme(userId, newThemeValue);
            sessionStorage.setItem('jellyfin-theme-applied', newThemeName);
            showNotification('Applying theme and refreshing...', 'info');

            setTimeout(() => window.location.reload(), 500);
        });

        contentDiv.appendChild(textLabel);
        contentDiv.appendChild(select);
        listItem.appendChild(icon);
        listItem.appendChild(contentDiv);
        container.appendChild(listItem);

        return container;
    };

    /**
     * Finds the correct DOM location and injects the theme selector.
     * Returns true on success, false on failure.
     */
    const injectThemeSelector = () => {
        const targetDiv = document.querySelector('.verticalSection .headerUsername');
        if (!targetDiv) return false;

        const parentSection = targetDiv.closest('.verticalSection');
        if (!parentSection) return false;

        const userId = extractUserId();
        if (!userId) return false;

        console.log('[🪼🎨Jellyfish Theme Selector] Creating theme selector element...');
        const themeSelector = createThemeSelector(userId);
        parentSection.appendChild(themeSelector);
        console.log('[🪼🎨Jellyfish Theme Selector] Successfully injected!');
        return true;
    };

    /**
     * Main function to initialize the script. It waits for the Jellyfin API client
     * to be ready and then uses a persistent MutationObserver to inject the theme selector
     * whenever the user navigates to the correct page.
     */
    const initialize = () => {
        // Ensure the Jellyfin API client is available
        if (typeof ApiClient === 'undefined' || typeof ApiClient.getCurrentUserId !== 'function') {
            console.log('[🪼🎨Jellyfish Theme Selector] Waiting for ApiClient...');
            setTimeout(initialize, 250);
            return;
        }

        console.log('[🪼🎨Jellyfish Theme Selector] ApiClient is available. Starting persistent element monitoring.');
        injectCustomCss();
        checkPostRefreshNotification();

        // This observer watches for DOM changes to detect navigation to and from the preferences page.
        // It is persistent and does not disconnect.
        const observer = new MutationObserver((mutations, obs) => {
            const onPreferencesPage = document.querySelector('.headerUsername') && document.querySelector('.lnkUserProfile');
            const selectorExists = document.getElementById('jellyfin-theme-selector');

            //If we are on the preferences page and the selector is not there, inject it.
            if (onPreferencesPage && !selectorExists) {
                console.log('[🪼🎨Jellyfish Theme Selector] Preferences page detected and selector is missing. Injecting...');
                injectThemeSelector();
            }
        });

        // Start observing the entire body for changes for the entire session.
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        console.log('[🪼🎨Jellyfish Theme Selector] Observer is now active and will monitor for navigation.');
    };

    // Start the script once the DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
