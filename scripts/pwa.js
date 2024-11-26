let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    // Update UI to notify the user they can add to home screen
    const installButton = document.getElementById('install-button');
    if (installButton) {
        installButton.style.display = 'block';
        
        installButton.addEventListener('click', async () => {
            // Hide the app provided install promotion
            installButton.style.display = 'none';
            // Show the install prompt
            deferredPrompt.prompt();
            // Wait for the user to respond to the prompt
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            // We've used the prompt, and can't use it again, discard it
            deferredPrompt = null;
        });
    }
});

window.addEventListener('appinstalled', (evt) => {
    console.log('App was installed successfully');
});
