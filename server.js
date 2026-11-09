/*
  Campus Lost and Found — server.js
  ---------------------------------------------------------------
  The backend in one file, kept deliberately simple for beginners:

    1. Load settings from .env
    2. Create the Express app + JSON middleware
    3. Serve the frontend files (index.html / style.css / script.js)
    4. Define the REST API:
         GET    /api/health       -> server + DB status
         GET    /api/items        -> all items (?status=Lost|Found filters)
         POST   /api/items        -> create one item
         DELETE /api/items/:id    -> delete one item
    5. Connect to MongoDB with Mongoose, THEN start listening.
       (We listen only after the DB connects, so we never serve
        a page whose API is guaranteed to fail.)
*/

require('dotenv').config(); // reads .env into process.env
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const Item = require('./models/Item'); // Mongoose model (see that file)

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campusLostAndFound';

// ---------- Middleware ----------
app.use(express.json()); // parse JSON request bodies into req.body

// Security nicety: never let the browser download backend/source files
app.use((req, res, next) => {
  const blocked = ['/server.js', '/package.json', '/.env'];
  if (blocked.includes(req.path) || req.path.startsWith('/models/')) {
    return res.status(404).send('Not found');
  }
  next();
});

// Serve the static frontend from this same folder (same origin = no CORS needed)
app.use(express.static(__dirname));

// ---------- API Routes ----------

// Health check — handy in a demo to prove the DB is really connected
app.get('/api/health', (req, res) => {
  res.json({ ok: true, db: mongoose.connection.readyState === 1 ? 'connected' : 'not connected' });
});

// GET all items, newest first. Optional filter: /api/items?status=Lost
app.get('/api/items', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status === 'Lost' || req.query.status === 'Found') {
      filter.status = req.query.status;
    }
    const items = await Item.find(filter).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load items. Please try again.' });
  }
});

// POST a new item. We validate on the server too — the browser can be bypassed.
app.post('/api/items', async (req, res) => {
  try {
    const { name, description, location, date, status } = req.body || {};

    if (!name?.trim() || !description?.trim() || !location?.trim() || !date || !status) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    if (!['Lost', 'Found'].includes(status)) {
      return res.status(400).json({ message: 'Status must be Lost or Found.' });
    }
    if (isNaN(new Date(date))) {
      return res.status(400).json({ message: 'Please enter a valid date.' });
    }

    const item = await Item.create({ name, description, location, date, status });
    res.status(201).json(item); // 201 = created, return the saved document (with its _id)
  } catch (err) {
    console.error(err);
    const msg = err.name === 'ValidationError'
      ? Object.values(err.errors)[0].message
      : 'Could not save item.';
    res.status(400).json({ message: msg });
  }
});

// DELETE one item by its MongoDB _id
app.delete('/api/items/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid item id.' });
    }
    const deleted = await Item.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Item not found.' });
    res.json({ message: 'Item deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not delete item.' });
  }
});

// Home page (express.static would also serve it; this makes the route explicit)
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// ---------- Connect DB, then start ----------
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running: http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    console.error('Fix: check MONGO_URI in .env, make sure local MongoDB is running, or whitelist your IP in Atlas.');
    process.exit(1);
  });
