/* ============================================================
   LIFE DASHBOARD — script.js
   Sections:
     1.  Constants & Local Storage Keys
     2.  State
     3.  Utility Helpers
     4.  Greeting & Clock
     5.  Custom Name
     6.  Theme Toggle
     7.  Focus Timer
     8.  To-Do List
     9.  Quick Links
    10.  Edit Modal
    11.  Init (wire everything up on DOMContentLoaded)
============================================================ */


/* ============================================================
   1. CONSTANTS & LOCAL STORAGE KEYS
============================================================ */
const LS_NAME  = 'dashboardName';
const LS_THEME = 'dashboardTheme';
const LS_TASKS = 'dashboardTasks';
const LS_LINKS = 'dashboardLinks';

// Timer defaults
const TIMER_MINUTES = 25;
const TIMER_SECONDS = 0;


/* ============================================================
   2. STATE
============================================================ */
const state = {
  // Timer
  timerTotal:    TIMER_MINUTES * 60 + TIMER_SECONDS, // remaining seconds
  timerInterval: null,   // setInterval handle — null means not running

  // Edit modal
  editingTaskId: null,   // id of the task currently being edited
};


/* ============================================================
   3. UTILITY HELPERS
============================================================ */

/**
 * Pad a number to 2 digits, e.g. 5 → "05".
 * @param {number} n
 * @returns {string}
 */
const pad2 = (n) => String(n).padStart(2, '0');

/**
 * Generate a simple unique id using timestamp + random suffix.
 * @returns {string}
 */
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

/**
 * Read a JSON value from localStorage, with a fallback default.
 * @param {string} key
 * @param {*} fallback
 * @returns {*}
 */
const lsGet = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

/**
 * Write a value to localStorage as JSON.
 * @param {string} key
 * @param {*} value
 */
const lsSet = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};


/* ============================================================
   4. GREETING & CLOCK
============================================================ */

/**
 * Return the correct greeting phrase based on the current hour.
 * @param {number} hour  0–23
 * @returns {string}
 */
const getGreetingPhrase = (hour) => {
  if (hour >= 5  && hour <= 11) return 'Good Morning';
  if (hour >= 12 && hour <= 17) return 'Good Afternoon';
  if (hour >= 18 && hour <= 20) return 'Good Evening';
  return 'Good Night';
};

/**
 * Return a full readable date string, e.g. "Friday, June 19, 2026".
 * @param {Date} date
 * @returns {string}
 */
const formatDate = (date) =>
  date.toLocaleDateString('en-US', {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
  });

/**
 * Update the clock display and greeting phrase every tick.
 * Called once immediately, then scheduled with setInterval.
 */
