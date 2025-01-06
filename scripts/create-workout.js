// Helper Functions
function addSection(sectionData = null) {
    const template = document.getElementById('section-template');
    const section = template.content.cloneNode(true);
    const sectionsContainer = document.getElementById('workout-sections');
    
    if (sectionData) {
        section.querySelector('.section-type').value = sectionData.type;
        sectionData.exercises.forEach(exercise => addExercise(section.querySelector('.exercises-list'), exercise));
    }

    sectionsContainer.appendChild(section);
    initializeSectionListeners(sectionsContainer.lastElementChild);
}

function addExercise(container, exerciseData = null) {
    const template = document.getElementById('exercise-template');
    const exercise = template.content.cloneNode(true);
    
    if (exerciseData) {
        exercise.querySelector('.exercise-name').value = exerciseData.name || '';
        exercise.querySelector('.exercise-rounds').value = exerciseData.rounds || '';
        exercise.querySelector('.exercise-reps').value = exerciseData.reps || '';
        exercise.querySelector('.exercise-notes').value = exerciseData.notes || '';
    }

    container.appendChild(exercise);
    initializeExerciseListeners(container.lastElementChild);
}

function initializeSectionListeners(section) {
    section.querySelector('.add-exercise').addEventListener('click', () => {
        addExercise(section.querySelector('.exercises-list'));
    });

    section.querySelector('.remove-section').addEventListener('click', () => {
        section.remove();
    });
}

function initializeExerciseListeners(exercise) {
    exercise.querySelector('.remove-exercise').addEventListener('click', () => {
        exercise.remove();
    });
}

function showLoadingIndicator() {
    const indicator = document.getElementById('loading-indicator');
    if (indicator) indicator.style.display = 'flex';
}

function hideLoadingIndicator() {
    const indicator = document.getElementById('loading-indicator');
    if (indicator) indicator.style.display = 'none';
}

function showError(message) {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }
    console.error(message);
}

// Make addSection globally available
window.addSection = addSection;

// Initialize Firebase Auth listener
document.addEventListener('DOMContentLoaded', function() {
    firebase.auth().onAuthStateChanged((user) => {
        if (!user) {
            window.location.href = 'auth.html';
            return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const workoutId = urlParams.get('id');
        const isEdit = urlParams.get('edit') === 'true';

        initializeForm();

        if (workoutId) {
            document.getElementById('page-title').textContent = 'Edit Workout';
            loadWorkoutData(workoutId);
        } else {
            addSection(); // Add one empty section for new workout
        }
    });
});

function initializeForm() {
    const form = document.getElementById('create-workout-form');
    form.addEventListener('submit', handleFormSubmit);
}

function validateWorkoutData(workoutData) {
    if (!workoutData.name || workoutData.name.trim() === '') {
        throw new Error('Workout name is required');
    }
    if (!workoutData.type || workoutData.type.trim() === '') {
        throw new Error('Workout type is required');
    }
    if (!workoutData.sections || workoutData.sections.length === 0) {
        throw new Error('At least one section is required');
    }
    
    workoutData.sections.forEach((section, sIndex) => {
        if (!section.exercises || section.exercises.length === 0) {
            throw new Error(`Section ${sIndex + 1} must have at least one exercise`);
        }
    });
}

async function handleFormSubmit(event) {
    event.preventDefault();
    
    try {
        const user = firebase.auth().currentUser;
        if (!user) {
            showError('Please sign in to save the workout');
            return;
        }

        showLoadingIndicator();
        
        const workoutData = {
            name: document.getElementById('workout-name').value.trim(),
            type: document.getElementById('workout-type').value.trim(),
            sections: getSectionsData(),
            userId: user.uid,
            completed: false,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            validateWorkoutData(workoutData);
        } catch (validationError) {
            showError(validationError.message);
            return;
        }

        const workoutId = document.getElementById('workout-id').value;

        if (workoutId) {
            await updateWorkout(workoutId, workoutData);
        } else {
            workoutData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await saveWorkout(workoutData);
        }

        window.location.href = 'workouts.html';
    } catch (error) {
        console.error('Error saving workout:', error);
        showError('Error saving workout: ' + error.message);
    } finally {
        hideLoadingIndicator();
    }
}

function getSectionsData() {
    const sections = document.querySelectorAll('.workout-section');
    return Array.from(sections).map((section, sectionIndex) => ({
        id: `section-${Date.now()}-${sectionIndex}`,
        type: section.querySelector('.section-type').value,
        exercises: Array.from(section.querySelectorAll('.exercise-item')).map((exercise, exerciseIndex) => ({
            id: `exercise-${Date.now()}-${sectionIndex}-${exerciseIndex}`,
            name: exercise.querySelector('.exercise-name').value.trim(),
            rounds: parseInt(exercise.querySelector('.exercise-rounds').value) || 0,
            reps: parseInt(exercise.querySelector('.exercise-reps').value) || 0,
            notes: exercise.querySelector('.exercise-notes')?.value?.trim() || '',
            tutorial: exercise.querySelector('.exercise-tutorial')?.value?.trim() || ''
        })).filter(exercise => exercise.name)
    }));
}

async function saveWorkout(workoutData) {
    try {
        await firebase.firestore()
            .collection('workouts')
            .add(workoutData);
    } catch (error) {
        console.error('Error saving workout:', error);
        throw error;
    }
}

async function updateWorkout(workoutId, workoutData) {
    try {
        await firebase.firestore()
            .collection('workouts')
            .doc(workoutId)
            .update(workoutData);
    } catch (error) {
        console.error('Error updating workout:', error);
        throw error;
    }
}

async function loadWorkoutData(workoutId) {
    try {
        showLoadingIndicator();
        const doc = await firebase.firestore()
            .collection('workouts')
            .doc(workoutId)
            .get();

        if (!doc.exists) {
            showError('Workout not found');
            return;
        }

        const workout = doc.data();
        
        if (workout.userId !== firebase.auth().currentUser?.uid) {
            showError('You do not have permission to edit this workout');
            window.location.href = 'workouts.html';
            return;
        }

        document.getElementById('workout-name').value = workout.name || '';
        document.getElementById('workout-type').value = workout.type || '';
        document.getElementById('workout-id').value = workoutId;

        const sectionsContainer = document.getElementById('workout-sections');
        sectionsContainer.innerHTML = '';

        if (workout.sections && workout.sections.length > 0) {
            workout.sections.forEach(section => {
                addSection(section);
            });
        } else {
            addSection();
        }
    } catch (error) {
        console.error('Error loading workout:', error);
        showError('Error loading workout data: ' + error.message);
    } finally {
        hideLoadingIndicator();
    }
}
