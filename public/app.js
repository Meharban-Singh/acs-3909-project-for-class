// Application State
let currentUsername = null;
let notes = [];

// API configuration
const API_KEY = 'peas-and-carrots';

// DOM Elements
const loginSection = document.getElementById('loginSection');
const notesSection = document.getElementById('notesSection');
const loginForm = document.getElementById('loginForm');
const noteForm = document.getElementById('noteForm');
const editForm = document.getElementById('editForm');
const notesList = document.getElementById('notesList');
const currentUserEl = document.getElementById('currentUser');
const logoutBtn = document.getElementById('logoutBtn');
const loginError = document.getElementById('loginError');
const noteError = document.getElementById('noteError');
const editModal = document.getElementById('editModal');
const cancelEditBtn = document.getElementById('cancelEdit');
const insertWeatherBtn = document.getElementById('insertWeatherBtn');

// Utility Functions
function showError(message, element = loginError) {
    element.textContent = message;
    element.classList.add('active');
    setTimeout(() => {
        element.classList.remove('active');
    }, 5000);
}

function showSection(section) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    section.classList.add('active');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Login Form Handler
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            body: JSON.stringify({ username })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }
        
        currentUsername = data.username;
        currentUserEl.textContent = currentUsername;
        
        // Load notes
        await loadNotes();
        
        // Switch to notes section
        showSection(notesSection);
        loginForm.reset();
        
    } catch (error) {
        showError(error.message);
    }
});

// Load Notes Function
async function loadNotes() {
    try {
        const response = await fetch(`/api/users/${currentUsername}/notes`, {
            headers: {
                'x-api-key': API_KEY
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load notes');
        }
        
        const data = await response.json();
        notes = data.notes;
        renderNotes();
        
    } catch (error) {
        console.error('Error loading notes:', error);
        showError('Failed to load notes');
    }
}

// Render Notes
function renderNotes() {
    if (notes.length === 0) {
        notesList.innerHTML = `
            <div class="card empty-state">
                <h3>No notes yet</h3>
                <p>Create your first note using the form above!</p>
            </div>
        `;
        return;
    }

    notesList.innerHTML = ""

    for(let note of notes) {
        notesList.innerHTML += `
            <div class="note-card" data-note-id="${note.id}">
                <div class="note-header">
                    <span class="note-date">${formatDate(note.createdAt)}</span>
                    <div class="note-actions">
                        <button class="btn btn-primary" onclick="editNote(${note.id})">Edit</button>
                        <button class="btn btn-secondary" onclick="deleteNote(${note.id})">Delete</button>
                    </div>
                </div>
                <div class="note-content">${note.content}</div>
            </div>
        `
    }    
}

// Create Note Form Handler
noteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const content = document.getElementById('noteContent').value.trim();
    
    if (!content) {
        showError('Note content cannot be empty');
        return;
    }
    
    try {
        const response = await fetch(`/api/users/${currentUsername}/notes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            body: JSON.stringify({ content })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to create note');
        }
        
        // Add note to local array
        notes.push(data.note);
        renderNotes();
        
        // Reset form
        noteForm.reset();
        
    } catch (error) {
        showError(error.message);
    }
});

// Edit Note Function
window.editNote = function(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    
    document.getElementById('editNoteId').value = noteId;
    document.getElementById('editNoteContent').value = note.content;
    
    editModal.classList.add('active');
};

// Cancel Edit
cancelEditBtn.addEventListener('click', () => {
    editModal.classList.remove('active');
    editForm.reset();
});

// Close modal when clicking outside
editModal.addEventListener('click', (e) => {
    if (e.target === editModal) {
        editModal.classList.remove('active');
        editForm.reset();
    }
});

// Edit Form Handler
editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const noteId = parseInt(document.getElementById('editNoteId').value);
    const content = document.getElementById('editNoteContent').value.trim();
    
    if (!content) {
        showError('Note content cannot be empty');
        return;
    }
    
    try {
        const response = await fetch(`/api/users/${currentUsername}/notes/${noteId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            body: JSON.stringify({ content })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to update note');
        }
        
        // Update local note
        const noteIndex = notes.findIndex(n => n.id === noteId);
        if (noteIndex !== -1) {
            notes[noteIndex] = data.note;
            renderNotes();
        }
        
        // Close modal
        editModal.classList.remove('active');
        editForm.reset();
        
    } catch (error) {
        showError(error.message);
    }
});

// Delete Note Function (uses query parameter)
window.deleteNote = async function(noteId) {
    if (!confirm('Are you sure you want to delete this note?')) {
        return;
    }
    
    try {
        // Using query parameter for confirmation
        const response = await fetch(`/api/users/${currentUsername}/notes/${noteId}?confirm=true`, {
            method: 'DELETE',
            headers: {
                'x-api-key': API_KEY
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to delete note');
        }
        
        // Remove note from local array
        notes = notes.filter(n => n.id !== noteId);
        renderNotes();
        
    } catch (error) {
        showError(error.message);
    }
};

// Logout Handler
logoutBtn.addEventListener('click', () => {
    currentUsername = null;
    notes = [];
    showSection(loginSection);
    notesList.innerHTML = '';
    noteForm.reset();
});

// Initialize app
showSection(loginSection);

// Insert current weather into note content using browser location and external API
insertWeatherBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by your browser.', noteError);
        return;
    }

    insertWeatherBtn.disabled = true;
    const originalText = insertWeatherBtn.textContent;
    insertWeatherBtn.textContent = 'Fetching weather...';

    navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;

        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error('Failed to fetch weather data');
            }

            const data = await response.json();
            const current = data.current_weather;

            if (!current) {
                throw new Error('Weather data unavailable for your location');
            }

            const noteContentEl = document.getElementById('noteContent');
            const timestamp = new Date(current.time || Date.now()).toLocaleString();
            const weatherLine = `Weather on ${timestamp}: ${current.temperature}°C, wind ${current.windspeed} km/h.`;

            if (noteContentEl.value && !noteContentEl.value.endsWith('\n')) {
                noteContentEl.value += '\n\n';
            } else if (noteContentEl.value) {
                noteContentEl.value += '\n';
            }

            noteContentEl.value += weatherLine + '\n';

        } catch (error) {
            console.error('Error fetching weather:', error);
            showError(error.message || 'Unable to fetch weather information.', noteError);
        } finally {
            insertWeatherBtn.disabled = false;
            insertWeatherBtn.textContent = originalText;
        }
    }, (err) => {
        let message = 'Unable to get your location.';
        if (err.code === err.PERMISSION_DENIED) {
            message = 'Location permission denied. Please allow access to use weather insertion.';
        }
        showError(message, noteError);
        insertWeatherBtn.disabled = false;
        insertWeatherBtn.textContent = originalText;
    });
});
