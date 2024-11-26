// Initialize Firebase Authentication and Firestore listeners
document.addEventListener('DOMContentLoaded', function() {
    firebase.auth().onAuthStateChanged(function(user) {
        if (!user) {
            window.location.href = 'auth.html';
            return;
        }
        // Get program ID from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const programId = urlParams.get('id');
        if (programId) {
            loadProgramDetails(programId);
        }
    });
});

// Load program details from Firestore
async function loadProgramDetails(programId) {
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
            displayProgramDetails(programData);
            setupEditButton(programId);
        } else {
            showError('Program not found');
        }
    } catch (error) {
        console.error('Error loading program:', error);
        showError('Failed to load program details');
    }
}

// Display program details in the UI
function displayProgramDetails(program) {
    // Set program name and duration
    document.getElementById('programName').textContent = program.name;
    document.getElementById('programDuration').textContent = `${program.duration} weeks`;

    // Get weeks container and week template
    const weeksContainer = document.getElementById('programWeeks');
    const weekTemplate = document.getElementById('week-template');
    const dayTemplate = document.getElementById('day-template');

    weeksContainer.innerHTML = ''; // Clear existing content

    // Create week elements
    program.weeks.forEach((week, weekIndex) => {
        const weekElement = weekTemplate.content.cloneNode(true);
        
        // Set week title
        weekElement.querySelector('.week-title').textContent = `Week ${weekIndex + 1}`;
        
        const daysContainer = weekElement.querySelector('.days-container');

        // Create day elements
        week.days.forEach((day, dayIndex) => {
            const dayElement = dayTemplate.content.cloneNode(true);
            
            // Set day title
            dayElement.querySelector('.day-title').textContent = `Day ${dayIndex + 1}`;
            
            // Add exercises
            const exercisesList = dayElement.querySelector('.exercises-list');
            day.exercises.forEach(exercise => {
                const exerciseItem = document.createElement('div');
                exerciseItem.className = 'exercise-item';
                exerciseItem.innerHTML = `
                    <span class="exercise-name">${exercise.name}</span>
                    <span class="exercise-details">${exercise.sets}×${exercise.reps}</span>
                `;
                exercisesList.appendChild(exerciseItem);
            });

            daysContainer.appendChild(dayElement);
        });

        weeksContainer.appendChild(weekElement);
    });
}

// Setup edit button functionality
function setupEditButton(programId) {
    const editButton = document.getElementById('editProgramBtn');
    editButton.addEventListener('click', () => {
        window.location.href = `edit-program.html?id=${programId}`;
    });
}

// Error handling function
function showError(message) {
    const container = document.querySelector('.program-content');
    container.innerHTML = `
        <div class="error-message">
            <p>${message}</p>
            <button onclick="window.location.href='programs.html'" class="button">
                Return to Programs
            </button>
        </div>
    `;
}

// Modal handling for delete confirmation
const modal = document.getElementById('deleteModal');
const confirmDeleteBtn = document.getElementById('confirmDelete');
const cancelDeleteBtn = document.getElementById('cancelDelete');

function showDeleteModal() {
    modal.style.display = 'flex';
}

function hideDeleteModal() {
    modal.style.display = 'none';
}

async function deleteProgram(programId) {
    try {
        const user = firebase.auth().currentUser;
        await firebase.firestore()
            .collection('users')
            .doc(user.uid)
            .collection('programs')
            .doc(programId)
            .delete();
        
        window.location.href = 'programs.html';
    } catch (error) {
        console.error('Error deleting program:', error);
        showError('Failed to delete program');
    }
}

// Setup modal event listeners
cancelDeleteBtn.addEventListener('click', hideDeleteModal);
window.onclick = function(event) {
    if (event.target === modal) {
        hideDeleteModal();
    }
};
