function initializeFormEvents(programId) {
    const form = document.getElementById('edit-program-form');
    const durationInput = document.getElementById('program-duration');

    durationInput.addEventListener('change', function() {
        updateWeeks(parseInt(this.value), []);
    });

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

function createDaysHTML(weekNumber, days = []) {
    return days.map((day, index) => 
        createDayElement(weekNumber, index + 1, day)
    ).join('');
}

function createDayElement(weekNumber, dayNumber, existingDay = null) {
    return `
        <div class="program-day" data-week="${weekNumber}" data-day="${dayNumber}">
            <div class="day-header">
                <h4>Day ${dayNumber}</h4>
                <button type="button" class="button secondary remove-day" onclick="removeDay(this)">
                    Remove Day
                </button>
            </div>
            <div class="day-details">
                <input type="text" 
                       placeholder="Workout Name" 
                       value="${existingDay?.workoutName || ''}"
                       required>
                <div class="workout-sections">
                    ${createSectionsHTML(existingDay?.sections || [])}
                </div>
                <button type="button" class="button secondary add-section" onclick="addSection(this)">
                    Add Section
                </button>
            </div>
        </div>
    `;
}

function createSectionsHTML(sections = []) {
    return sections.map((section, index) => 
        createSectionElement(section, index)
    ).join('') || createSectionElement(null, 0); // Create at least one section by default
}

function createSectionElement(existingSection = null, sectionIndex) {
    return `
        <div class="workout-section">
            <div class="section-header">
                <input type="text" 
                       class="section-name" 
                       placeholder="Section Name (e.g., Warmup, Circuit)"
                       value="${existingSection?.name || ''}"
                       required>
                <button type="button" class="button secondary remove-section" onclick="removeSection(this)">
                    Remove Section
                </button>
            </div>
            <div class="section-exercises">
                ${createExercisesHTML(existingSection?.exercises || [])}
            </div>
            <button type="button" class="button secondary add-exercise" onclick="addExercise(this)">
                Add Exercise
            </button>
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
    const weekElement = document.querySelector(`[data-week="${weekNumber}"] .week-days`);
    const dayNumber = weekElement.children.length + 1;
    const dayElement = createDayElement(weekNumber, dayNumber);
    weekElement.insertAdjacentHTML('beforeend', dayElement);
}

function removeDay(button) {
    button.closest('.program-day').remove();
}

function addSection(button) {
    const sectionsContainer = button.previousElementSibling;
    const sectionElement = createSectionElement(null, sectionsContainer.children.length);
    sectionsContainer.insertAdjacentHTML('beforeend', sectionElement);
}

function removeSection(button) {
    const sectionsContainer = button.closest('.workout-sections');
    button.closest('.workout-section').remove();
    
    // Ensure at least one section remains
    if (sectionsContainer.children.length === 0) {
        sectionsContainer.insertAdjacentHTML('beforeend', createSectionElement(null, 0));
    }
}

function addExercise(button) {
    const exercisesContainer = button.previousElementSibling;
    const exerciseNumber = exercisesContainer.children.length + 1;
    const exerciseElement = createExerciseElement(exerciseNumber);
    exercisesContainer.insertAdjacentHTML('beforeend', exerciseElement);
}

function removeExercise(button) {
    button.closest('.exercise-item').remove();
}

function saveProgram(programId) {
    // Implementation for saving the program
    // This would need to be modified to include the new section structure
    // when saving to Firebase
}
