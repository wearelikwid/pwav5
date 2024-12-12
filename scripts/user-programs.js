// Check if user is authenticated
function checkAuth() {
    firebase.auth().onAuthStateChanged((user) => {
        if (!user) {
            window.location.href = 'auth.html';
        }
    });
}

// Start a program
async function startProgram(programId) {
    try {
        const user = firebase.auth().currentUser;
        if (!user) {
            alert('Please sign in first');
            window.location.href = 'auth.html';
            return;
        }

        // Check if user already has this program active
        const existingProgram = await firebase.firestore()
            .collection('userPrograms')
            .where('userId', '==', user.uid)
            .where('programId', '==', programId)
            .where('status', '==', 'active')
            .get();

        if (!existingProgram.empty) {
            alert('You already have this program active!');
            return;
        }

        // Create new userProgram document
        await firebase.firestore().collection('userPrograms').add({
            userId: user.uid,
            programId: programId,
            startDate: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'active',
            currentWeek: 1,
            currentDay: 1,
            progress: {
                completedWorkouts: 0,
                lastWorkoutDate: null
            }
        });

        alert('Program started successfully!');
        window.location.reload();
    } catch (error) {
        console.error('Error starting program:', error);
        alert('Failed to start program. Please try again.');
    }
}

// Get user's active programs
async function getUserActivePrograms() {
    try {
        const user = firebase.auth().currentUser;
        if (!user) return [];

        const snapshot = await firebase.firestore()
            .collection('userPrograms')
            .where('userId', '==', user.uid)
            .where('status', '==', 'active')
            .get();

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting active programs:', error);
        return [];
    }
}

// Update program progress
async function updateProgramProgress(userProgramId) {
    try {
        await firebase.firestore()
            .collection('userPrograms')
            .doc(userProgramId)
            .update({
                'progress.completedWorkouts': firebase.firestore.FieldValue.increment(1),
                'progress.lastWorkoutDate': firebase.firestore.FieldValue.serverTimestamp()
            });
    } catch (error) {
        console.error('Error updating progress:', error);
    }
}
