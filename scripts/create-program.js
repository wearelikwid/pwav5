// Global variables to track program structure
let currentWeeks = 0;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('create-program-form');
    const durationInput = document.getElementById('program-duration');
    
    durationInput.addEventListener('change', handleDurationChange);
    form.addEventListener('submit', handleFormSubmit);
});

// Handle program duration changes
function handleDurationChange(event) {
    const weeks = parseInt(event.target.value) || 0;
    const weeksContainer = document.getElementById('program-weeks');
    
    // Clear existing weeks
    weeksContainer.innerHTML = '';
    currentWeeks = 0;

    // Add new weeks
    for (let i = 0; i < weeks; i++) {
        addWeek();
    }
}

// Add a new week to the program
function addWeek() {
    currentWeeks++;
    const weeksContainer = document.getElementById('program-weeks');
    
    const weekDiv = document.createElement('div');
    weekDiv.className = 'week-container';
    weekDiv.innerHTML = `
        <div class="week-header">
            <h3 class="week-title">Week ${currentWeeks}</h3>
        </div>
        <div class="week-days">
            ${generateDaysHTML()}
        </div>
    `;
    
    weeksContainer.appendChild(weekDiv);
}

// Generate HTML for the days of the week
function generateDaysHTML() {
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return daysOfWeek.map((day, index) => `
        <div class="program-day">
            <div class="day-header">
                <h4 class="day-title">${day}</h4>
            </div>
            <div class="day-content">
                <select class="workout-select" name="week${currentWeeks}day${index + 1}">
                    <option value="">Rest Day</option>
                    <option value="workout">Add Workout</option>
                </select>
            </div>
        </div>
    `).join('');
}

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();
    
    // Check if user is authenticated
    const user = firebase.auth().currentUser;
    if (!user) {
        alert('Please sign in to create a program');
        window.location.href = 'auth.html';
        return;
    }

    try {
        const programData = collectProgramData();
        await saveProgramToFirebase(programData, user.uid);
        
        alert('Program created successfully!');
        window.location.href = 'programs.html';
    } catch (error) {
        console.error('Error creating program:', error);
        alert('Failed to create program. Please try again.');
    }
}

// Collect all program data from the form
function collectProgramData() {
    const programName = document.getElementById('program-name').value;
    const duration = parseInt(document.getElementById('program-duration').value);
    
    const weeks = [];
    const weekContainers = document.querySelectorAll('.week-container');
    
    weekContainers.forEach((weekContainer, weekIndex) => {
        const days = [];
        const daySelects = weekContainer.querySelectorAll('.workout-select');
        
        daySelects.forEach((select) => {
            days.push({
                workoutType: select.value,
                workout: select.value === 'workout' ? {
                    name: 'Default Workout',
                    sections: []
                } : null
            });
        });
        
        weeks.push({ days });
    });
    
    return {
        name: programName,
        duration: duration,
        weeks: weeks,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
}

// Save program data to Firebase
async function saveProgramToFirebase(programData, userId) {
    programData.userId = userId;
    
    await firebase.firestore()
        .collection('programs')
        .add(programData);
}

// Helper function to generate unique IDs
function generateUniqueId() {
    return Math.random().toString(36).substr(2, 9);
}
