# Design Document — To Do List Life Dashboard

## Overview

The To Do List Life Dashboard is a single-page, client-side web application built with plain HTML, CSS, and vanilla JavaScript — no frameworks, no build tools, no backend. It runs entirely in the browser and uses `localStorage` for all persistence.

The application is divided into four independent panels rendered inside a single `index.html`:

| Panel | Purpose |
|---|---|
| **Greeting Panel** | Live clock, date, and time-of-day greeting |
| **Focus Timer** | 25-minute Pomodoro-style countdown |
| **To-Do List** | Task management with CRUD and persistence |
| **Quick Links** | Labelled URL shortcuts that open in a new tab |

All business logic lives in `js/app.js`. All presentation lives in `css/style.css`. The HTML file contains only semantic structure and no inline styles or scripts.

---

## Architecture

### High-Level Structure

```
index.html              ← semantic shell only
css/
  style.css             ← all presentation
js/
  app.js                ← all logic, state, and DOM manipulation
```

### Module Pattern Inside `app.js`

Because the project uses no bundler, `app.js` uses the **IIFE module pattern** to avoid polluting the global scope. Each feature area is an isolated object/namespace within a single self-executing function.

```
(function () {
  // Shared utilities
  const Storage  = { ... }    // localStorage wrapper
  const TimeUtil = { ... }    // date/time helpers

  // Feature modules
  const GreetingPanel = { ... }
  const FocusTimer    = { ... }
  const TodoList      = { ... }
  const QuickLinks    = { ... }

  // Bootstrap
  function init() { ... }
  document.addEventListener('DOMContentLoaded', init);
})();
```

### Data Flow

```
User interaction
      │
      ▼
DOM event handler  ──►  Feature module method
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
              Update state           Storage.save()
                    │
                    ▼
               Re-render DOM
```

There is no virtual DOM or reactive layer. State is held in plain JS objects in module scope. Any mutation triggers a targeted DOM update rather than a full re-render.

### Clock Architecture

The clock and greeting both rely on a single shared `setInterval` that fires every 60 seconds. This avoids two separate timers and guarantees the greeting and time update together on every tick.

The Focus Timer uses a separate `setInterval` that fires every 1 second only while running.

---

## Components and Interfaces

### Shared Utilities

#### `TimeUtil`

```js
TimeUtil.formatTime(date: Date): string
// Returns "HH:MM" (24-hour) from a Date object.
// Example: formatTime(new Date(2024,0,1,9,5)) → "09:05"

TimeUtil.formatDate(date: Date): string
// Returns "Weekday, Month DD, YYYY".
// Example: formatDate(new Date(2024,7,26)) → "Monday, August 26, 2024"

TimeUtil.greetingFromHour(hour: number): string
// Returns greeting string for given hour (0–23).
// 0–11 → "Good Morning", 12–17 → "Good Afternoon", 18–23 → "Good Evening"
// Any other value → "Good Day" (fallback)
```

#### `Storage`

```js
Storage.save(key: string, value: any): void
// JSON-serializes value and writes to localStorage[key].
// Throws StorageError if localStorage is unavailable.

Storage.load(key: string): any | null
// Reads and JSON-parses localStorage[key].
// Returns null if key absent or value malformed.
// Never throws — swallows parse errors and returns null.
```

#### `Validators`

```js
Validators.isValidTaskText(text: string): boolean
// true iff text.trim().length > 0 && text.length <= 500

Validators.isValidLinkLabel(label: string): boolean
// true iff label.trim().length > 0 && label.length <= 100

Validators.isValidUrl(url: string): boolean
// true iff url starts with "http://" or "https://"

Validators.isDuplicateUrl(url: string, links: Link[]): boolean
// true iff any link in links has the same url (case-sensitive)
```

---

### GreetingPanel

**Responsibilities:** display current time, date, and greeting; refresh on tick.

**State:** stateless — reads from `Date` on every render call.

**Interface:**

```js
GreetingPanel.init(): void
// Renders initial state and starts 60s interval.

GreetingPanel.render(): void
// Reads current Date, updates #greeting-time, #greeting-date, #greeting-message.
// If Date() throws, renders placeholder text.
```

**DOM targets:** `#greeting-time`, `#greeting-date`, `#greeting-message`

**Name personalisation (Requirement 18):**

