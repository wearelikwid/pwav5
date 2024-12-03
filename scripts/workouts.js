// Global variables for modal handling
let currentWorkoutToDelete = null;
const modal = document.getElementById('deleteModal');
const confirmDeleteBtn = document.getElementById('confirmDelete');
const cancelDeleteBtn = document.getElementById('cancelDelete');

// Tab state
let currentTab = 'my'; // 'my' or 'public'

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
            <button class="tab" data-tab="public">Public Workouts</button>
        </div>
    `;

    const header = document.querySelector('.app-header');
    header.insertBefore(tabsContainer, header.querySelector('h1'));

    // Add tab click listeners
    tabsContainer.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            currentTab = tab.dataset.tab;
            updateActiveTabs();
            if (currentTab === 'my') {
                loadWorkouts(firebase.auth().currentUser.uid);
            } else {
                loadPublicWorkouts();
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
                <p>${type === 'my' ? 'No workouts created yet.' : 'No public workouts available.'}</p>
                ${type === 'my' ? '<a href="create-workout.html" class="button gradient-button">Create Your First Workout</a>' : ''}
            </div>
        `;
        return;
    }

    workouts.forEach(workout => {
        workoutsList.appendChild(createWorkoutCard(workout, type));
    });
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
                <button onclick="saveWorkout('${workout.id}')" class="button secondary">Save</button>
            `}
        </div>
    `;
    return div;
}

// Save workout to user's collection
async function saveWorkout(workoutId) {
    try {
        const userId = firebase.auth().currentUser?.uid;
        if (!userId) {
            showError('Please sign in to save workouts');
            return;
        }

        await firebase.firestore()
            .collection('saved_workouts')
            .add({
                userId: userId,
                workoutId: workoutId,
                savedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

        alert('Workout saved successfully!');
    } catch (error) {
        console.error('Error saving workout:', error);
        showError('Error saving workout: ' + error.message);
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
        if (currentTab === 'my') {
            loadWorkouts(user.uid);
        } else {
            loadPublicWorkouts();
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
