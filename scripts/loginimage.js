
(function() {
    'use strict';

    const getServerAddress = () => window.location.origin;
    const getUserImageUrl = (userId) => userId ? `${getServerAddress()}/Users/${userId}/Images/Primary?quality=90` : '';

    const updateProfilePicture = () => {
        console.log("updateProfilePicture called.");
        const userNameInput = document.getElementById('txtManualName');
        const manualLoginForm = document.querySelector('.manualLoginForm');
        const userLabel = manualLoginForm ? manualLoginForm.querySelector('label[for="txtManualName"]') : null;

        if (!userNameInput || !manualLoginForm || manualLoginForm.classList.contains('hide')) {
            console.log("Manual login form not yet visible or input not fully ready. Skipping update.");
            // Ensure input and label are visible if the script isn't active in this state
            if (userNameInput) userNameInput.style.display = '';
            if (userLabel) userLabel.style.display = '';
            return;
        }

        const currentUsername = userNameInput.value;
        console.log("Current Username:", currentUsername);

        let userId = null;
        let imageUrl = null;

        const userCardsContainer = document.getElementById('divUsers');
        if (userCardsContainer && currentUsername) {
            const userCardContent = userCardsContainer.querySelector(`.cardContent[data-username="${currentUsername}"]`);
            if (userCardContent) {
                userId = userCardContent.dataset.userid;
                console.log("Found userId from card:", userId);

                const cardImageContainer = userCardContent.querySelector('.cardImageContainer');
                if (cardImageContainer && cardImageContainer.style.backgroundImage) {
                    const style = cardImageContainer.style.backgroundImage;
                    const urlMatch = style.match(/url\(['"]?(.*?)['"]?\)/);
                    if (urlMatch && urlMatch[1]) {
                        imageUrl = urlMatch[1].replace(/width=\d+&?/g, '').replace(/height=\d+&?/g, '').replace(/tag=[^&]+&?/g, '');
                        if (imageUrl.endsWith('&')) imageUrl = imageUrl.slice(0, -1);
                        console.log("Extracted image URL from card style:", imageUrl);
                    }
                }
            } else {
                console.log("No user card found for username:", currentUsername);
            }
        }

        if (userId && !imageUrl) {
            imageUrl = getUserImageUrl(userId);
            console.log("Falling back to constructed image URL:", imageUrl);
        }

        let imageContainer = document.getElementById('userProfileImageContainer');
        if (!imageContainer) {
            imageContainer = document.createElement('div');
            imageContainer.id = 'userProfileImageContainer';
            const inputContainer = manualLoginForm.querySelector('.inputContainer');
            if (inputContainer) {
                manualLoginForm.insertBefore(imageContainer, inputContainer);
                console.log("Created and inserted image container.");
            } else {
                manualLoginForm.prepend(imageContainer);
                console.log("Created and prepended image container.");
            }
        }

        imageContainer.innerHTML = '';

        if (imageUrl) {
            console.log("Attempting to display image:", imageUrl);
            const imgElement = document.createElement('img');
            imgElement.src = imageUrl;
            imgElement.alt = `Profile picture for ${currentUsername}`;
            // Adding margins to the image via JS as well, to align with your new CSS
            imageContainer.appendChild(imgElement);

            // Now, explicitly hide the input field and its label using JS
            if (userNameInput) userNameInput.style.display = 'none';
            if (userLabel) userLabel.style.display = 'none';
            console.log("User input and label hidden by JS.");

        } else {
            console.log("No image URL to display.");
            imageContainer.innerHTML = '';
            // Ensure input and label are visible if no image is displayed by JS
            if (userNameInput) userNameInput.style.display = '';
            if (userLabel) userLabel.style.display = '';
            console.log("User input and label shown by JS (no image).");
        }
    };

    const setupObservers = () => {
        const userNameInput = document.getElementById('txtManualName');
        const manualLoginForm = document.querySelector('.manualLoginForm');

        if (userNameInput && manualLoginForm) {
            console.log("Found txtManualName and manualLoginForm. Setting up observers.");

            const nameObserver = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
                        console.log("txtManualName value attribute changed.");
                        updateProfilePicture();
                    }
                });
            });
            nameObserver.observe(userNameInput, { attributes: true });

            const formObserver = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        console.log("manualLoginForm class attribute changed.");
                        if (!manualLoginForm.classList.contains('hide')) {
                            console.log("manualLoginForm is now visible. Triggering update.");
                            updateProfilePicture();
                        } else {
                            // If form becomes hidden, make sure input/label are visible again
                            const userLabel = manualLoginForm.querySelector('label[for="txtManualName"]');
                            userNameInput.style.display = '';
                            if (userLabel) userLabel.style.display = '';
                            const imgContainer = document.getElementById('userProfileImageContainer');
                            if (imgContainer) imgContainer.innerHTML = ''; // Clear image
                            console.log("manualLoginForm is now hidden. Input/label reset.");
                        }
                    }
                });
            });
            formObserver.observe(manualLoginForm, { attributes: true });

            if (!manualLoginForm.classList.contains('hide')) {
                console.log("manualLoginForm already visible on load. Triggering initial update.");
                updateProfilePicture();
            } else {
                console.log("manualLoginForm is initially hidden.");
                // Ensure input and label are visible if it's hidden on load
                const userLabel = manualLoginForm.querySelector('label[for="txtManualName"]');
                userNameInput.style.display = '';
                if (userLabel) userLabel.style.display = '';
            }

        } else {
            console.log("Waiting for txtManualName and manualLoginForm to be available...");
            setTimeout(setupObservers, 100);
        }
    };

    setupObservers();
})();