When a `Display_Name` is saved, `render()` appends `", [Name]"` to the greeting string (e.g., `"Good Morning, Alex"`). When no name is stored the greeting renders without a suffix, preserving existing behaviour.

**Extended interface:**

```js
GreetingPanel.setName(name: string): void
// Validates that name.trim().length > 0 && name.trim().length <= 50.
// On valid: trims, persists to tld_displayName via Storage.save(), calls render().
// On invalid (empty / whitespace-only): shows "Name cannot be blank." in #greeting-name-error; does not update storage.

GreetingPanel.clearName(): void
// Removes tld_displayName from storage (or writes ""), calls render().
// render() then omits the name suffix from the greeting.

GreetingPanel.getName(): string
// Returns Storage.load('tld_displayName') || ''.
```

**Additional DOM targets:** `#greeting-name-input`, `#greeting-name-btn`, `#greeting-name-error`

---

### FocusTimer

**Responsibilities:** count down from 1500 s (25:00), manage start/stop/reset state, update button enabled states.

**State:**

```js
{
  remaining: number,   // seconds left (0–1500)
  running: boolean,    // whether interval is active
  intervalId: number | null
}
```

**Interface:**

```js
FocusTimer.init(): void
FocusTimer.start(): void
FocusTimer.stop(): void
FocusTimer.reset(): void
FocusTimer.tick(): void        // called by internal interval
FocusTimer.render(): void      // updates #timer-display and button states
```

**DOM targets:** `#timer-display`, `#btn-start`, `#btn-stop`, `#btn-reset`, `#timer-status`

**Display format:** `MM:SS` zero-padded. `formatTimerDisplay(seconds)` is a pure helper.

---

### TodoList

**Responsibilities:** add, edit, toggle, delete tasks; persist to localStorage; load on init.

**State:**

```js
tasks: Task[]   // in-memory array; source of truth for rendering
```

**Interface:**

```js
TodoList.init(): void           // loads from storage, renders
TodoList.add(text: string): void
TodoList.edit(id: string, newText: string): void
TodoList.toggle(id: string): void
TodoList.delete(id: string): void
TodoList.render(): void         // full re-render of #todo-list
TodoList.persist(): void        // writes tasks to Storage; shows error on failure
```

**Task creation helper (pure):**

```js
createTask(text: string): Task
// Returns { id: uuid(), text, done: false, createdAt: ISO8601 }
```

**UUID generation:** uses `crypto.randomUUID()` (available in all target browsers). Falls back to a `Math.random()`-based hex string if unavailable.

**DOM targets:** `#todo-input`, `#todo-add-btn`, `#todo-list`, `#todo-error`

---

### QuickLinks

**Responsibilities:** add, open, delete links; persist to localStorage; load on init.

**State:**

```js
links: Link[]   // in-memory array; source of truth for rendering
```

**Interface:**

```js
QuickLinks.init(): void
QuickLinks.add(label: string, url: string): void
QuickLinks.open(id: string): void
QuickLinks.delete(id: string): void
QuickLinks.render(): void
QuickLinks.persist(): void
```

**DOM targets:** `#links-label-input`, `#links-url-input`, `#links-add-btn`, `#links-list`, `#links-error`

---

### ThemeManager

**Responsibilities:** read saved theme preference or system `prefers-color-scheme` on init, apply a `data-theme` attribute to `<html>`, toggle between `"light"` and `"dark"`, persist selection to `localStorage`.

**State:** stateless at runtime — current theme is always read from `document.documentElement.dataset.theme`.

**Interface:**

```js
ThemeManager.init(): void
// Reads tld_theme from Storage. If present, applies saved theme.
// If absent, checks window.matchMedia('(prefers-color-scheme: dark)');
// if that returns true, applies "dark"; otherwise falls back to "light".

ThemeManager.toggle(): void
// Reads current theme via getCurrent(), flips to opposite, calls apply() and persists to tld_theme.

ThemeManager.apply(theme: 'light' | 'dark'): void
// Sets document.documentElement.setAttribute('data-theme', theme).

ThemeManager.getCurrent(): 'light' | 'dark'
// Returns document.documentElement.getAttribute('data-theme') or 'light' as fallback.
```

**CSS contract:** all colour values are declared as CSS custom properties scoped to `[data-theme]` selectors:

