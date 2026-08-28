(function () {
  'use strict';

  // ============================================================
  // StorageError
  // ============================================================

  class StorageError extends Error {
    constructor(msg) {
      super(msg);
      this.name = 'StorageError';
    }
  }

  // ============================================================
  // Shared Utilities
  // ============================================================

  const Storage = {
    /**
     * JSON-serializes value and writes to localStorage[key].
     * Throws a StorageError if localStorage is unavailable or write fails.
     * @param {string} key
     * @param {*} value
     */
    save(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (err) {
        throw new StorageError('Storage unavailable: ' + err.message);
      }
    },

    /**
     * Reads and JSON-parses localStorage[key].
     * Returns null if key is absent or value is malformed.
     * Never throws.
     * @param {string} key
     * @returns {*|null}
     */
    load(key) {
      try {
        const raw = localStorage.getItem(key);
        if (raw === null) return null;
        return JSON.parse(raw);
      } catch (_) {
        return null;
      }
    },
  };

  // ============================================================
  // ThemeManager
  // ============================================================

  const ThemeManager = {
    _VALID: new Set(['light', 'dark']),
    _KEY:   'tld_theme',

    apply(theme) {
      document.documentElement.setAttribute('data-theme', theme);
    },

    getCurrent() {
      const val = document.documentElement.getAttribute('data-theme');
      return this._VALID.has(val) ? val : 'light';
    },

    persist(theme) {
      try {
        Storage.save(this._KEY, theme);
      } catch (_) {
        // Silent failure — theme stays applied in-memory
      }
    },
  };

  // ----------------------------------------------------------------

  const TimeUtil = {
    _DAYS: [
      'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
    ],

    _MONTHS: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ],

    /**
     * Returns "HH:MM" (24-hour) from a Date object.
     * @param {Date} date
     * @returns {string}
     */
    formatTime(date) {
      const h = String(date.getHours()).padStart(2, '0');
      const m = String(date.getMinutes()).padStart(2, '0');
      return `${h}:${m}`;
    },

    /**
     * Returns "Weekday, Month DD, YYYY" from a Date object.
     * Uses static day/month name arrays for consistent, locale-independent output.
     * Example: formatDate(new Date(2024, 7, 26)) → "Monday, August 26, 2024"
     * @param {Date} date
     * @returns {string}
     */
    formatDate(date) {
      const weekday = this._DAYS[date.getDay()];
      const month   = this._MONTHS[date.getMonth()];
      const day     = String(date.getDate()).padStart(2, '0');
      const year    = date.getFullYear();
      return `${weekday}, ${month} ${day}, ${year}`;
    },

    /**
     * Returns greeting string for given hour (0–23).
     * 0–11  → "Good Morning"
     * 12–17 → "Good Afternoon"
     * 18–23 → "Good Evening"
     * other → "Good Day" (fallback)
     * @param {number} hour
     * @returns {string}
     */
    greetingFromHour(hour) {
      if (hour >= 0 && hour <= 11) return 'Good Morning';
      if (hour >= 12 && hour <= 17) return 'Good Afternoon';
      if (hour >= 18 && hour <= 23) return 'Good Evening';
      return 'Good Day';
    },
  };

  // ----------------------------------------------------------------

  const Validators = {
    /**
     * true iff text.trim().length > 0 && text.length <= 500
     * @param {string} text
     * @returns {boolean}
     */
    isValidTaskText(text) {
      return typeof text === 'string' && text.trim().length > 0 && text.length <= 500;
    },

    /**
     * true iff label.trim().length > 0 && label.length <= 100
     * @param {string} label
     * @returns {boolean}
     */
    isValidLinkLabel(label) {
      return typeof label === 'string' && label.trim().length > 0 && label.length <= 100;
    },

    /**
     * true iff url starts with "http://" or "https://"
     * @param {string} url
     * @returns {boolean}
     */
    isValidUrl(url) {
      return (
        typeof url === 'string' &&
        (url.startsWith('http://') || url.startsWith('https://'))
      );
    },

    /**
     * true iff any link in links has the same url (case-sensitive)
     * @param {string} url
     * @param {Array<{url: string}>} links
     * @returns {boolean}
     */
    isDuplicateUrl(url, links) {
      return links.some((link) => link.url === url);
    },
  };

  // ----------------------------------------------------------------

  /**
   * Generates a UUID using crypto.randomUUID() with a Math.random() fallback.
   * @returns {string}
   */
  function uuid() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    // Fallback: RFC 4122 version-4-like UUID
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Creates a new Task object.
   * @param {string} text
   * @returns {{ id: string, text: string, done: boolean, createdAt: string }}
   */
  function createTask(text) {
    return {
      id: uuid(),
      text: text,
      done: false,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Formats seconds as "MM:SS" zero-padded.
   * @param {number} seconds
   * @returns {string}
   */
  function formatTimerDisplay(seconds) {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  // ============================================================
  // Greeting Panel
  // ============================================================

  const GreetingPanel = {
    _intervalId: null,

    init() {
      this.render();
      this._intervalId = setInterval(() => this.render(), 60000);
    },

    render() {
      const timeEl = document.getElementById('greeting-time');
      const dateEl = document.getElementById('greeting-date');
      const msgEl = document.getElementById('greeting-message');

      let now;
      try {
        now = new Date();
        if (isNaN(now.getTime())) throw new Error('Invalid date');
      } catch (_) {
        if (timeEl) timeEl.textContent = '--:--';
        if (dateEl) dateEl.textContent = 'Date unavailable';
        if (msgEl) msgEl.textContent = 'Good Day';
        return;
      }

      if (timeEl) timeEl.textContent = TimeUtil.formatTime(now);
      if (dateEl) dateEl.textContent = TimeUtil.formatDate(now);
      if (msgEl) msgEl.textContent = TimeUtil.greetingFromHour(now.getHours());
    },
  };

  // ============================================================
// Focus Timer
// ============================================================

const FocusTimer = {
  state: {
    remaining: 1500,
    running: false,
    intervalId: null,
  },

  init() {
    this.render();

    document
      .getElementById('btn-start')
      .addEventListener('click', () => this.start());

    document
      .getElementById('btn-stop')
      .addEventListener('click', () => this.stop());

    document
      .getElementById('btn-reset')
      .addEventListener('click', () => this.reset());
  },

  start() {
    if (this.state.running) return;
    if (this.state.remaining === 0) return;

    const durationInput = document.getElementById('timer-minutes');

    const minutes = Number(durationInput.value);

    // Validasi durasi
    if (!minutes || minutes < 1 || minutes > 180) {
      const statusEl = document.getElementById('timer-status');

      if (statusEl) {
        statusEl.textContent =
          'Please enter a duration between 1 and 180 minutes.';
      }

      return;
    }

    // Mengubah menit menjadi detik
    this.state.remaining = minutes * 60;

    this.state.running = true;

    durationInput.disabled = true;

    this.state.intervalId = setInterval(
      () => this.tick(),
      1000
    );

    this.render();
  },

  stop() {
    if (!this.state.running) return;

    clearInterval(this.state.intervalId);

    this.state.intervalId = null;
    this.state.running = false;

    this.render();
  },

  reset() {
    clearInterval(this.state.intervalId);

    this.state.intervalId = null;
    this.state.running = false;

    const durationInput = document.getElementById('timer-minutes');

    const minutes = Number(durationInput.value) || 25;

    this.state.remaining = minutes * 60;

    durationInput.disabled = false;

    this.render();
  },

  tick() {
    if (this.state.remaining > 0) {
      this.state.remaining -= 1;
    }

    if (this.state.remaining === 0) {
      clearInterval(this.state.intervalId);

      this.state.intervalId = null;
      this.state.running = false;

      const durationInput =
        document.getElementById('timer-minutes');

      durationInput.disabled = false;
    }

    this.render();
  },

  render() {
    const displayEl =
      document.getElementById('timer-display');

    const statusEl =
      document.getElementById('timer-status');

    const btnStart =
      document.getElementById('btn-start');

    const btnStop =
      document.getElementById('btn-stop');

    if (displayEl) {
      displayEl.textContent =
        formatTimerDisplay(this.state.remaining);
    }

    if (statusEl) {
      if (this.state.remaining === 0) {
        statusEl.textContent =
          'Session complete! Take a break.';
      } else if (this.state.running) {
        statusEl.textContent =
          'Focus session in progress...';
      } else {
        statusEl.textContent = '';
      }
    }

    if (btnStart) {
      btnStart.disabled =
        this.state.running ||
        this.state.remaining === 0;
    }

    if (btnStop) {
      btnStop.disabled =
        !this.state.running;
    }
  },
};

  // ============================================================
  // To-Do List
  // ============================================================

  const TodoList = {
    tasks: [],

    init() {
      const loaded = Storage.load('tld_tasks');
      this.tasks = Array.isArray(loaded) ? loaded : [];
      this.render();

      document.getElementById('todo-add-btn').addEventListener('click', () => {
        const input = document.getElementById('todo-input');
        this.add(input.value);
      });

      document.getElementById('todo-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.add(e.target.value);
        }
      });
    },

    add(text) {
      const errorEl = document.getElementById('todo-error');

      if (!text || text.trim().length === 0) {
        this._showError(errorEl, 'Task description is required.');
        return;
      }
      if (text.length > 500) {
        this._showError(errorEl, 'Task description must be 500 characters or fewer.');
        return;
      }

      const task = createTask(text.trim());
      this.tasks.unshift(task);

      try {
        this.persist();
        this._hideError(errorEl);
        document.getElementById('todo-input').value = '';
        this.render();
      } catch (_) {
        // Storage failed — roll back
        this.tasks.shift();
        this._showError(
          errorEl,
          'Your task could not be saved. Changes are in-memory only.'
        );
      }
    },

    edit(id, newText) {
      const errorEl = document.getElementById('todo-error');
      const task = this.tasks.find((t) => t.id === id);
      if (!task) return;

      if (!newText || newText.trim().length === 0) {
        this._showError(errorEl, 'Task description cannot be empty.');
        this.render();
        return;
      }

      const original = task.text;
      task.text = newText.trim();

      try {
        this.persist();
        this._hideError(errorEl);
        this.render();
      } catch (_) {
        task.text = original;
        this._showError(
          errorEl,
          'Your change could not be saved. It is available for this session only.'
        );
        this.render();
      }
    },

    toggle(id) {
      const errorEl = document.getElementById('todo-error');
      const task = this.tasks.find((t) => t.id === id);
      if (!task) return;

      task.done = !task.done;

      try {
        this.persist();
        this._hideError(errorEl);
      } catch (_) {
        this._showError(
          errorEl,
          'Completion state could not be saved. It is available for this session only.'
        );
      }
      this.render();
    },

    delete(id) {
      const errorEl = document.getElementById('todo-error');
      const index = this.tasks.findIndex((t) => t.id === id);
      if (index === -1) return;

      const confirmed = window.confirm('Delete this task?');
      if (!confirmed) return;

      const [removed] = this.tasks.splice(index, 1);

      try {
        this.persist();
        this._hideError(errorEl);
        this.render();
      } catch (_) {
        // Restore task
        this.tasks.splice(index, 0, removed);
        this._showError(
          errorEl,
          'Task could not be deleted. Please try again.'
        );
        this.render();
      }
    },

    persist() {
      Storage.save('tld_tasks', this.tasks);
    },

    render() {
      const listEl = document.getElementById('todo-list');
      if (!listEl) return;

      listEl.innerHTML = '';

      if (this.tasks.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'todo-empty';
        empty.textContent = 'No tasks yet. Add one above!';
        empty.style.color = '#9ca3af';
        empty.style.fontSize = '0.9rem';
        listEl.appendChild(empty);
        return;
      }

      this.tasks.forEach((task) => {
        const li = document.createElement('li');
        li.className = 'todo-item' + (task.done ? ' done' : '');
        li.dataset.id = task.id;

        // Checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = task.done;
        checkbox.setAttribute('aria-label', 'Mark task as ' + (task.done ? 'not done' : 'done'));
        checkbox.addEventListener('change', () => this.toggle(task.id));

        // Text span
        const textSpan = document.createElement('span');
        textSpan.className = 'task-text';
        textSpan.textContent = task.text;

        // Edit button
        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'btn-edit';
        editBtn.textContent = 'Edit';
        editBtn.setAttribute('aria-label', 'Edit task: ' + task.text);
        editBtn.addEventListener('click', () => this._activateEdit(task.id, li));

        // Delete button
        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'btn-delete';
        delBtn.textContent = 'Delete';
        delBtn.setAttribute('aria-label', 'Delete task: ' + task.text);
        delBtn.addEventListener('click', () => this.delete(task.id));

        li.appendChild(checkbox);
        li.appendChild(textSpan);
        li.appendChild(editBtn);
        li.appendChild(delBtn);

        listEl.appendChild(li);
      });
    },

    _activateEdit(id, li) {
      const task = this.tasks.find((t) => t.id === id);
      if (!task) return;

      // Replace the text span with an input
      const textSpan = li.querySelector('.task-text');
      const editInput = document.createElement('input');
      editInput.type = 'text';
      editInput.className = 'task-edit-input';
      editInput.value = task.text;
      editInput.maxLength = 500;
      editInput.setAttribute('aria-label', 'Edit task text');
      li.replaceChild(editInput, textSpan);

      // Replace edit button with save/cancel
      const editBtn = li.querySelector('.btn-edit');
      const saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.className = 'btn-save';
      saveBtn.textContent = 'Save';
      saveBtn.addEventListener('click', () => this.edit(id, editInput.value));

      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'btn-cancel';
      cancelBtn.textContent = 'Cancel';
      cancelBtn.addEventListener('click', () => this.render());

      li.replaceChild(saveBtn, editBtn);
      li.insertBefore(cancelBtn, li.querySelector('.btn-delete'));

      editInput.focus();
    },

    _showError(el, message) {
      if (!el) return;
      el.textContent = message;
      el.hidden = false;
    },

    _hideError(el) {
      if (!el) return;
      el.textContent = '';
      el.hidden = true;
    },
  };

  // ============================================================
  // Quick Links
  // ============================================================

  const QuickLinks = {
    links: [],

    init() {
      const loaded = Storage.load('tld_links');
      if (loaded === null) {
        // Could be missing or malformed — Storage.load returns null for both
        this.links = [];
        // Check if there was actually data that failed to parse
        // (Storage.load swallows errors, but we can check raw value)
        try {
          const raw = localStorage.getItem('tld_links');
          if (raw !== null) {
            // Data existed but failed to parse → show error per Req 13.3
            const errorEl = document.getElementById('links-error');
            this._showError(errorEl, 'Saved links could not be loaded.');
          }
        } catch (_) {
          // localStorage unavailable — silently use empty array
        }
      } else if (Array.isArray(loaded)) {
        this.links = loaded;
      } else {
        // Unexpected type
        this.links = [];
        const errorEl = document.getElementById('links-error');
        this._showError(errorEl, 'Saved links could not be loaded.');
      }

      this.render();

      document.getElementById('links-add-btn').addEventListener('click', () => {
        const label = document.getElementById('links-label-input').value;
        const url = document.getElementById('links-url-input').value;
        this.add(label, url);
      });
    },

    add(label, url) {
      const errorEl = document.getElementById('links-error');

      if (!label || label.trim().length === 0) {
        this._showError(errorEl, 'Link label is required.');
        return;
      }
      if (!url || url.trim().length === 0) {
        this._showError(errorEl, 'Link URL is required.');
        return;
      }
      if (!Validators.isValidUrl(url)) {
        this._showError(errorEl, 'URL must start with http:// or https://');
        return;
      }
      if (Validators.isDuplicateUrl(url, this.links)) {
        this._showError(errorEl, 'This URL is already in your Quick Links.');
        return;
      }

      const link = {
        id: uuid(),
        label: label.trim(),
        url: url.trim(),
      };
      this.links.push(link);

      try {
        this.persist();
        this._hideError(errorEl);
        document.getElementById('links-label-input').value = '';
        document.getElementById('links-url-input').value = '';
        this.render();
      } catch (_) {
        this.links.pop();
        this._showError(errorEl, 'Your link could not be saved. Changes are in-memory only.');
      }
    },

    open(id) {
      const link = this.links.find((l) => l.id === id);
      if (!link) return;
      if (!Validators.isValidUrl(link.url)) {
        const errorEl = document.getElementById('links-error');
        this._showError(errorEl, 'URL is invalid: must start with http:// or https://');
        return;
      }
      window.open(link.url, '_blank', 'noopener,noreferrer');
    },

    delete(id) {
      const errorEl = document.getElementById('links-error');
      const index = this.links.findIndex((l) => l.id === id);
      if (index === -1) return;

      const [removed] = this.links.splice(index, 1);

      try {
        this.persist();
        this._hideError(errorEl);
        this.render();
      } catch (_) {
        this.links.splice(index, 0, removed);
        this._showError(errorEl, 'Link could not be deleted. Please try again.');
        this.render();
      }
    },

    persist() {
      Storage.save('tld_links', this.links);
    },

    render() {
      const listEl = document.getElementById('links-list');
      if (!listEl) return;

      listEl.innerHTML = '';

      if (this.links.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'links-empty';
        empty.textContent = 'No links yet. Add one above!';
        empty.style.color = '#9ca3af';
        empty.style.fontSize = '0.9rem';
        listEl.appendChild(empty);
        return;
      }

      this.links.forEach((link) => {
        const li = document.createElement('li');
        li.className = 'link-item';
        li.dataset.id = link.id;

        const openBtn = document.createElement('button');
        openBtn.type = 'button';
        openBtn.className = 'btn-open';
        openBtn.textContent = link.label;
        openBtn.title = link.url;

        if (!link.url || link.url.trim().length === 0) {
          openBtn.disabled = true;
          openBtn.setAttribute('aria-label', link.label + ' (no URL configured)');
        } else {
          openBtn.setAttribute('aria-label', 'Open ' + link.label);
          openBtn.addEventListener('click', () => this.open(link.id));
        }

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'btn-link-delete';
        delBtn.textContent = 'Delete';
        delBtn.setAttribute('aria-label', 'Delete link: ' + link.label);
        delBtn.addEventListener('click', () => this.delete(link.id));

        li.appendChild(openBtn);
        li.appendChild(delBtn);
        listEl.appendChild(li);
      });
    },

    _showError(el, message) {
      if (!el) return;
      el.textContent = message;
      el.hidden = false;
    },

    _hideError(el) {
      if (!el) return;
      el.textContent = '';
      el.hidden = true;
    },
  };

  // ============================================================
  // Unsupported Browser Detection
  // ============================================================

  function checkBrowserSupport() {
    const isSupported =
      typeof localStorage !== 'undefined' &&
      typeof crypto !== 'undefined' &&
      typeof Promise !== 'undefined' &&
      typeof fetch !== 'undefined' &&
      CSS.supports('display', 'grid');

    if (!isSupported) {
      const banner = document.getElementById('unsupported-browser-banner');
      if (banner) banner.hidden = false;
    }
  }

  // ============================================================
  // Bootstrap
  // ============================================================

  function init() {
    checkBrowserSupport();
    GreetingPanel.init();
    FocusTimer.init();
    TodoList.init();
    QuickLinks.init();
  }

  document.addEventListener('DOMContentLoaded', init);

  // ============================================================
  // Test exports (only used by tests/shim.js via globalThis)
  // ============================================================
  /* istanbul ignore next */
  if (typeof globalThis !== 'undefined') {
    globalThis.__TLD_TEST_EXPORTS__ = {
      Storage,
      StorageError,
      TimeUtil,
      Validators,
      GreetingPanel,
      FocusTimer,
      TodoList,
      QuickLinks,
      ThemeManager,
      createTask,
      formatTimerDisplay,
      uuid,
    };
  }
})();
// ===============================
// LIGHT / DARK MODE
// ===============================

const themeToggle = document.getElementById("theme-toggle");

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  const isDarkMode = document.body.classList.contains("dark");

  themeToggle.setAttribute(
    "aria-label",
    isDarkMode ? "Switch to light mode" : "Switch to dark mode"
  );

  themeToggle.querySelector("span").textContent = isDarkMode ? "🌙" : "☀️";
});