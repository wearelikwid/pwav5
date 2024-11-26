document.addEventListener('DOMContentLoaded', () => {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            const urlParams = new URLSearchParams(window.location.search);
            const programId = urlParams.get('id');
            
            if (programId) {
                loadProgramDetails(programId);
                setupEventListeners(programId);
            } else {
                window.location.href = 'program.html';
            }
        } else {
            window.location.href = 'auth.html';
        }
    });
});

function setupEventListeners(programId) {
    const editButton = document.getElementById('editProgram');
    if (editButton) {
        editButton.addEventListener('click', () => {
            window.location.href = `edit-program.html?id=${programId}`;
        });
    }
}

async function loadProgramDetails(programId) {
    try {
        const programDoc = await firebase.firestore()
            .collection('programs')
            .doc(programId)
            .get();

        if (programDoc.exists) {
            const programData = { ...programDoc.data(), id: programId };
            displayProgramDetails(programData);
        } else {
            alert('Program not found');
            window.location.href = 'program.html';
        }
    } catch (error) {
        console.error('Error loading program details:', error);
        alert('Error loading program details. Please try again.');
    }
}

function displayProgramDetails(program) {
    document.getElementById('programName').textContent = program.name;
    document.getElementById('programDuration').textContent = `${program.duration} weeks`;

    const programWeeksDiv = document.getElementById('programWeeks');
    let weeksHTML = '';

    if (program.weeks && program.weeks.length > 0) {
        program.weeks.forEach((week, weekIndex) => {
            weeksHTML += `
                <div class="week-card">
                    <h3 class="week-header">Week ${weekIndex + 1}</h3>
                    <div class="week-days">
                        ${renderDays(week.days)}
                    </div>
                </div>
            `;
        });
    } else {
        weeksHTML = '<p class="no-content">No workout weeks available</p>';
    }

    programWeeksDiv.innerHTML = weeksHTML;
}

function renderDays(days) {
    return days.map((day, dayIndex) => `
        <div class="day-item">
            <div class="day-header">
                <h4>Day ${dayIndex + 1}</h4>
                ${day.workout ? `<span class="workout-name">${day.workout.name}</span>` : '<span class="rest-day">Rest Day</span>'}
            </div>
            ${renderSections(day.workout?.sections || [])}
        </div>
    `).join('');
}

function renderSections(sections) {
    if (!sections.length) return '';
    
    return `
        <div class="sections-container">
            ${sections.map(section => `
                <div class="section-item">
                    <h5 class="section-name">${section.name}</h5>
                    ${renderExercises(section.exercises)}
                </div>
            `).join('')}
        </div>
    `;
}

function renderExercises(exercises) {
    if (!exercises || !exercises.length) return '';

    return `
        <div class="exercises-list">
            ${exercises.map(exercise => `
                <div class="exercise-item">
                    <div class="exercise-details">
                        <span class="exercise-name">${exercise.name}</span>
                        <span class="exercise-specs">
                            ${exercise.sets}×${exercise.reps}
                            ${exercise.notes ? `<span class="exercise-notes">${exercise.notes}</span>` : ''}
                        </span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

async function startProgram(programId) {
    try {
        const user = firebase.auth().currentUser;
        if (!user) {
            alert('Please sign in to start the program');
            return;
        }

        // Add program start logic here
        alert('Program started! Implementation pending.');
    } catch (error) {
        console.error('Error starting program:', error);
        alert('Error starting program. Please try again.');
    }
}
