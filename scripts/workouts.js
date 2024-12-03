// Global variables for modal handling
let currentWorkoutToDelete = null;
const modal = document.getElementById('deleteModal');
const confirmDeleteBtn = document.getElementById('confirmDelete');
const cancelDeleteBtn = document.getElementById('cancelDelete');

// Tab state
let currentTab = 'my'; // 'my', 'saved', or 'public'

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
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const selectedTab = tab.dataset.tab;
            if (selectedTab === currentTab) return;

            currentTab = selectedTab;
            updateActiveTabs();

            const userId = firebase.auth().currentUser?.uid;
            if (!userId) return;

            switch (currentTab) {
                case 'my':
                    loadWorkouts(userId);
                    break;
                case 'saved':
                    loadSavedWorkouts(userId);
                    break;
                case 'public':
                    loadPublicWorkouts();
                    break;
            }
        });
    });
}

function updateActiveTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === currentTab);
    });
    
    // Show/hide create button based on tab
    const createButton = document.querySelector('.create-button-container');
    if (createButton) {
        createButton.style.display = currentTab === 'my' ? 'flex' : 'none';
    }
}

// Initialize modal event listeners
function initializeModalListeners() {
    confirmDeleteBtn.addEventListener('click', async () => {
        if (currentWorkoutToDelete) {
            await confirmDeleteWorkout(currentWorkoutToDelete);
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

// Load user's workouts from Firebase
async function loadWorkouts(userId) {
    try {
        showLoading();
        const workoutsRef = firebase.firestore().collection('workouts');
        
        workoutsRef
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot) => {
                const workouts = [];
                snapshot.forEach((doc) => {
                    workouts.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                displayWorkouts(workouts, 'my');
            }, (error) => {
                console.error('Error loading workouts:', error);
                showError(error.message);
            });
    } catch (error) {
        console.error('Error setting up workout listener:', error);
        showError(error.message);
    }
}

// Load saved workouts
async function loadSavedWorkouts(userId) {
    try {
        showLoading();
        const savedWorkoutsRef = firebase.firestore().collection('saved_workouts');
        
        const savedSnapshot = await savedWorkoutsRef
            .where('userId', '==', userId)
            .get();
        
        const workoutIds = savedSnapshot.docs.map(doc => doc.data().workoutId);
        
        if (workoutIds.length === 0) {
            displayWorkouts([], 'saved');
            return;
        }

        // Get all saved workouts
        const workouts = [];
        for (const workoutId of workoutIds) {
            const workoutDoc = await firebase.firestore()
                .collection('workouts')
                .doc(workoutId)
                .get();
            
            if (workoutDoc.exists) {
                workouts.push({
                    id: workoutDoc.id,
                    ...workoutDoc.data()
                });
            }
        }
        
        displayWorkouts(workouts, 'saved');
    } catch (error) {
        console.error('Error loading saved workouts:', error);
        showError(error.message);
    }
}

// Load public workouts
async function loadPublicWorkouts() {
    try {
        showLoading();
        const workoutsRef = firebase.firestore().collection('workouts');
        
        workoutsRef
            .where('visibility', '==', 'public')
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot) => {
                const workouts = [];
                snapshot.forEach((doc) => {
                    workouts.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                displayWorkouts(workouts, 'public');
            }, (error) => {
                console.error('Error loading public workouts:', error);
                showError(error.message);
            });
    } catch (error) {
        console.error('Error setting up public workouts listener:', error);
        showError(error.message);
    }
}

// Display workouts on the page
function displayWorkouts(workouts, type = 'my') {
    const workoutsList = document.getElementById('workouts-list');
    workoutsList.innerHTML = '';

    if (workouts.length === 0) {
        workoutsList.innerHTML = `
            <div class="empty-state">
                <p>${getEmptyStateMessage(type)}</p>
                ${type === 'my' ? '<a href="create-workout.html" class="button gradient-button">Create Your First Workout</a>' : ''}
            </div>
        `;
        return;
    }

    workouts.forEach(workout => {
        workoutsList.appendChild(createWorkoutCard(workout, type));
    });
}

function getEmptyStateMessage(type) {
    switch (type) {
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
function createWorkoutCard(workout, type) {
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
            ${workout.visibility === 'public' ? '<span class="visibility-badge">Public</span>' : ''}
        </div>
        <div class="workout-actions">
            <button onclick="startWorkout('${workout.id}')" class="button primary">
                ${workout.completed ? 'View' : 'Start'}
            </button>
            ${isOwner ? `
                <button onclick="editWorkout('${workout.id}')" class="button secondary">Edit</button>
                <button onclick="showDeleteConfirmation('${workout.id}')" class="button delete-btn">Delete</button>
            ` : `
                <button onclick="toggleSaveWorkout('${workout.id}')" class="button secondary save-button" data-workout-id="${workout.id}">
                    ${type === 'saved' ? 'Unsave' : 'Save'}
                </button>
            `}
        </div>
    `;
    return div;
}

// Toggle save/unsave workout
async function toggleSaveWorkout(workoutId) {
    try {
        const userId = firebase.auth().currentUser?.uid;
        if (!userId) {
            showError('Please sign in to save workouts');
            return;
        }

        const savedWorkoutsRef = firebase.firestore().collection('saved_workouts');
        const query = await savedWorkoutsRef
            .where('userId', '==', userId)
            .where('workoutId', '==', workoutId)
            .get();

        if (query.empty) {
            // Save workout
            await savedWorkoutsRef.add({
                userId: userId,
                workoutId: workoutId,
                savedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert('Workout saved successfully!');
        } else {
            // Unsave workout
            const docToDelete = query.docs[0];
            await docToDelete.ref.delete();
            alert('Workout removed from saved!');

            if (currentTab === 'saved') {
                loadSavedWorkouts(userId);
            }
        }
    } catch (error) {
        console.error('Error toggling workout save:', error);
        showError('Error saving/unsaving workout: ' + error.message);
    }
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
        await firebase.firestore()
            .collection('workouts')
            .doc(workoutId)
            .delete();
    } catch (error) {
        console.error('Error deleting workout:', error);
        alert('Error deleting workout. Please try again.');
    }
}

// Retry loading workouts
function retryLoad() {
    const user = firebase.auth().currentUser;
    if (user) {
        switch (currentTab) {
            case 'my':
                loadWorkouts(user.uid);
                break;
            case 'saved':
                loadSavedWorkouts(user.uid);
                break;
            case 'public':
                loadPublicWorkouts();
                break;
        }
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

// Make functions globally available
window.startWorkout = startWorkout;
window.editWorkout = editWorkout;
window.showDeleteConfirmation = showDeleteConfirmation;
window.toggleSaveWorkout = toggleSaveWorkout;
window.retryLoad = retryLoad;
