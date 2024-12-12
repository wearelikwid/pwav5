document.addEventListener('DOMContentLoaded', async function() {
    // Wait for Firebase to initialize
    while (!window.firebase || !firebase.app()) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    // Get DOM elements - auth page elements
    const googleSignInButton = document.getElementById('googleSignIn');
    const userDetailsDiv = document.getElementById('userDetails');
    const userPhotoImg = document.getElementById('userPhoto');
    const userNameP = document.getElementById('userName');
    const userEmailP = document.getElementById('userEmail');
    const signOutButton = document.getElementById('signOut');

    // Get DOM elements - landing page elements
    const authStatus = document.getElementById('authStatus');
    const userSignedInDiv = document.getElementById('userSignedIn');
    const userSignedOutDiv = document.getElementById('userSignedOut');
    const mainSignOutButton = document.getElementById('signOutButton');

    // Initialize Google provider
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');

    // Check which page we're on
    const isAuthPage = window.location.pathname.includes('auth.html');
    const isIndexPage = window.location.pathname.includes('index.html') || window.location.pathname === '/';

    // Ensure proper initial display states
    function updateDisplayStates(user) {
        if (isIndexPage) {
            if (userSignedInDiv) userSignedInDiv.style.display = user ? 'block' : 'none';
            if (userSignedOutDiv) userSignedOutDiv.style.display = user ? 'none' : 'block';
            
            if (user) {
                const indexUserPhoto = userSignedInDiv?.querySelector('#userPhoto');
                const indexUserName = userSignedInDiv?.querySelector('#userName');
                if (indexUserPhoto) indexUserPhoto.src = user.photoURL || '';
                if (indexUserName) indexUserName.textContent = user.displayName || '';
            }
        }

        if (isAuthPage && userDetailsDiv) {
            userDetailsDiv.style.display = user ? 'block' : 'none';
            if (user) {
                if (userPhotoImg) userPhotoImg.src = user.photoURL || '';
                if (userNameP) userNameP.textContent = user.displayName || '';
                if (userEmailP) userEmailP.textContent = user.email || '';
            }
        }
    }

    // Google Sign In
    async function signInWithGoogle() {
        try {
            const result = await firebase.auth().signInWithPopup(provider);
            if (result.user) {
                const userData = {
                    uid: result.user.uid,
                    email: result.user.email,
                    displayName: result.user.displayName,
                    photoURL: result.user.photoURL
                };
                localStorage.setItem('user', JSON.stringify(userData));
                
                if (isAuthPage) {
                    window.location.replace('index.html');
                }
            }
        } catch (error) {
            console.error("Error during sign in:", error);
            alert("Error signing in: " + error.message);
        }
    }

    // Sign Out
    async function handleSignOut() {
        try {
            localStorage.clear();
            await firebase.auth().signOut();
            window.location.replace('index.html');
        } catch (error) {
            console.error('Sign out error:', error);
            window.location.replace('index.html');
        }
    }

    // Event Listeners
    if (googleSignInButton) {
        googleSignInButton.addEventListener('click', signInWithGoogle);
    }

    if (signOutButton) {
        signOutButton.addEventListener('click', handleSignOut);
    }

    if (mainSignOutButton) {
        mainSignOutButton.addEventListener('click', handleSignOut);
    }

    // Set initial states
    const currentUser = firebase.auth().currentUser;
    updateDisplayStates(currentUser);

    // Auth state changes
    firebase.auth().onAuthStateChanged((user) => {
        console.log('Auth state changed:', user ? 'signed in' : 'signed out');
        updateDisplayStates(user);
    });
});
