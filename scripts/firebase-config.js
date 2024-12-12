// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCMIz6SiQDy5hXTeV7H7iDR2ZONL_zd384",
    authDomain: "el-forma-app.firebaseapp.com",
    projectId: "el-forma-app",
    storageBucket: "el-forma-app.appspot.com",
    messagingSenderId: "925445449660",
    appId: "1:925445449660:web:05fd801700fb14dcbf6db9"
};

// Initialize Firebase with error handling
try {
    // Check if Firebase is already initialized
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    // Enable persistence for offline support
    firebase.firestore().enablePersistence()
        .catch((err) => {
            if (err.code === 'failed-precondition') {
                // Multiple tabs open, persistence can only be enabled in one tab at a time
                console.warn('Firebase persistence failed: Multiple tabs open');
            } else if (err.code === 'unimplemented') {
                // The current browser doesn't support persistence
                console.warn('Firebase persistence not supported in this browser');
            }
        });

    // Initialize services
    const db = firebase.firestore();
    const auth = firebase.auth();

    // Configure auth persistence
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .catch((error) => {
            console.error('Auth persistence error:', error);
        });

    // Export the Firebase services
    window.db = db;
    window.auth = auth;

    // Log successful initialization
    console.log('Firebase initialized successfully');

} catch (error) {
    console.error('Firebase initialization error:', error);
    // Show error to user if needed
    if (document.getElementById('errorMessage')) {
        document.getElementById('errorMessage').textContent = 'Failed to initialize app. Please refresh the page.';
        document.getElementById('errorMessage').style.display = 'block';
    }
}

// Add connection state listener
if (typeof firebase !== 'undefined' && firebase.database) {
    const connectedRef = firebase.database().ref('.info/connected');
    connectedRef.on('value', (snap) => {
        if (snap.val() === true) {
            console.log('Connected to Firebase');
        } else {
            console.log('Not connected to Firebase');
        }
    });
}