```css
:root[data-theme="light"] { --bg: #ffffff; --text: #1a1a1a; /* … */ }
:root[data-theme="dark"]  { --bg: #1a1a1a; --text: #f5f5f5; /* … */ }
```

All four panels reference only the custom properties, never hard-coded colour values, so a single attribute flip on `<html>` applies the theme universally with no JavaScript DOM walking.

**WCAG contrast:** both themes must provide a minimum 4.5:1 contrast ratio for all text and interactive elements against their backgrounds (WCAG 2.1 Level AA).

**DOM targets:** `#theme-toggle-btn`, `<html>` element (`data-theme` attribute)

---

## Data Models

### Task

```js
{
  id:        string,   // UUID — unique, never reused
  text:      string,   // 1–500 characters, trimmed
  done:      boolean,  // false = "not done", true = "done"
  createdAt: string    // ISO 8601 UTC timestamp, e.g. "2024-08-26T09:00:00.000Z"
}
```

### Link

```js
{
  id:    string,   // UUID
  label: string,   // 1–100 characters, trimmed
  url:   string    // must start with "http://" or "https://"
}
```

### localStorage Keys

| Key | Value | Type |
|---|---|---|
| `tld_tasks` | JSON array of `Task` | `Task[]` |
| `tld_links` | JSON array of `Link` | `Link[]` |
| `tld_theme` | `"light"` or `"dark"` | `string` |
| `tld_displayName` | User-provided name (1–50 chars) or absent/`""` for no name | `string` |

### Serialization Contract

Both collections are stored as JSON-serialized arrays. On load, `Storage.load()` returns the parsed array or `null`. The feature modules treat `null` as an empty collection and never crash on missing/malformed data.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

---

### Property 1: Time format correctness

*For any* `Date` object with a valid local time, `TimeUtil.formatTime(date)` shall return a string of the form `HH:MM` where `HH` is the zero-padded hours (0–23) matching `date.getHours()` and `MM` is the zero-padded minutes (0–59) matching `date.getMinutes()`.

**Validates: Requirements 1.1**

---

### Property 2: Date format correctness

*For any* `Date` object with a valid local date, `TimeUtil.formatDate(date)` shall return a string matching the pattern `"Weekday, Month DD, YYYY"` with the correct day name, month name, two-digit day, and four-digit year derived from the date object.

**Validates: Requirements 1.3**

---

### Property 3: Greeting correctly partitions the day

*For any* integer hour `h` in the range `[0, 23]`, `TimeUtil.greetingFromHour(h)` shall return exactly one of `"Good Morning"` (h ∈ [0,11]), `"Good Afternoon"` (h ∈ [12,17]), or `"Good Evening"` (h ∈ [18,23]). No hour shall map to more than one greeting, and no valid hour shall map to the fallback `"Good Day"`.

**Validates: Requirements 2.1, 2.2, 2.3**

---

### Property 4: Timer countdown arithmetic

*For any* starting value `S` in `[1, 1500]` and any number of decrements `N` where `0 ≤ N ≤ S`, after `N` calls to `FocusTimer.tick()` the `remaining` value shall equal `S - N`.

**Validates: Requirements 3.2**

---

### Property 5: Timer button state reflects running state

*For any* timer state, the enabled/disabled state of the Start and Stop buttons shall be the complement of each other: Start is enabled iff the timer is stopped/paused (and remaining > 0), and Stop is enabled iff the timer is running.

**Validates: Requirements 3.4, 3.5**

---

### Property 6: Timer reset is unconditionally idempotent

*For any* timer state (running, paused, or completed), calling `FocusTimer.reset()` shall always produce a state where `remaining === 1500` and `running === false`, regardless of how many times reset is called or what state preceded it.

**Validates: Requirements 4.3**

---

### Property 7: Redundant Start/Stop activations are no-ops

*For any* running timer state, activating Start shall leave the timer state unchanged. *For any* stopped timer state, activating Stop shall leave the timer state unchanged.

**Validates: Requirements 4.5, 4.6**

---

### Property 8: Timer pause-resume preserves countdown value

*For any* pause point `P` where `0 < P < 1500`, after calling `FocusTimer.stop()` and then `FocusTimer.start()` without any tick in between, `remaining` shall still equal `P`.

**Validates: Requirements 3.7**

---

### Property 9: Task creation produces a valid Task object

