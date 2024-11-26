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

async function saveProgram() {
    try {
        const user = firebase.auth().currentUser;
        if (!user) throw new Error('User not authenticated');

        const programData = collectProgramData();
        
        // Save to Firestore
        await firebase.firestore().collection('programs').add({
            ...programData,
            userId: user.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert('Program created successfully!');
        window.location.href = 'program.html';
    } catch (error) {
        console.error('Error saving program:', error);
        alert('Failed to save program. Please try again.');
    }
}

function collectProgramData() {
    const programName = document.getElementById('program-name').value;
    const duration = parseInt(document.getElementById('program-duration').value);
    const weeks = [];

    // Collect data for each week
    document.querySelectorAll('.program-week').forEach(weekElement => {
        const weekNumber = parseInt(weekElement.getAttribute('data-week'));
        const days = [];

        // Collect data for each day
        weekElement.querySelectorAll('.program-day').forEach(dayElement => {
            const dayNumber = parseInt(dayElement.getAttribute('data-day'));
            const workoutName = dayElement.querySelector('input[type="text"]').value;
            const sections = [];

            // Collect data for each section
            dayElement.querySelectorAll('.workout-section').forEach(sectionElement => {
                const sectionName = sectionElement.querySelector('.section-name').value;
                const exercises = [];

                // Collect data for each exercise in the section
                sectionElement.querySelectorAll('.exercise-item').forEach(exerciseElement => {
                    const inputs = exerciseElement.querySelectorAll('input, textarea');
                    exercises.push({
                        name: inputs[0].value,
                        sets: parseInt(inputs[1].value),
                        reps: parseInt(inputs[2].value),
                        notes: inputs[3].value
                    });
                });

                sections.push({
                    name: sectionName,
                    exercises: exercises
                });
            });

            days.push({
                dayNumber: dayNumber,
                workoutName: workoutName,
                sections: sections
            });
        });

        weeks.push({
            weekNumber: weekNumber,
            days: days
        });
    });

    return {
        name: programName,
        duration: duration,
        weeks: weeks
    };
}

function updateWeeks(numWeeks) {
    const programWeeks = document.getElementById('program-weeks');
    programWeeks.innerHTML = '';

    for (let i = 0; i < numWeeks; i++) {
        const weekNumber = i + 1;
        const weekElement = createWeekElement(weekNumber);
        programWeeks.appendChild(weekElement);
    }
}

// Note: The createWeekElement, createDayElement, createSectionElement, 
// and other helper functions are the same as in edit-program.js
// They should be imported or shared between the files to maintain consistency
