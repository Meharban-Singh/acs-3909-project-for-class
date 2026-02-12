const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;
const API_KEY = 'peas-and-carrots';

// In-memory data storage
const users = {};
// Structure: { username: { notes: [{ id, content, createdAt }] } }

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const validateUsername = (req, res, next) => {
  const username = req.body.username || req.params.username || req.query.username;
  
  if (!username || username.trim() === '') {
    return res.status(400).json({ error: 'Username is required' });
  }
  
  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({ error: 'Username must be between 3 and 20 characters' });
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
  }
  
  req.validatedUsername = username.trim();
  next();
};

const validateNoteContent = (req, res, next) => {
  const { content } = req.body;
  
  if (content === undefined || content === null) {
    return res.status(400).json({ error: 'Note content is required' });
  }
  
  if (typeof content !== 'string') {
    return res.status(400).json({ error: 'Note content must be a string' });
  }
  
  if (content.trim().length === 0) {
    return res.status(400).json({ error: 'Note content cannot be empty' });
  }
  
  if (content.length > 5000) {
    return res.status(400).json({ error: 'Note content cannot exceed 5000 characters' });
  }
  
  next();
};

const validateNoteId = (req, res, next) => {
  const noteId = req.params.noteId || req.body.noteId;
  
  if (!noteId) {
    return res.status(400).json({ error: 'Note ID is required' });
  }
  
  if (isNaN(noteId)) {
    return res.status(400).json({ error: 'Note ID must be a number' });
  }
  
  req.validatedNoteId = parseInt(noteId);
  next();
};

// Applies to all /api routes and checks for x-api-key header
app.use('/api', (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Invalid API key. Include x-api-key header.' });
  }

  next();
});

// Routes

app.post('/api/login', validateUsername, (req, res) => {
  const username = req.validatedUsername;
  
  // Create user if doesn't exist
  if (!users[username]) {
    users[username] = { notes: [] };
    console.log(`New user created: ${username}`);
  }
  
  res.json({ 
    success: true, 
    username,
    message: users[username].notes.length === 0 ? 'New user created' : 'Welcome back'
  });
});

app.get('/api/users/:username/notes', validateUsername, (req, res) => {
  const username = req.validatedUsername;
  
  if (!users[username]) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json({ 
    username,
    notes: users[username].notes 
  });
});

app.post('/api/users/:username/notes', validateUsername, validateNoteContent, (req, res) => {
  const username = req.validatedUsername;
  const { content } = req.body;
  
  if (!users[username]) {
    return res.status(404).json({ error: 'User not found. Please login first.' });
  }
  
  const newNote = {
    id: Date.now(),
    content: content.trim(),
    createdAt: new Date().toISOString()
  };
  
  users[username].notes.push(newNote);
  
  res.status(201).json({ 
    success: true,
    note: newNote 
  });
});

app.put('/api/users/:username/notes/:noteId', validateUsername, validateNoteId, validateNoteContent, (req, res) => {
  const username = req.validatedUsername;
  const noteId = req.validatedNoteId;
  const { content } = req.body;
  
  if (!users[username]) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const noteIndex = users[username].notes.findIndex(note => note.id === noteId);
  
  if (noteIndex === -1) {
    return res.status(404).json({ error: 'Note not found' });
  }
  
  users[username].notes[noteIndex].content = content.trim();
  users[username].notes[noteIndex].updatedAt = new Date().toISOString();
  
  res.json({ 
    success: true,
    note: users[username].notes[noteIndex]
  });
});

app.delete('/api/users/:username/notes/:noteId', validateUsername, validateNoteId, (req, res) => {
  const username = req.validatedUsername;
  const noteId = req.validatedNoteId;
  const confirm = req.query.confirm; 
  
  if (confirm !== 'true') {
    return res.status(400).json({ error: 'Confirmation required. Add ?confirm=true to the request.' });
  }
  
  if (!users[username]) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const noteIndex = users[username].notes.findIndex(note => note.id === noteId);
  
  if (noteIndex === -1) {
    return res.status(404).json({ error: 'Note not found' });
  }
  
  const deletedNote = users[username].notes.splice(noteIndex, 1)[0];
  
  res.json({ 
    success: true,
    message: 'Note deleted successfully',
    deletedNote
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