*For any* string `text` where `text.trim().length > 0` and `text.length ≤ 500`, `createTask(text)` shall return an object with a non-empty `id`, `text` equal to the input, `done` equal to `false`, and `createdAt` being a valid ISO 8601 timestamp.

**Validates: Requirements 5.1**

---

### Property 10: Whitespace-only and empty task descriptions are always rejected

*For any* string `s` where `s.trim() === ""` (including the empty string, strings of spaces, tabs, or newlines), `Validators.isValidTaskText(s)` shall return `false`, and `TodoList.add(s)` shall leave the task collection unchanged.

**Validates: Requirements 5.2**

---

### Property 11: Task text edit round-trip

*For any* task `T` in the list with original text `orig`, and any valid replacement text `newText` (1–500 non-whitespace-only chars), after `TodoList.edit(T.id, newText)`, the task's `text` property shall equal `newText` and `T.id` shall be unchanged. If `newText` is whitespace-only, the task's `text` shall remain `orig`.

**Validates: Requirements 6.2, 6.3**

---

### Property 12: Completion toggle is a strict involution

*For any* task `T`, toggling its completion state twice (`TodoList.toggle(id)` called twice) shall produce a task with `done` equal to its original value. Toggling once changes `done` from `false` to `true` and from `true` to `false`.

**Validates: Requirements 7.1, 7.2**

---

### Property 13: Task deletion removes the task from the collection

*For any* task collection and any task `T` in it, after `TodoList.delete(T.id)` (with confirmation accepted), no task with `T.id` shall appear in the in-memory collection or in localStorage.

**Validates: Requirements 8.1**

---

### Property 14: Cancelling a deletion leaves the collection unchanged

*For any* task collection state and any task `T` in it, cancelling the delete confirmation shall leave the collection identical to its state before the delete control was activated.

**Validates: Requirements 8.3**

---

### Property 15: Task collection serialization round-trip

*For any* array of `Task` objects, serializing with `JSON.stringify` and deserializing with `JSON.parse` shall produce an array that is element-wise deeply equal to the original — preserving `id`, `text`, `done`, `createdAt`, and array order.

**Validates: Requirements 9.1**

---

### Property 16: URL validation correctly partitions strings

*For any* string `url`, `Validators.isValidUrl(url)` shall return `true` if and only if `url` starts with `"http://"` or `"https://"`. No other prefix shall be accepted, and the valid prefixes shall always be accepted regardless of what follows them.

**Validates: Requirements 10.3, 11.3**

---

### Property 17: Duplicate URL rejection

*For any* link collection containing a link with URL `u`, `Validators.isDuplicateUrl(u, links)` shall return `true`, and `QuickLinks.add(label, u)` shall leave the collection unchanged. *For any* URL not present in the collection, `isDuplicateUrl` shall return `false`.

**Validates: Requirements 10.4**

---

### Property 18: Link deletion removes the link from the collection

*For any* link collection and any link `L` in it, after `QuickLinks.delete(L.id)`, no link with `L.id` shall appear in the in-memory collection or in localStorage.

**Validates: Requirements 12.1**

---

### Property 19: Link collection serialization round-trip

*For any* array of `Link` objects, serializing with `JSON.stringify` and deserializing with `JSON.parse` shall produce an array that is element-wise deeply equal to the original — preserving `id`, `label`, `url`, and array order.

**Validates: Requirements 13.1**

---

### Property 20: Theme toggle is a strict involution

*For any* current theme state (`"light"` or `"dark"`), calling `ThemeManager.toggle()` twice shall return `ThemeManager.getCurrent()` to exactly its original value — the double toggle is a no-op on the observable theme.

**Validates: Requirements 17.2**

---

### Property 21: Theme init reads saved preference

*For any* value of `tld_theme` stored in `localStorage` (`"light"` or `"dark"`), calling `ThemeManager.init()` shall result in `ThemeManager.getCurrent()` returning that saved value. When `tld_theme` is absent, `ThemeManager.init()` shall apply `"dark"` if `prefers-color-scheme: dark` matches, and `"light"` in all other cases (including when the media query is unavailable).

**Validates: Requirements 17.4, 17.5, 17.6**

---

### Property 22: Greeting with name correctly concatenates

*For any* integer hour `h` in `[0, 23]` and any non-empty, non-whitespace-only name string `n` (1–50 chars), the greeting rendered by `GreetingPanel.render()` when `getName()` returns `n` shall equal `greetingFromHour(h) + ", " + n` — matching the personalised form exactly with no extra whitespace or punctuation.

