/*
  Campus Lost and Found — script.js
  ---------------------------------------------------------------
  What this file does (in order):
    1. Keeps the app state (all items + active filter + search text)
    2. Loads items from the backend API  -> GET    /api/items
    3. Renders items as cards on the page
    4. Handles the report form           -> POST   /api/items
    5. Handles the Delete button         -> DELETE /api/items/:id
    6. Handles filter buttons + search box (client-side, instant)

  Note for beginners: the browser NEVER talks to MongoDB directly.
  It only talks to our Express API, and Express talks to MongoDB.
*/

// ---------------------------------------------------------------
// 1. STATE + ELEMENT REFERENCES
// ---------------------------------------------------------------
let allItems = [];              // every item returned by the API
let activeFilter = 'All';       // 'All' | 'Lost' | 'Found'
let searchText = '';            // current text in the search box

const grid      = document.getElementById('itemsGrid');
const listState = document.getElementById('listState');
const form      = document.getElementById('itemForm');
const messageEl = document.getElementById('message');
const submitBtn = document.getElementById('submitBtn');
const searchEl  = document.getElementById('search');

// Set the date field to "today" by default — one less thing to type
document.getElementById('date').valueAsDate = new Date();

// ---------------------------------------------------------------
// 2. SMALL HELPERS
// ---------------------------------------------------------------

/** Show a success (green) or error (red) message above the form. */
function showMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
  messageEl.hidden = false;
  // Auto-hide success messages after 4 seconds; errors stay until next action
  if (type === 'success') setTimeout(() => { messageEl.hidden = true; }, 4000);
}

/** Format an ISO date from MongoDB into a friendly "21 Oct 2026". */
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

/** Escape user text before putting it into HTML (prevents broken layout / XSS). */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

/** Update the three counters in the hero section. */
function updateCounts() {
  document.getElementById('countTotal').textContent = allItems.length;
  document.getElementById('countLost').textContent  = allItems.filter(i => i.status === 'Lost').length;
  document.getElementById('countFound').textContent = allItems.filter(i => i.status === 'Found').length;
}

// ---------------------------------------------------------------
// 3. LOAD ITEMS FROM THE API
// ---------------------------------------------------------------
async function loadItems() {
  listState.textContent = 'Loading items…';
  listState.className = 'list-state';
  try {
    const res = await fetch('/api/items');
    if (!res.ok) throw new Error('Server error');
    allItems = await res.json();
    renderItems();
  } catch (err) {
    // Server down / DB down — show a clear, useful error (never a blank page)
    grid.innerHTML = '';
    listState.textContent = 'Could not load items. Is the server and MongoDB running? Try refreshing.';
    listState.className = 'list-state error';
    document.getElementById('countTotal').textContent = '–';
  }
}

// ---------------------------------------------------------------
// 4. RENDER ITEMS AS CARDS
//    Applies BOTH the active Lost/Found filter AND the search text.
// ---------------------------------------------------------------
function renderItems() {
  updateCounts();

  const visible = allItems.filter(item => {
    const matchesFilter = activeFilter === 'All' || item.status === activeFilter;
    const haystack = `${item.name} ${item.description} ${item.location}`.toLowerCase();
    return matchesFilter && haystack.includes(searchText.toLowerCase());
  });

  // Empty state — important for a good demo: explain *why* it's empty
  if (visible.length === 0) {
    grid.innerHTML = '';
    listState.textContent = allItems.length === 0
      ? 'No items reported yet. Be the first to report one using the form.'
      : 'No items match your filter or search.';
    return;
  }
  listState.textContent = '';

  // Build one card per item. data-id holds the MongoDB _id for Delete.
  grid.innerHTML = visible.map(item => `
    <article class="card">
      <div class="card-top">
        <h3>${escapeHtml(item.name)}</h3>
        <span class="badge ${item.status.toLowerCase()}">${item.status}</span>
      </div>
      <p>${escapeHtml(item.description)}</p>
      <p class="meta">Location: ${escapeHtml(item.location)}</p>
      <p class="meta">Date: ${formatDate(item.date)}</p>
      <button class="delete-btn" data-id="${item._id}">Delete</button>
    </article>
  `).join('');
}

// ---------------------------------------------------------------
// 5. SUBMIT THE REPORT FORM  ->  POST /api/items
// ---------------------------------------------------------------
form.addEventListener('submit', async (e) => {
  e.preventDefault(); // stop the page from reloading — we send data with fetch()

  // Read + trim the form values
  const data = {
    name:        form.name.value.trim(),
    description: form.description.value.trim(),
    location:    form.location.value.trim(),
    date:        form.date.value,
    status:      form.status.value
  };

  // Client-side validation (server validates again — never trust the browser alone)
  if (!data.name || !data.description || !data.location || !data.date) {
    showMessage('Please fill all fields before submitting.', 'error');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting…';
  try {
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(result.message || 'Something went wrong.');

    showMessage(`Report submitted successfully — “${data.name}” is now listed.`, 'success');
    form.reset();
    document.getElementById('date').valueAsDate = new Date();
    await loadItems(); // re-fetch so the new card + counts appear
  } catch (err) {
    showMessage(err.message || 'Could not submit. Please try again.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit report';
  }
});

// ---------------------------------------------------------------
// 6. DELETE A CARD  ->  DELETE /api/items/:id
//    One listener on the whole grid (event delegation) — works
//    even for cards added later, no need to re-bind buttons.
// ---------------------------------------------------------------
grid.addEventListener('click', async (e) => {
  const btn = e.target.closest('.delete-btn');
  if (!btn) return;
  if (!confirm('Delete this item record?')) return;

  btn.disabled = true;
  try {
    const res = await fetch(`/api/items/${btn.dataset.id}`, { method: 'DELETE' });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(result.message || 'Delete failed.');
    showMessage('Item deleted.', 'success');
    await loadItems();
  } catch (err) {
    showMessage(err.message || 'Could not delete item.', 'error');
    btn.disabled = false;
  }
});

// ---------------------------------------------------------------
// 7. FILTER BUTTONS + SEARCH BOX
// ---------------------------------------------------------------
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    renderItems(); // re-render from memory — no extra API call needed
  });
});

searchEl.addEventListener('input', () => {
  searchText = searchEl.value;
  renderItems();
});

// ---------------------------------------------------------------
// 8. START — load everything when the page opens
// ---------------------------------------------------------------
loadItems();
