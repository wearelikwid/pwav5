// Initialize Firebase Auth listener
document.addEventListener('DOMContentLoaded', function() {
    firebase.auth().onAuthStateChanged((user) => {
        if (!user) {
            window.location.href = 'auth.html';
            return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const workoutId = urlParams.get('id');

        if (workoutId) {
            loadWorkoutData(workoutId);
        } else {
            showError('No workout specified');
            window.location.href = 'workouts.html';
        }
    });
});

function showError(message) {
    console.error(message);
    alert(message);
}

async function loadWorkoutData(workoutId) {
    try {
        const doc = await firebase.firestore()
            .collection('workouts')
            .doc(workoutId)
            .get();

        if (!doc.exists) {
            showError('Workout not found');
            window.location.href = 'workouts.html';
            return;
        }

        const workout = doc.data();
        
        // Verify user has permission to view this workout
        if (workout.userId !== firebase.auth().currentUser?.uid) {
            showError('You do not have permission to view this workout');
            window.location.href = 'workouts.html';
            return;
        }

        displayWorkout(workout);
        initializeCompleteButton(workoutId, workout.completed);
    } catch (error) {
        console.error('Error loading workout:', error);
        showError('Error loading workout data: ' + error.message);
    }
}

function displayWorkout(workout) {
    // Update header information
    document.getElementById('workout-name').textContent = workout.name || 'Unnamed Workout';
    document.getElementById('workout-type').textContent = workout.type || 'No Type';

    // Get the sections container and clear it
    const sectionsContainer = document.getElementById('workout-sections');
    sectionsContainer.innerHTML = '';

    // Display each section
    if (workout.sections && workout.sections.length > 0) {
        workout.sections.forEach((section, index) => {
            const sectionElement = createSectionElement(section, index + 1);
            sectionsContainer.appendChild(sectionElement);
        });
    } else {
        sectionsContainer.innerHTML = '<p class="no-sections">No sections found in this workout.</p>';
    }
}

function createSectionElement(section, sectionNumber) {
    const sectionTemplate = document.getElementById('section-template');
    const sectionElement = sectionTemplate.content.cloneNode(true);
    
    // Set section title
    sectionElement.querySelector('.section-title').textContent = 
        `Section ${sectionNumber}: ${section.type.charAt(0).toUpperCase() + section.type.slice(1)}`;

    const exercisesList = sectionElement.querySelector('.exercises-list');
    
    // Add exercises to section
    if (section.exercises && section.exercises.length > 0) {
        section.exercises.forEach(exercise => {
            const exerciseElement = createExerciseElement(exercise);
            exercisesList.appendChild(exerciseElement);
        });
    } else {
        exercisesList.innerHTML = '<p class="no-exercises">No exercises in this section.</p>';
    }

    return sectionElement;
}

function createExerciseElement(exercise) {
    const exerciseTemplate = document.getElementById('exercise-template');
    const exerciseElement = exerciseTemplate.content.cloneNode(true);
    
    // Set exercise name
    exerciseElement.querySelector('.exercise-name').textContent = exercise.name || 'Unnamed Exercise';
    
    // Set exercise notes if they exist
    const notesElement = exerciseElement.querySelector('.exercise-notes');
    if (exercise.notes) {
        notesElement.textContent = exercise.notes;
        notesElement.style.display = 'block';
    } else {
        notesElement.style.display = 'none';
    }

    // Set tutorial link if it exists
    const tutorialElement = exerciseElement.querySelector('.tutorial-link');
    if (exercise.tutorial) {
        tutorialElement.href = exercise.tutorial;
        tutorialElement.style.display = 'block';
    } else {
        tutorialElement.style.display = 'none';
    }
    
    // Set reps and rounds
    const repsElement = exerciseElement.querySelector('.reps');
    const roundsElement = exerciseElement.querySelector('.rounds');
    
    repsElement.textContent = exercise.reps ? `${exercise.reps} reps` : 'No reps specified';
    roundsElement.textContent = exercise.rounds ? `${exercise.rounds} rounds` : 'No rounds specified';

    return exerciseElement;
}

function initializeCompleteButton(workoutId, isCompleted) {
    const completeButton = document.getElementById('complete-workout');
    
    if (isCompleted) {
        completeButton.textContent = 'Workout Completed';
        completeButton.classList.add('completed');
        completeButton.disabled = true;
    } else {
        completeButton.addEventListener('click', async () => {
            try {
                await firebase.firestore()
                    .collection('workouts')
                    .doc(workoutId)
                    .update({
                        completed: true,
                        completedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });

                completeButton.textContent = 'Workout Completed!';
                completeButton.classList.add('completed');
                completeButton.classList.add('success-animation');
                completeButton.disabled = true;

                setTimeout(() => {
                    window.location.href = 'workouts.html';
                }, 1500);
            } catch (error) {
                console.error('Error completing workout:', error);
                showError('Error marking workout as complete: ' + error.message);
            }
        });
    }
}
