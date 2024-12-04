// Global variables
let currentWorkoutToDelete = null;
let currentTab = 'my'; // 'my', 'saved', or 'public'
const modal = document.getElementById('deleteModal');
const confirmDeleteBtn = document.getElementById('confirmDelete');
const cancelDeleteBtn = document.getElementById('cancelDelete');
let unsubscribeListener = null; // For cleanup of real-time listeners

// Initialize event listeners when page loads
document.addEventListener('DOMContentLoaded', function() {
    firebase.auth().onAuthStateChanged(function(user) {
        if (!user) {
            window.location.href = 'auth.html';
            return;
        }
        initializeModalListeners();
        initializeTabs();
        loadWorkouts(user.uid);
    });
});

// Initialize tabs
function initializeTabs() {
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'tabs-container';
    tabsContainer.innerHTML = `
        <div class="tabs">
            <button class="tab active" data-tab="my">My Workouts</button>
            <button class="tab" data-tab="saved">Saved Workouts</button>
            <button class="tab" data-tab="public">Public Workouts</button>
        </div>
    `;

    // Insert tabs after header
    const header = document.querySelector('.app-header');
    header.insertAdjacentElement('afterend', tabsContainer);

    // Add tab click listeners
    const tabs = tabsContainer.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Cleanup previous listener if exists
            if (unsubscribeListener) {
                unsubscribeListener();
            }
            
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentTab = tab.dataset.tab;
            loadWorkouts(firebase.auth().currentUser.uid);
        });
    });
}

// Initialize modal listeners
function initializeModalListeners() {
    confirmDeleteBtn.addEventListener('click', async () => {
        if (currentWorkoutToDelete) {
            await confirmDeleteWorkout(currentWorkoutToDelete);
            loadWorkouts(firebase.auth().currentUser.uid);
        }
        hideModal();
    });

    cancelDeleteBtn.addEventListener('click', hideModal);

    window.onclick = function(event) {
        if (event.target === modal) {
            hideModal();
        }
    };
}

// Show loading state
function showLoading() {
    const workoutsList = document.getElementById('workouts-list');
    workoutsList.innerHTML = `
        <div class="empty-state">
            <div class="spinner"></div>
            <p>Loading workouts...</p>
        </div>
    `;
}

// Show error message
function showError(message) {
    const workoutsList = document.getElementById('workouts-list');
    workoutsList.innerHTML = `
        <div class="empty-state">
            <p>Error: ${message}</p>
            <button onclick="retryLoad()" class="button gradient-button">Retry</button>
        </div>
    `;
}

// Check if workout is saved by current user
async function isWorkoutSaved(workoutId) {
    const userId = firebase.auth().currentUser?.uid;
    if (!userId) return false;

    try {
        const savedSnapshot = await firebase.firestore()
            .collection('saved_workouts')
            .where('userId', '==', userId)
            .where('workoutId', '==', workoutId)
            .get();

        return !savedSnapshot.empty;
    } catch (error) {
        console.error('Error checking saved status:', error);
        return false;
    }
}