**Validates: Requirements 18.3**

---

### Property 23: Empty or whitespace-only name is always rejected

*For any* string `s` where `s.trim() === ""` (empty string, spaces, tabs, newlines, or any combination), `GreetingPanel.setName(s)` shall leave the value returned by `getName()` unchanged and shall not write to `tld_displayName` in `localStorage`.

**Validates: Requirements 18.2**

---

## Error Handling

All errors fall into two categories: **user input errors** (shown inline near the relevant field) and **storage errors** (shown in a persistent notification banner).

### User Input Errors

| Trigger | Message | Behavior |
|---|---|---|
| Empty/whitespace task text | "Task description is required." | Input retains submitted value; task not added |
| Task text > 500 chars | "Task description must be 500 characters or fewer." | Submission blocked |
| Empty link label | "Link label is required." | Submission blocked |
| Empty link URL | "Link URL is required." | Submission blocked |
| Invalid URL protocol | "URL must start with http:// or https://" | Submission blocked |
| Duplicate URL | "This URL is already in your Quick Links." | Submission blocked |
| Whitespace-only task edit | "Task description cannot be empty." | Edit cancelled; original text restored |

### Storage Errors

When `localStorage` is unavailable (e.g., private-browsing quota exceeded, security policy), a non-blocking notification is shown. The application continues to work in-session with in-memory state.

| Trigger | Message |
|---|---|
| Failed write on task add | "Your task could not be saved. Changes are in-memory only." |
| Failed write on task edit | "Your change could not be saved. It is available for this session only." |
| Failed write on task toggle | "Completion state could not be saved. It is available for this session only." |
| Failed write on task delete | "Task could not be deleted. Please try again." — task is restored |
| Failed write on link add | "Your link could not be saved. Changes are in-memory only." |
| Failed write on link delete | "Link could not be deleted. Please try again." — link is restored |

### Clock Unavailability

If `new Date()` throws or returns an invalid date, `GreetingPanel` renders `"--:--"` for time, `"Date unavailable"` for the date, and `"Good Day"` for the greeting. No exception propagates.

### Malformed Storage Data

`Storage.load()` wraps `JSON.parse` in a try/catch and returns `null` on any parse failure. Both `TodoList.init()` and `QuickLinks.init()` treat `null` as an empty array and render accordingly. For Quick Links malformed data, an error message is displayed per Requirement 13.3.

---

## Testing Strategy

### Constraints

This project has no build tools and no test runner pre-configured. Testing uses **no framework dependencies in the application itself**. For the test suite, a lightweight testing environment is added only for development — it does not affect the shipped files.

