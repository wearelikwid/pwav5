// Initialize Firebase Auth listener and form
document.addEventListener('DOMContentLoaded', function() {
    firebase.auth().onAuthStateChanged(function(user) {
        if (!user) {
            window.location.href = 'auth.html';
            return;
        }
        
        const urlParams = new URLSearchParams(window.location.search);
        const programId = urlParams.get('id');
        
        if (programId) {
            loadProgramData(programId);
            initializeFormEvents(programId);
        } else {
            window.location.href = 'programs.html';
        }
    });
});

async function loadProgramData(programId) {
    try {
        const user = firebase.auth().currentUser;
        const programDoc = await firebase.firestore()
            .collection('users')
            .doc(user.uid)
            .collection('programs')
            .doc(programId)
            .get();

        if (programDoc.exists) {
            const programData = programDoc.data();
            populateForm(programData);
        } else {
            alert('Program not found');
            window.location.href = 'programs.html';
        }
    } catch (error) {
        console.error('Error loading program:', error);
        alert('Failed to load program details');
    }
}

function populateForm(programData) {
    document.getElementById('program-name').value = programData.name;
    document.getElementById('program-duration').value = programData.duration;
    updateWeeks(programData.duration, programData.weeks || []);
}

async function saveProgram(programId) {
    try {
        const programData = collectFormData();
        const user = firebase.auth().currentUser;
        
        await firebase.firestore()
            .collection('users')
            .doc(user.uid)
            .collection('programs')
            .doc(programId)
            .update(programData);

        alert('Program updated successfully!');
        window.location.href = `program-details.html?id=${programId}`;
    } catch (error) {
        console.error('Error saving program:', error);
        alert('Failed to save program. Please try again.');
    }
}

function collectFormData() {
    const programWeeks = document.getElementById('program-weeks');
    const weeks = [];

    // Collect data for each week
    Array.from(programWeeks.children).forEach((weekElement, weekIndex) => {
        const weekData = {
            weekNumber: weekIndex + 1,
            days: collectWeekDays(weekElement)
        };
        weeks.push(weekData);
    });

    return {
        name: document.getElementById('program-name').value,
        duration: parseInt(document.getElementById('program-duration').value),
        weeks: weeks,
        lastModified: firebase.firestore.FieldValue.serverTimestamp()
    };
}

function collectWeekDays(weekElement) {
    const days = [];
    const daysElements = weekElement.querySelectorAll('.program-day');

    daysElements.forEach((dayElement, dayIndex) => {
        const exercises = collectDayExercises(dayElement);
        if (exercises.length > 0) {
            days.push({
                dayNumber: dayIndex + 1,
                exercises: exercises
            });
        }
    });

    return days;
}

function collectDayExercises(dayElement) {
    const exercises = [];
    const exerciseElements = dayElement.querySelectorAll('.exercise-item');

    exerciseElements.forEach(exerciseElement => {
        const exercise = {
            name: exerciseElement.querySelector('.exercise-name').value,
            sets: parseInt(exerciseElement.querySelector('.exercise-sets').value),
            reps: parseInt(exerciseElement.querySelector('.exercise-reps').value)
        };
        
        if (exercise.name && !isNaN(exercise.sets) && !isNaN(exercise.reps)) {
            exercises.push(exercise);
        }
    });

    return exercises;
}

function addDay(weekNumber) {
    const weekElement = document.querySelector(`[data-week="${weekNumber}"]`);
    const daysContainer = weekElement.querySelector('.week-days');
    const dayNumber = daysContainer.children.length + 1;
    
    const dayElement = document.createElement('div');
    dayElement.className = 'program-day';
    dayElement.innerHTML = `
        <div class="day-header">
            <h4>Day ${dayNumber}</h4>
            <button type="button" class="button small danger" onclick="removeDay(this)">
                Remove Day
            </button>
        </div>
        <div class="exercises">
            <button type="button" class="button small" onclick="addExercise(this)">
                Add Exercise
            </button>
        </div>
    `;
    
    daysContainer.appendChild(dayElement);
}

function removeDay(button) {
    const dayElement = button.closest('.program-day');
    dayElement.remove();
}

function addExercise(button) {
    const exercisesContainer = button.parentElement;
    const exerciseElement = document.createElement('div');
    exerciseElement.className = 'exercise-item';
    exerciseElement.innerHTML = `
        <input type="text" class="exercise-name" placeholder="Exercise name" required>
        <input type="number" class="exercise-sets" placeholder="Sets" min="1" required>
        <input type="number" class="exercise-reps" placeholder="Reps" min="1" required>
        <button type="button" class="button small danger" onclick="removeExercise(this)">
            Remove
        </button>
    `;
    
    exercisesContainer.insertBefore(exerciseElement, button);
}

function removeExercise(button) {
    const exerciseElement = button.closest('.exercise-item');
    exerciseElement.remove();
}