// Save workout
async function saveWorkout(workoutId) {
    const userId = firebase.auth().currentUser?.uid;
    if (!userId) return;

    try {
        const savedWorkoutId = `${userId}_${workoutId}`;
        await firebase.firestore()
            .collection('saved_workouts')
            .doc(savedWorkoutId)
            .set({
                userId: userId,
                workoutId: workoutId,
                savedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

        // Refresh the display
        loadWorkouts(userId);
    } catch (error) {
        console.error('Error saving workout:', error);
        alert('Error saving workout. Please try again.');
    }
}

// Unsave workout
async function unsaveWorkout(workoutId) {
    const userId = firebase.auth().currentUser?.uid;
    if (!userId) return;

    try {
        const savedWorkoutId = `${userId}_${workoutId}`;
        await firebase.firestore()
            .collection('saved_workouts')
            .doc(savedWorkoutId)
            .delete();

        // Refresh the display
        loadWorkouts(userId);
    } catch (error) {
        console.error('Error unsaving workout:', error);
        alert('Error unsaving workout. Please try again.');
    }
}

// Check workout completion status
async function checkWorkoutProgress(workoutId) {
    const userId = firebase.auth().currentUser?.uid;
    if (!userId) return false;

    try {
        const progressSnapshot = await firebase.firestore()
            .collection('workout_progress')
            .where('userId', '==', userId)
            .where('workoutId', '==', workoutId)
            .get();

        return !progressSnapshot.empty;
    } catch (error) {
        console.error('Error checking workout progress:', error);
        return false;
    }
}

// Load workouts based on current tab
async function loadWorkouts(userId) {
    try {
        showLoading();
        const workoutsRef = firebase.firestore().collection('workouts');

        // Cleanup previous listener
        if (unsubscribeListener) {
            unsubscribeListener();
        }

        switch (currentTab) {
            case 'my':
                // Set up real-time listener for user's workouts
                unsubscribeListener = workoutsRef
                    .where('userId', '==', userId)
                    .orderBy('createdAt', 'desc')
                    .onSnapshot(async (snapshot) => {
                        const workouts = [];
                        for (const doc of snapshot.docs) {
                            const workout = {
                                id: doc.id,
                                ...doc.data(),
                                completed: await checkWorkoutProgress(doc.id)
                            };
                            workouts.push(workout);
                        }
                        displayWorkouts(workouts);
                    }, (error) => {
                        console.error('Error loading workouts:', error);
                        showError(error.message);
                    });
                break;

            case 'saved':
                // Set up real-time listener for saved workouts
                const savedWorkoutsRef = firebase.firestore().collection('saved_workouts');
                unsubscribeListener = savedWorkoutsRef
                    .where('userId', '==', userId)
                    .orderBy('savedAt', 'desc')
                    .onSnapshot(async (snapshot) => {
                        const workouts = [];
                        for (const savedDoc of snapshot.docs) {
                            const workoutDoc = await workoutsRef.doc(savedDoc.data().workoutId).get();
                            if (workoutDoc.exists) {
                                const workout = {
                                    id: workoutDoc.id,
                                    ...workoutDoc.data(),
                                    completed: await checkWorkoutProgress(workoutDoc.id),
                                    saved: true
                                };
                                workouts.push(workout);
                            }
                        }
                        displayWorkouts(workouts);
                    }, (error) => {
                        console.error('Error loading saved workouts:', error);
                        showError(error.message);
                    });
                break;

            case 'public':
                // Set up real-time listener for public workouts
                unsubscribeListener = workoutsRef
                    .where('visibility', '==', 'public')
                    .orderBy('createdAt', 'desc')
                    .onSnapshot(async (snapshot) => {
                        const workouts = [];
                        for (const doc of snapshot.docs) {
                            const workout = {
                                id: doc.id,
                                ...doc.data(),
                                completed: await checkWorkoutProgress(doc.id),
                                saved: await isWorkoutSaved(doc.id)
                            };
                            workouts.push(workout);
                        }
                        displayWorkouts(workouts);
                    }, (error) => {
                        console.error('Error loading public workouts:', error);
                        showError(error.message);
                    });
                break;
        }
    } catch (error) {
        console.error('Error setting up workouts listener:', error);
        showError(error.message);
    }
}

// Display workouts on the page
function displayWorkouts(workouts) {
    const workoutsList = document.getElementById('workouts-list');
    workoutsList.innerHTML = '';

    if (workouts.length === 0) {
        workoutsList.innerHTML = `
            <div class="empty-state">
                <p>${getEmptyStateMessage()}</p>
                ${currentTab === 'my' ? '<a href="create-workout.html" class="button gradient-button">Create Your First Workout</a>' : ''}
            </div>
        `;
        return;
    }

    workouts.forEach(workout => {
        workoutsList.appendChild(createWorkoutCard(workout));
    });
}

// Get empty state message based on current tab
function getEmptyStateMessage() {
    switch (currentTab) {
        case 'my':
            return 'No workouts created yet.';
        case 'saved':
            return 'No saved workouts yet.';
        case 'public':
            return 'No public workouts available.';
        default:
            return 'No workouts found.';
    }
}

// Create workout card HTML
function createWorkoutCard(workout) {
    const div = document.createElement('div');
    div.className = 'workout-card';
    if (workout.completed) {
        div.classList.add('completed');
    }

    const exerciseCount = workout.sections?.reduce((total, section) => 
        total + (section.exercises?.length || 0), 0) || 0;

    const isOwner = workout.userId === firebase.auth().currentUser?.uid;

    div.innerHTML = `
        <h3>${workout.name || 'Unnamed Workout'}</h3>
        <div class="workout-meta">
            <span>${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''}</span>
            ${workout.completed ? '<span class="completion-status">✓ Completed</span>' : ''}
        </div>
        <div class="workout-actions">
            <button onclick="startWorkout('${workout.id}')" class="button primary">
                ${workout.completed ? 'View' : 'Start'}
            </button>
            ${isOwner ? `
                <button onclick="editWorkout('${workout.id}')" class="button secondary">Edit</button>
                <button onclick="showDeleteConfirmation('${workout.id}')" class="button delete-btn">Delete</button>
            ` : currentTab === 'public' ? `
                <button onclick="${workout.saved ? `unsaveWorkout('${workout.id}')` : `saveWorkout('${workout.id}')`}" 
                        class="button ${workout.saved ? 'delete-btn' : 'secondary'}">
                    ${workout.saved ? 'Unsave' : 'Save'}
                </button>
            ` : currentTab === 'saved' ? `
                <button onclick="unsaveWorkout('${workout.id}')" class="button delete-btn">Unsave</button>
            ` : ''}
        </div>
    `;
    return div;
}

// Function to start a workout
function startWorkout(workoutId) {
    window.location.href = `start-workout.html?id=${workoutId}`;
}

// Function to edit a workout
function editWorkout(workoutId) {
    window.location.href = `create-workout.html?id=${workoutId}&edit=true`;
}

// Show delete confirmation modal
function showDeleteConfirmation(workoutId) {
    currentWorkoutToDelete = workoutId;
    modal.classList.add('show');
}

// Hide modal
function hideModal() {
    modal.classList.remove('show');
    currentWorkoutToDelete = null;
}

// Confirm workout deletion
async function confirmDeleteWorkout(workoutId) {
    try {
        const batch = firebase.firestore().batch();
        
        // Delete all saved_workouts references
        const savedWorkoutsSnapshot = await firebase.firestore()
            .collection('saved_workouts')
            .where('workoutId', '==', workoutId)
            .get();
            
        savedWorkoutsSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        // Delete all workout_progress entries
        const progressSnapshot = await firebase.firestore()
            .collection('workout_progress')
            .where('workoutId', '==', workoutId)
            .get();
            
        progressSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        // Delete the workout itself
        const workoutRef = firebase.firestore().collection('workouts').doc(workoutId);
        batch.delete(workoutRef);

        // Commit all deletes in one batch
        await batch.commit();
    } catch (error) {
        console.error('Error deleting workout:', error);
        alert('Error deleting workout. Please try again.');
    }
}

// Retry loading workouts
function retryLoad() {
    const user = firebase.auth().currentUser;
    if (user) {
        loadWorkouts(user.uid);
    } else {
        window.location.href = 'auth.html';
    }
}

// Handle escape key for modal
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && modal.classList.contains('show')) {
        hideModal();
    }
});

// Cleanup listener when leaving page
window.addEventListener('beforeunload', () => {
    if (unsubscribeListener) {
        unsubscribeListener();
    }
});
