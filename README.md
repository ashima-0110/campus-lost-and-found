# Campus Lost and Found

A simple, beginner-friendly web app where students can report lost or found items on campus. Reports are stored in **MongoDB**, so they stay saved after a refresh.

**Stack:** HTML + CSS + vanilla JavaScript (frontend) · Node.js + Express (backend) · MongoDB + Mongoose (database)

---

## Project structure

```
campus-lost-and-found/
├── index.html        # The single page: navbar, hero, form, item cards
├── style.css         # All styling (clean college theme, responsive)
├── script.js         # Frontend logic: fetch API, render cards, filters, delete
├── server.js         # Express server + REST API + MongoDB connection
├── models/
│   └── Item.js       # Mongoose schema for one item report
├── .env              # Your local settings (MONGO_URI, PORT) — never share this
├── .env.example      # Template showing which variables are needed
├── package.json      # Project info + dependencies + start commands
└── README.md         # This file
```

## How the pieces fit together

```
Browser (index.html + script.js)
        │  fetch()  — JSON over HTTP
        ▼
Express server (server.js)  —  /api/items routes
        │  Mongoose
        ▼
MongoDB  —  "items" collection (documents created from models/Item.js)
```

The browser never talks to MongoDB directly. It only talks to the Express API.

---

## Run it step by step

### 1. Install Node.js
Download the LTS version from https://nodejs.org and install it. Check it worked:

```
node -v
npm -v
```

### 2. Install project dependencies
Open a terminal **inside this folder** and run:

```
npm install
```

### 3. Set up MongoDB (pick ONE option)

**Option A — Local MongoDB (simplest for a college demo)**
1. Install MongoDB Community Server from https://www.mongodb.com/try/download/community
2. Start it (on Windows it usually runs as a service automatically).
3. Your `.env` already contains the local address — no change needed:
   `MONGO_URI=mongodb://127.0.0.1:27017/campusLostAndFound`

**Option B — MongoDB Atlas (free cloud database)**
1. Create a free cluster at https://www.mongodb.com/atlas
2. Database Access → add a user · Network Access → allow your IP
3. Connect → Drivers → copy the connection string into `.env`, replacing `<password>`.

### 4. Configure `.env`
Copy `.env.example` to `.env` if `.env` does not exist, and set:

```
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/campusLostAndFound
```

### 5. Start the server

```
npm start
```
(For development, `npm run dev` restarts automatically when you edit `server.js`.)

You should see:
```
MongoDB connected
Server running: http://localhost:3000
```

### 6. Open the app
Go to **http://localhost:3000** in your browser.

---

## API reference

| Method | Route | What it does |
|---|---|---|
| GET | `/api/items` | Get all items (newest first) |
| GET | `/api/items?status=Lost` | Get only Lost items (`Found` also works) |
| POST | `/api/items` | Create an item — JSON body: `name, description, location, date, status` |
| DELETE | `/api/items/:id` | Delete one item by its MongoDB `_id` |
| GET | `/api/health` | Check server + DB status: `{ ok: true, db: "connected" }` |

## Features checklist

- [x] Report a lost/found item (name, description, location, date, status)
- [x] Items shown as cards, loaded from MongoDB (no hardcoded sample data)
- [x] Filter: All / Lost / Found + live search
- [x] Delete an item record
- [x] Success + error messages, form validation (browser **and** server)
- [x] Loading / empty / error states, responsive mobile layout

## Troubleshooting

| Problem | Fix |
|---|---|
| `MongoDB connection failed` | MongoDB is not running, or `MONGO_URI` in `.env` is wrong. Atlas: check IP whitelist. |
| `EADDRINUSE: port 3000` | Another app uses port 3000 — change `PORT` in `.env` to 3001. |
| Page loads but "Could not load items" | Server is not running — start it with `npm start`. |
| `npm: command not found` | Node.js is not installed or terminal needs reopening after install. |

## Ideas to extend later (not included on purpose)
Login/accounts, photo uploads, "claim item" button, email alerts, categories.