**Recommended test setup (dev-only):**
- **[fast-check](https://github.com/dubzzz/fast-check)** for property-based tests (browser + Node compatible)
- **[Vitest](https://vitest.dev/)** as the test runner (run with `vitest --run` for single-pass execution)
- Tests live in a `tests/` directory and import pure functions extracted from `app.js` via named exports in a test-build shim — the shipped `app.js` remains a self-contained IIFE

Because the application ships as a zero-dependency IIFE, pure utility functions (`TimeUtil`, `Validators`, `createTask`, `formatTimerDisplay`, etc.) are **extractable and testable in isolation**. DOM-bound methods are tested with `jsdom` (provided by Vitest's `jsdom` environment).

---

### Unit Tests (example-based)

These cover specific behaviors and edge cases that don't vary across wide input ranges:

- **Timer boundary**: countdown stops at exactly 0; completion message appears
- **Timer initial state**: `FocusTimer.init()` sets display to `"25:00"`
- **Edit flow**: activating edit on a task renders an `<input>` with `maxlength="500"`
- **Delete confirmation**: activating delete shows a confirm prompt; cancelling leaves task intact
- **Link button**: `QuickLinks.open(id)` calls `window.open(url, '_blank')` with the correct URL
- **Empty storage**: `TodoList.init()` and `QuickLinks.init()` with empty localStorage render empty lists
- **Malformed storage**: both init methods silently handle unparseable JSON

---

### Property-Based Tests

Each property test uses **fast-check** and runs a minimum of **100 iterations**.

Each test is tagged with a comment referencing its design property:

```js
// Feature: todo-life-dashboard, Property 3: Greeting correctly partitions the day
```

| Property | Generator | What is asserted |
|---|---|---|
| P1: Time format correctness | Arbitrary `Date` (random ms since epoch) | `formatTime(d)` matches `/^\d{2}:\d{2}$/` with correct hour/minute values |
| P2: Date format correctness | Arbitrary `Date` | `formatDate(d)` matches `"Weekday, Month DD, YYYY"` with correct field values |
| P3: Greeting partitions day | `fc.integer({min:0, max:23})` | `greetingFromHour(h)` returns exactly the right string for each partition; no overlap |
| P4: Timer countdown arithmetic | `fc.integer({min:1, max:1500})` for S, `fc.integer({min:0})` for N ≤ S | After N ticks from S, `remaining === S - N` |
| P5: Timer button state | `fc.boolean()` (running), `fc.integer({min:0, max:1500})` (remaining) | Start/Stop disabled states are complements of each other |
| P6: Timer reset idempotence | Any timer state | After `reset()`, `remaining === 1500` and `running === false` |
| P7: Redundant Start/Stop are no-ops | Running timer state; stopped timer state | State unchanged after redundant activation |
| P8: Pause-resume preserves value | `fc.integer({min:1, max:1499})` for pause point | After stop+start without tick, `remaining` is unchanged |
| P9: Task creation validity | `fc.string({minLength:1, maxLength:500})` filtered to non-whitespace-only | `createTask(text)` returns object with correct fields |
| P10: Whitespace rejection | `fc.string()` mapped to all-whitespace (spaces, tabs, newlines) | `isValidTaskText` returns false; collection unchanged |
| P11: Task edit round-trip | Task + valid/invalid replacement text | Valid edit updates text; invalid edit restores original |
| P12: Toggle involution | Task array with arbitrary `done` states | Double-toggle restores original `done` value |
| P13: Task deletion removes task | Task array + random index to delete | After delete, id not found in collection or storage |
| P14: Cancel delete is no-op | Any task collection | Collection identical before and after cancelled delete |
| P15: Task serialization round-trip | Array of `Task` objects (arbitrary) | `JSON.parse(JSON.stringify(tasks))` deeply equals `tasks` |
| P16: URL validation partitions strings | `fc.string()` with http/https prefix variants | `isValidUrl` returns true iff starts with `http://` or `https://` |
| P17: Duplicate URL rejection | Link array + URL already in array | `isDuplicateUrl` returns true; add is rejected |
| P18: Link deletion removes link | Link array + random index to delete | After delete, id not found in collection or storage |
| P19: Link serialization round-trip | Array of `Link` objects (arbitrary) | `JSON.parse(JSON.stringify(links))` deeply equals `links` |
| P20: Theme toggle is a strict involution | `fc.constantFrom('light', 'dark')` for starting theme | `getCurrent()` equals starting theme after two `toggle()` calls |
| P21: Theme init reads saved preference | `fc.constantFrom('light', 'dark', null)` for stored value + `fc.boolean()` for system dark pref | `getCurrent()` after `init()` equals saved value; if absent, matches system pref or `'light'` fallback |
| P22: Greeting with name correctly concatenates | `fc.integer({min:0,max:23})` + `fc.string({minLength:1,maxLength:50})` filtered to non-whitespace-only | Rendered greeting equals `greetingFromHour(h) + ", " + name` |
| P23: Empty/whitespace name is always rejected | All-whitespace strings (spaces, tabs, newlines) | `getName()` unchanged after `setName(s)`; `tld_displayName` not written |

---

### Integration Tests

These verify the wiring between modules and with browser APIs. Run as single-pass examples:

- Dashboard renders all four panels on `DOMContentLoaded`
- `setInterval` is called once with ~60 000 ms for the clock
- Modifying a task persists to `localStorage` (verified via `localStorage.getItem`)
- Modifying links persists to `localStorage`
- On reload simulation (`init()` called again), previously saved tasks/links are re-rendered
- `window.open` is called with `_blank` when a link button is activated

---

### Smoke Tests (Manual / Browser)

These require a real browser and verify structural/compatibility requirements:

- Open `index.html` directly from the filesystem in Chrome, Firefox, Edge, Safari — all four panels render correctly
- No inline `<style>` or `<script>` in `index.html`
- `css/style.css` and `js/app.js` load without 404
- Initial render completes under 2 seconds on target hardware
- UI interactions respond within 100 ms