const tickClock = () => {
  const now  = new Date();
  const hour = now.getHours();

  // Time — HH:MM:SS
  document.getElementById('clockTime').textContent =
    `${pad2(hour)}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;

  // Date
  document.getElementById('clockDate').textContent = formatDate(now);

  // Greeting phrase (recalculate each tick to handle hour changes)
  document.getElementById('greetingText').textContent = getGreetingPhrase(hour);
};

/** Start the live clock — ticks every 1 000 ms. */
const initClock = () => {
  tickClock();                          // immediate first render
  setInterval(tickClock, 1000);
};


/* ============================================================
   5. CUSTOM NAME
============================================================ */

/** Render the greeting name from storage (or a fallback). */
const renderName = () => {
  const name = lsGet(LS_NAME, '');
  document.getElementById('greetingName').textContent =
    name.trim() ? `Hello, ${name.trim()}!` : 'Hello!';
};

/** Wire up the "Change Name" button and the save-name flow. */
const initName = () => {
  const changeBtn = document.getElementById('changeNameBtn');
  const saveBtn   = document.getElementById('saveNameBtn');
  const nameForm  = document.getElementById('nameForm');
  const nameInput = document.getElementById('nameInput');

  // Pre-fill input with stored name
  nameInput.value = lsGet(LS_NAME, '');

  // Show the inline name form
  changeBtn.addEventListener('click', () => {
    nameForm.classList.add('visible');
    nameInput.focus();
  });

  // Save name to localStorage and hide form
  const saveName = () => {
    const trimmed = nameInput.value.trim();
    lsSet(LS_NAME, trimmed);
    renderName();
    nameForm.classList.remove('visible');
  };

  saveBtn.addEventListener('click', saveName);

  // Also save on Enter key inside the input
  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveName();
    if (e.key === 'Escape') nameForm.classList.remove('visible');
  });
};


/* ============================================================
   6. THEME TOGGLE
============================================================ */

/** Apply a theme ('light' | 'dark') to the <html> element. */
const applyTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme);
  document.getElementById('themeIcon').textContent =
    theme === 'dark' ? '🌞' : '🌙';
};

/** Wire up the theme toggle button and restore saved preference. */
const initTheme = () => {
  const saved = lsGet(LS_THEME, 'light');
  applyTheme(saved);

  document.getElementById('themeToggleBtn').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next    = current === 'dark' ? 'light' : 'dark';
    lsSet(LS_THEME, next);
    applyTheme(next);
  });
};


/* ============================================================
   7. FOCUS TIMER
============================================================ */

/** Format remaining seconds as "MM:SS". */
const formatTimer = (totalSeconds) =>
  `${pad2(Math.floor(totalSeconds / 60))}:${pad2(totalSeconds % 60)}`;

/** Update the timer display element. */
const renderTimer = () => {
  document.getElementById('timerDisplay').textContent =
    formatTimer(state.timerTotal);
};

/**
 * Start the countdown.  Guard against running multiple intervals
 * simultaneously — if one is already running, do nothing.
 */
const timerStart = () => {
  if (state.timerInterval !== null) return; // already running

  state.timerInterval = setInterval(() => {
    if (state.timerTotal <= 0) {
      // Timer finished
      clearInterval(state.timerInterval);
      state.timerInterval = null;
      renderTimer();
      // Notify the user
      if (Notification.permission === 'granted') {
        new Notification('Focus Timer', { body: 'Session complete! Take a break 🎉' });
      } else {
        alert('⏰ Focus session complete! Take a break 🎉');
      }
      return;
    }
    state.timerTotal -= 1;
    renderTimer();
  }, 1000);
};

/** Pause the countdown without resetting. */
const timerStop = () => {
  if (state.timerInterval !== null) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
};

/** Stop and reset to the default 25:00. */
const timerReset = () => {
  timerStop();
  state.timerTotal = TIMER_MINUTES * 60 + TIMER_SECONDS;
  renderTimer();
};

/** Wire up timer buttons. */
const initTimer = () => {
  renderTimer(); // initial display

  document.getElementById('timerStartBtn').addEventListener('click', timerStart);
  document.getElementById('timerStopBtn').addEventListener('click', timerStop);
  document.getElementById('timerResetBtn').addEventListener('click', timerReset);

  // Request notification permission proactively (non-blocking)
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
};


/* ============================================================
   8. TO-DO LIST
============================================================ */

/** Load tasks array from localStorage. @returns {Array} */
const loadTasks = () => lsGet(LS_TASKS, []);

/** Persist tasks array to localStorage. @param {Array} tasks */
const saveTasks = (tasks) => lsSet(LS_TASKS, tasks);

/**
 * Build and inject task list items into the DOM.
 * Reads tasks from localStorage each time for simplicity.
 */
const renderTasks = () => {
  const tasks     = loadTasks();
  const list      = document.getElementById('taskList');
  const emptyMsg  = document.getElementById('taskEmptyState');

  // Clear current list
  list.innerHTML = '';

  if (tasks.length === 0) {
    emptyMsg.classList.remove('hidden');
    return;
  }
  emptyMsg.classList.add('hidden');

  tasks.forEach((task) => {
    const li = document.createElement('li');
    li.className = `task-item${task.done ? ' done' : ''}`;
    li.dataset.id = task.id;

    // --- Checkbox (toggle complete) ---
    const checkbox = document.createElement('button');
    checkbox.className = 'task-checkbox';
    checkbox.setAttribute('aria-label', task.done ? 'Mark incomplete' : 'Mark complete');
    checkbox.setAttribute('title', task.done ? 'Mark incomplete' : 'Mark complete');
    checkbox.addEventListener('click', () => toggleTask(task.id));

    // --- Task text ---
    const span = document.createElement('span');
    span.className = 'task-text';
    span.textContent = task.text;

    // --- Action buttons ---
    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const editBtn = document.createElement('button');
    editBtn.className  = 'task-btn task-btn-edit';
    editBtn.textContent = 'Edit';
    editBtn.setAttribute('aria-label', `Edit task: ${task.text}`);
    editBtn.addEventListener('click', () => openEditModal(task.id));

    const deleteBtn = document.createElement('button');
    deleteBtn.className  = 'task-btn task-btn-delete';
    deleteBtn.textContent = 'Delete';
    deleteBtn.setAttribute('aria-label', `Delete task: ${task.text}`);
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(actions);
    list.appendChild(li);
  });
};

/**
 * Add a new task after validation.
 * Prevents: empty strings, duplicates (case-insensitive, trimmed).
 */
const addTask = () => {
  const input   = document.getElementById('taskInput');
  const rawText = input.value.trim();

  if (!rawText) return; // ignore empty input

  const tasks = loadTasks();

  // Duplicate check — case-insensitive
  const isDuplicate = tasks.some(
    (t) => t.text.toLowerCase() === rawText.toLowerCase()
  );
  if (isDuplicate) {
    alert('Task already exists.');
    input.focus();
    return;
  }

  tasks.push({ id: uid(), text: rawText, done: false });
  saveTasks(tasks);
  renderTasks();
  input.value = '';
  input.focus();
};

/**
 * Toggle the done/undone state of a task by id.
 * @param {string} id
 */
const toggleTask = (id) => {
  const tasks = loadTasks();
  const task  = tasks.find((t) => t.id === id);
  if (task) {
    task.done = !task.done;
    saveTasks(tasks);
    renderTasks();
  }
};

/**
 * Delete a task by id.
 * @param {string} id
 */
const deleteTask = (id) => {
  const tasks = loadTasks().filter((t) => t.id !== id);
  saveTasks(tasks);
  renderTasks();
};

/**
 * Save an edited task text.
 * Validates: not empty, not a duplicate (excluding the task being edited).
 * @param {string} id
 * @param {string} newText
 */
const saveEditedTask = (id, newText) => {
  const trimmed = newText.trim();
  if (!trimmed) return false;

  const tasks = loadTasks();
  const isDuplicate = tasks.some(
    (t) => t.id !== id && t.text.toLowerCase() === trimmed.toLowerCase()
  );
  if (isDuplicate) {
    alert('Task already exists.');
    return false;
  }

  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.text = trimmed;
    saveTasks(tasks);
    renderTasks();
  }
  return true;
};

/** Wire up the Add Task button and Enter-key shortcut. */
const initTasks = () => {
  renderTasks();

  document.getElementById('addTaskBtn').addEventListener('click', addTask);

  document.getElementById('taskInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTask();
  });
};


/* ============================================================
   9. QUICK LINKS
============================================================ */

/** Load links array from localStorage. @returns {Array} */
const loadLinks = () => lsGet(LS_LINKS, []);

/** Persist links array to localStorage. @param {Array} links */
const saveLinks = (links) => lsSet(LS_LINKS, links);

/** Build and inject link buttons into the DOM. */
const renderLinks = () => {
  const links    = loadLinks();
  const grid     = document.getElementById('linksGrid');
  const emptyMsg = document.getElementById('linksEmptyState');

  grid.innerHTML = '';

  if (links.length === 0) {
    emptyMsg.classList.remove('hidden');
    return;
  }
  emptyMsg.classList.add('hidden');

  links.forEach((link) => {
    // Wrapper div
    const item = document.createElement('div');
    item.className = 'link-item';
    item.dataset.id = link.id;

    // Clickable anchor
    const anchor = document.createElement('a');
    anchor.className  = 'link-anchor';
    anchor.href       = link.url;
    anchor.target     = '_blank';
    anchor.rel        = 'noopener noreferrer';
    anchor.textContent = link.name;

    // Delete button
    const delBtn = document.createElement('button');
    delBtn.className  = 'link-delete-btn';
    delBtn.textContent = '✕';
    delBtn.setAttribute('aria-label', `Remove ${link.name}`);
    delBtn.addEventListener('click', () => deleteLink(link.id));

    item.appendChild(anchor);
    item.appendChild(delBtn);
    grid.appendChild(item);
  });
};

/**
 * Add a new quick link after basic validation.
 */
const addLink = () => {
  const nameInput = document.getElementById('linkNameInput');
  const urlInput  = document.getElementById('linkUrlInput');

  const name = nameInput.value.trim();
  let   url  = urlInput.value.trim();

  if (!name || !url) {
    alert('Please enter both a website name and URL.');
    return;
  }

  // Auto-prepend https:// if the user omitted a protocol
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }

  // Basic URL validity check
  try {
    new URL(url);
  } catch {
    alert('Please enter a valid URL (e.g. https://example.com).');
    urlInput.focus();
    return;
  }

  const links = loadLinks();
  links.push({ id: uid(), name, url });
  saveLinks(links);
  renderLinks();

  nameInput.value = '';
  urlInput.value  = '';
  nameInput.focus();
};

/**
 * Delete a quick link by id.
 * @param {string} id
 */
const deleteLink = (id) => {
  const links = loadLinks().filter((l) => l.id !== id);
  saveLinks(links);
  renderLinks();
};

/** Wire up the Add Link button and Enter-key shortcut on URL field. */
const initLinks = () => {
  renderLinks();

  document.getElementById('addLinkBtn').addEventListener('click', addLink);

  document.getElementById('linkUrlInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addLink();
  });
};


/* ============================================================
   10. EDIT MODAL
============================================================ */

/** Open the edit modal for a given task id. @param {string} id */
const openEditModal = (id) => {
  const tasks   = loadTasks();
  const task    = tasks.find((t) => t.id === id);
  if (!task) return;

  state.editingTaskId = id;

  const input = document.getElementById('editTaskInput');
  input.value = task.text;

  const modal = document.getElementById('editModal');
  modal.hidden = false;
  input.focus();
  input.select();
};

/** Close the edit modal without saving. */
const closeEditModal = () => {
  document.getElementById('editModal').hidden = true;
  state.editingTaskId = null;
};

/** Wire up modal Save / Cancel / backdrop click / Escape key. */
const initEditModal = () => {
  document.getElementById('saveEditBtn').addEventListener('click', () => {
    if (state.editingTaskId === null) return;
    const newText = document.getElementById('editTaskInput').value;
    const saved   = saveEditedTask(state.editingTaskId, newText);
    if (saved) closeEditModal();
  });

  document.getElementById('cancelEditBtn').addEventListener('click', closeEditModal);

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !document.getElementById('editModal').hidden) {
      closeEditModal();
    }
  });

  // Close on backdrop click (click outside .modal box)
  document.getElementById('editModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('editModal')) {
      closeEditModal();
    }
  });

  // Save on Enter key inside the edit input
  document.getElementById('editTaskInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('saveEditBtn').click();
    }
  });
};


/* ============================================================
   11. INIT — run everything once the DOM is ready
============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();       // restore saved theme first (avoids flash)
  initClock();       // live clock + greeting phrase
  initName();        // custom name form
  initTimer();       // Pomodoro countdown
  initTasks();       // to-do list
  initLinks();       // quick links
  initEditModal();   // edit task modal
  renderName();      // show saved name in greeting
});
