// Initialize Firebase Auth listener
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    firebase.auth().onAuthStateChanged(function(user) {
        if (!user) {
            window.location.href = 'auth.html';
            return;
        }
        initializeForm();
    });
});

function initializeForm() {
    const form = document.getElementById('create-program-form');
    const durationInput = document.getElementById('program-duration');

    // Initialize with 1 week if no duration is set
    if (durationInput.value) {
        updateWeeks(parseInt(durationInput.value));
    }

    // Handle duration changes
    durationInput.addEventListener('input', function() {
        const duration = parseInt(this.value) || 0;
        if (duration > 0) {
            updateWeeks(duration);
        } else {
            document.getElementById('program-weeks').innerHTML = '';
        }
    });

    // Handle form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        await saveProgram();
    });
}

function updateWeeks(numWeeks) {
    const programWeeks = document.getElementById('program-weeks');
    programWeeks.innerHTML = ''; // Clear existing weeks

    for (let i = 0; i < numWeeks; i++) {
        const weekNumber = i + 1;
        const weekElement = createWeekElement(weekNumber);
        programWeeks.appendChild(weekElement);
    }
}

function createWeekElement(weekNumber) {
    const weekDiv = document.createElement('div');
    weekDiv.className = 'program-week';
    weekDiv.innerHTML = `
        <div class="week-header">
            <h3>Week ${weekNumber}</h3>
        </div>
        <div class="week-days" data-week="${weekNumber}">
        </div>
        <button type="button" class="button secondary add-day" onclick="addDay(${weekNumber})">
            Add Day
        </button>
    `;
    return weekDiv;
}

function addDay(weekNumber) {
    const weekDaysContainer = document.querySelector(`.week-days[data-week="${weekNumber}"]`);
    const dayNumber = weekDaysContainer.children.length + 1;
    const dayElement = createDayElement(weekNumber, dayNumber);
    weekDaysContainer.insertAdjacentHTML('beforeend', dayElement);
}

function createDayElement(weekNumber, dayNumber) {
    return `
        <div class="program-day" data-week="${weekNumber}" data-day="${dayNumber}">
            <div class="day-header">
                <h4>Day ${dayNumber}</h4>
                <button type="button" class="button secondary remove-day" onclick="removeDay(this)">
                    Remove Day
                </button>
            </div>
            <div class="day-content">
                <input type="text" 
                       name="workout_name_${weekNumber}_${dayNumber}"
                       class="workout-name" 
                       placeholder="Workout name"
                       required>
                <div class="exercise-list">
                </div>
                <button type="button" class="button secondary add-exercise" onclick="addExercise(this)">
                    Add Exercise
                </button>
            </div>
        </div>
    `;
}

function removeDay(button) {
    const dayElement = button.closest('.program-day');
    dayElement.remove();
}

function addExercise(button) {
    const exerciseList = button.previousElementSibling;
    const exerciseNumber = exerciseList.children.length + 1;
    const exerciseElement = createExerciseElement(exerciseNumber);
    exerciseList.appendChild(exerciseElement);
}

function createExerciseElement(exerciseNumber) {
    const exerciseDiv = document.createElement('div');
    exerciseDiv.className = 'exercise-item';
    exerciseDiv.innerHTML = `
        <div class="exercise-header">
            <h5>Exercise ${exerciseNumber}</h5>
            <button type="button" class="button secondary remove-exercise" onclick="removeExercise(this)">
                Remove Exercise
            </button>
        </div>
        <div class="exercise-details">
            <input type="text" placeholder="Exercise name" class="exercise-name" required>
            <input type="number" placeholder="Sets" class="exercise-sets" required min="1">
            <input type="number" placeholder="Reps" class="exercise-reps" required min="1">
            <textarea class="exercise-notes" placeholder="Notes"></textarea>
        </div>
    `;
    return exerciseDiv;
}

function removeExercise(button) {
    const exerciseElement = button.closest('.exercise-item');
    exerciseElement.remove();
}

async function saveProgram() {
    try {
        const programName = document.getElementById('program-name').value;
        const duration = parseInt(document.getElementById('program-duration').value);
        
        if (!programName || !duration) {
            alert('Please fill in all required fields');
            return;
        }

        const program = {
            name: programName,
            duration: duration,
            weeks: collectProgramData(),
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            userId: firebase.auth().currentUser.uid
        };

        await firebase.firestore().collection('programs').add(program);
        alert('Program saved successfully!');
        window.location.href = 'program.html';
    } catch (error) {
        console.error('Error saving program:', error);
        alert('Error saving program. Please try again.');
    }
}

function collectProgramData() {
    const weeks = [];
    const weekElements = document.querySelectorAll('.program-week');
    
    weekElements.forEach((weekElement, weekIndex) => {
        const weekNumber = weekIndex + 1;
        const days = [];
        
        const dayElements = weekElement.querySelectorAll('.program-day');
        dayElements.forEach((dayElement, dayIndex) => {
            const dayNumber = dayIndex + 1;
            const exercises = [];
            
            const exerciseElements = dayElement.querySelectorAll('.exercise-item');
            exerciseElements.forEach((exerciseElement) => {
                exercises.push({
                    name: exerciseElement.querySelector('.exercise-name').value,
                    sets: parseInt(exerciseElement.querySelector('.exercise-sets').value),
                    reps: parseInt(exerciseElement.querySelector('.exercise-reps').value),
                    notes: exerciseElement.querySelector('.exercise-notes').value
                });
            });
            
            days.push({
                dayNumber: dayNumber,
                workoutName: dayElement.querySelector('.workout-name').value,
                exercises: exercises
            });
        });
        
        weeks.push({
            weekNumber: weekNumber,
            days: days
        });
    });
    
    return weeks;
}
