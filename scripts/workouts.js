// Global variables for modal handling
let currentWorkoutToDelete = null;
const modal = document.getElementById('deleteModal');
const confirmDeleteBtn = document.getElementById('confirmDelete');
const cancelDeleteBtn = document.getElementById('cancelDelete');

// Initialize event listeners when page loads
document.addEventListener('DOMContentLoaded', function() {
    firebase.auth().onAuthStateChanged(function(user) {
        if (!user) {
            window.location.href = 'auth.html';
            return;
        }
        initializeModalListeners();
        loadWorkouts(user.uid);
    });
});

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

// Load workouts from Firebase
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
                displayWorkouts(workouts);
            }, (error) => {
                console.error('Error loading workouts:', error);
                showError(error.message);
            });
    } catch (error) {
        console.error('Error setting up workout listener:', error);
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
                <p>No workouts created yet.</p>
                <a href="create-workout.html" class="button gradient-button">Create Your First Workout</a>
            </div>
        `;
        return;
    }

    workouts.forEach(workout => {
        workoutsList.appendChild(createWorkoutCard(workout));
    });
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
            <button onclick="editWorkout('${workout.id}')" class="button secondary">Edit</button>
            <button onclick="showDeleteConfirmation('${workout.id}')" class="button delete-btn">Delete</button>
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
