document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const userSignedIn = document.getElementById('userSignedIn');
    const userSignedOut = document.getElementById('userSignedOut');
    const userPhoto = document.getElementById('userPhoto');
    const userName = document.getElementById('userName');
    const signOutButton = document.getElementById('signOutButton');

    // Check authentication state
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            // User is signed in
            if (userSignedIn) userSignedIn.style.display = 'flex';
            if (userSignedOut) userSignedOut.style.display = 'none';
            if (userPhoto) userPhoto.src = user.photoURL || 'icons/default-profile.png';
            if (userName) userName.textContent = user.displayName;

            // Add sign out handler
            if (signOutButton) {
                signOutButton.addEventListener('click', async () => {
                    try {
                        await firebase.auth().signOut();
                        localStorage.removeItem('user');
                        window.location.replace('index.html');
                    } catch (error) {
                        console.error('Sign out error:', error);
                    }
                });
            }
        } else {
            // User is signed out
            if (userSignedIn) userSignedIn.style.display = 'none';
            if (userSignedOut) userSignedOut.style.display = 'block';
        }
    });
});
