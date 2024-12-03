// Previous code remains the same...

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
                <button onclick="toggleSaveWorkout('${workout.id}', this)" class="button secondary save-button" data-workout-id="${workout.id}">
                    ${type === 'saved' ? 'Unsave' : 'Save'}
                </button>
            `}
        </div>
    `;
    return div;
}

// Toggle save/unsave workout with loading state
async function toggleSaveWorkout(workoutId, button) {
    try {
        const userId = firebase.auth().currentUser?.uid;
        if (!userId) {
            showError('Please sign in to save workouts');
            return;
        }

        // Disable button and show loading state
        button.disabled = true;
        const originalText = button.textContent;
        button.innerHTML = '<div class="button-spinner"></div>';
        button.classList.add('loading');

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
            button.textContent = 'Unsave';
        } else {
            // Unsave workout
            const docToDelete = query.docs[0];
            await docToDelete.ref.delete();
            button.textContent = 'Save';

            if (currentTab === 'saved') {
                loadSavedWorkouts(userId);
            }
        }

        // Show success state
        button.classList.add('success');
        setTimeout(() => {
            button.classList.remove('success');
        }, 1000);

    } catch (error) {
        console.error('Error toggling workout save:', error);
        showError('Error saving/unsaving workout: ' + error.message);
        button.textContent = originalText;
    } finally {
        // Re-enable button and remove loading state
        button.disabled = false;
        button.classList.remove('loading');
    }
}

// Rest of the code remains the same...
