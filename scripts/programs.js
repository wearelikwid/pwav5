// Check authentication state
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        loadPrograms();
    } else {
        window.location.href = 'auth.html';
    }
});

// Load all programs for the current user
async function loadPrograms() {
    try {
        const user = firebase.auth().currentUser;
        const programsGrid = document.getElementById('programs-grid');
        const template = document.getElementById('program-card-template');

        // Clear existing programs
        programsGrid.innerHTML = '';

        // Get programs from Firestore
        const snapshot = await firebase.firestore()
            .collection('programs')
            .where('userId', '==', user.uid)
            .orderBy('createdAt', 'desc')
            .get();

        if (snapshot.empty) {
            programsGrid.innerHTML = '<p class="no-programs">No programs found. Create your first program!</p>';
            return;
        }

        // Create program cards
        snapshot.forEach(doc => {
            const program = doc.data();
            const card = template.content.cloneNode(true);

            // Set program details
            card.querySelector('.program-name').textContent = program.name;
            card.querySelector('.program-duration').textContent = `${program.duration} weeks`;

            // Set action button data attributes
            card.querySelector('.view-btn').dataset.id = doc.id;
            card.querySelector('.edit-btn').dataset.id = doc.id;
            card.querySelector('.delete-btn').dataset.id = doc.id;

            programsGrid.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading programs:', error);
        alert('Error loading programs. Please try again.');
    }
}

// View program details
function viewProgramDetails(programId) {
    window.location.href = `program-details.html?id=${programId}`;
}

// Edit program
function editProgram(programId) {
    window.location.href = `edit-program.html?id=${programId}`;
}

// Delete program
let programToDelete = null;
const deleteModal = document.getElementById('deleteModal');
const confirmDeleteBtn = document.getElementById('confirmDelete');
const cancelDeleteBtn = document.getElementById('cancelDelete');

function deleteProgram(programId) {
    programToDelete = programId;
    deleteModal.style.display = 'flex';
}

// Cancel delete
cancelDeleteBtn.addEventListener('click', () => {
    deleteModal.style.display = 'none';
    programToDelete = null;
});

// Confirm delete
confirmDeleteBtn.addEventListener('click', async () => {
    if (!programToDelete) return;

    try {
        await firebase.firestore()
            .collection('programs')
            .doc(programToDelete)
            .delete();

        deleteModal.style.display = 'none';
        programToDelete = null;
        loadPrograms(); // Reload programs list
    } catch (error) {
        console.error('Error deleting program:', error);
        alert('Error deleting program. Please try again.');
    }
});

// Close modal when clicking outside
deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) {
        deleteModal.style.display = 'none';
        programToDelete = null;
    }
});

// Handle escape key press
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && deleteModal.style.display === 'flex') {
        deleteModal.style.display = 'none';
        programToDelete = null;
    }
});
