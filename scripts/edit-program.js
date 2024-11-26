function initializeFormEvents(programId) {
    const form = document.getElementById('edit-program-form');
    const durationInput = document.getElementById('program-duration');

    // Handle duration changes
    durationInput.addEventListener('change', function() {
        updateWeeks(parseInt(this.value), []);
    });

    // Handle form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        saveProgram(programId);
    });
}

function updateWeeks(numWeeks, existingWeeks = []) {
    const programWeeks = document.getElementById('program-weeks');
    programWeeks.innerHTML = '';

    for (let i = 0; i < numWeeks; i++) {
        const weekNumber = i + 1;
        const existingWeek = existingWeeks.find(w => w.weekNumber === weekNumber);
        const weekElement = createWeekElement(weekNumber, existingWeek);
        programWeeks.appendChild(weekElement);
    }
}

function createWeekElement(weekNumber, existingWeek = null) {
    const weekDiv = document.createElement('div');
    weekDiv.className = 'program-week';
    weekDiv.setAttribute('data-week', weekNumber);
    weekDiv.innerHTML = `
        <div class="week-header">
            <h3>Week ${weekNumber}</h3>
        </div>
        <div class="week-days">
            ${createDaysHTML(weekNumber, existingWeek?.days || [])}
        </div>
        <button type="button" class="button secondary add-day" onclick="addDay(${weekNumber})">
            Add Day
        </button>
    `;
    return weekDiv;
}

function createDaysHTML(weekNumber, existingDays = []) {
    let daysHTML = '';
    const numDays = existingDays.length || 1;

    for (let i = 0; i < numDays; i++) {
        const dayNumber = i + 1;
        const existingDay = existingDays[i] || {};
        daysHTML += createDayElement(weekNumber, dayNumber, existingDay);
    }

    return daysHTML;
}

function createDayElement(weekNumber, dayNumber, existingDay = {}) {
    return `
        <div class="program-day" data-week="${weekNumber}" data-day="${dayNumber}">
            <div class="day-header">
                <h4>Day ${dayNumber}</h4>
                <button type="button" class="button secondary remove-day" onclick="removeDay(this)">
                    Remove Day
                </button>
            </div>
            <div class="day-content">
                <div class="form-group">
                    <input type="text" 
                           class="workout-name" 
                           placeholder="Workout name"
                           value="${existingDay.workout?.name || ''}"
                           required>
                </div>
                <div class="exercise-list">
                    ${createExercisesHTML(existingDay.workout?.exercises || [])}
                </div>
                <button type="button" class="button secondary add-exercise" onclick="addExercise(this)">
                    Add Exercise
                </button>
            </div>
        </div>
    `;
}

function createExercisesHTML(exercises = []) {
    return exercises.map((exercise, index) => 
        createExerciseElement(index + 1, exercise)
    ).join('');
}

function createExerciseElement(number, existingExercise = {}) {
    return `
        <div class="exercise-item">
            <div class="exercise-header">
                <h5>Exercise ${number}</h5>
                <button type="button" class="button secondary remove-exercise" onclick="removeExercise(this)">
                    Remove
                </button>
            </div>
            <div class="exercise-details">
                <input type="text" 
                       placeholder="Exercise name" 
                       value="${existingExercise.name || ''}"
                       required>
                <input type="number" 
                       placeholder="Sets"
                       value="${existingExercise.sets || ''}"
                       required>
                <input type="number" 
                       placeholder="Reps"
                       value="${existingExercise.reps || ''}"
                       required>
                <textarea class="exercise-notes" 
                          placeholder="Notes (optional)">${existingExercise.notes || ''}</textarea>
            </div>
        </div>
    `;
}

function addDay(weekNumber) {
    const weekElement = document.querySelector(`[data-week="${weekNumber}"]`);
    const daysContainer = weekElement.querySelector('.week-days');
    const dayNumber = daysContainer.children.length + 1;
    
    const dayHTML = createDayElement(weekNumber, dayNumber);
    daysContainer.insertAdjacentHTML('beforeend', dayHTML);
}

function removeDay(button) {
    const dayElement = button.closest('.program-day');
    const daysContainer = dayElement.parentElement;
    
    if (daysContainer.children.length > 1) {
        dayElement.remove();
    } else {
        alert('Each week must have at least one day');
    }
}

function addExercise(button) {
    const exerciseList = button.previousElementSibling;
    const exerciseNumber = exerciseList.children.length + 1;
    
    const exerciseHTML = createExerciseElement(exerciseNumber);
    exerciseList.insertAdjacentHTML('beforeend', exerciseHTML);
}

function removeExercise(button) {
    const exerciseElement = button.closest('.exercise-item');
    exerciseElement.remove();
    
    // Renumber remaining exercises
    const exerciseList = exerciseElement.parentElement;
    const exercises = exerciseList.querySelectorAll('.exercise-item');
    exercises.forEach((exercise, index) => {
        exercise.querySelector('h5').textContent = `Exercise ${index + 1}`;
    });
}

async function saveProgram(programId) {
    try {
        const user = firebase.auth().currentUser;
        if (!user) {
            alert('Please sign in to save the program');
            return;
        }

        const programData = {
            name: document.getElementById('program-name').value,
            duration: parseInt(document.getElementById('program-duration').value),
            weeks: collectWeeksData(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            userId: user.uid
        };

        await firebase.firestore()
            .collection('programs')
            .doc(programId)
            .update(programData);

        alert('Program saved successfully!');
        window.location.href = 'program.html';
    } catch (error) {
        console.error('Error saving program:', error);
        alert('Error saving program. Please try again.');
    }
}

function collectWeeksData() {
    const weeks = [];
    const weekElements = document.querySelectorAll('.program-week');
    
    weekElements.forEach((weekElement, weekIndex) => {
        const days = [];
        const dayElements = weekElement.querySelectorAll('.program-day');
        
        dayElements.forEach((dayElement, dayIndex) => {
            const exercises = [];
            const exerciseElements = dayElement.querySelectorAll('.exercise-item');
            
            exerciseElements.forEach(exerciseElement => {
                const [nameInput, setsInput, repsInput, notesInput] = 
                    exerciseElement.querySelectorAll('input, textarea');
                
                exercises.push({
                    name: nameInput.value,
                    sets: parseInt(setsInput.value),
                    reps: parseInt(repsInput.value),
                    notes: notesInput.value
                });
            });
            
            days.push({
                workout: {
                    name: dayElement.querySelector('.workout-name').value,
                    exercises: exercises
                }
            });
        });
        
        weeks.push({
            weekNumber: weekIndex + 1,
            days: days
        });
    });
    
    return weeks;
}
