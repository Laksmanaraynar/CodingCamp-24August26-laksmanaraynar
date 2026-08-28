# Implementation Plan: To Do List Life Dashboard

## Overview

Implement a single-page productivity dashboard using plain HTML, CSS, and vanilla JavaScript with an IIFE module pattern. The build is broken into six incremental stages: project scaffolding → shared utilities → Greeting Panel → Focus Timer → To-Do List → Quick Links → wiring and integration. Each stage produces fully working, integrated code before the next begins.

Testing uses Vitest + fast-check in a `tests/` directory with a shim that re-exports pure functions from `app.js`; the shipped files remain unaffected.

---

## Tasks

- [-] 1. Scaffold project structure and testing environment
  - Create `index.html` with semantic shell, four panel placeholders, and `<link>`/`<script>` references (no inline styles or scripts)
  - Create `css/style.css` with reset/base styles and a four-panel grid layout
  - Create `js/app.js` with the top-level IIFE stub, empty module objects (`Storage`, `TimeUtil`, `Validators`, `GreetingPanel`, `FocusTimer`, `TodoList`, `QuickLinks`), and the `init()` bootstrap wired to `DOMContentLoaded`
  - Add `package.json` with `vitest` and `fast-check` as dev dependencies; configure Vitest with the `jsdom` environment
  - Create `tests/shim.js` that re-exports pure functions from `app.js` for isolated testing
  - _Requirements: 14.1, 14.2, 14.3, 14.5, 15.1, 15.2_

- [ ] 2. Implement shared utilities
  - [-] 2.1 Implement `Storage` — `save(key, value)` and `load(key)` with JSON serialization, graceful null return on parse failure, and `StorageError` throw on write failure
    - _Requirements: 9.3, 13.3_
  - [-] 2.2 Implement `TimeUtil` — `formatTime(date)`, `formatDate(date)`, `greetingFromHour(hour)` pure functions
    - _Requirements: 1.1, 1.3, 2.1, 2.2, 2.3_
  - [-] 2.3 Implement `Validators` — `isValidTaskText`, `isValidLinkLabel`, `isValidUrl`, `isDuplicateUrl` pure functions
    - _Requirements: 5.2, 5.3, 6.3, 10.2, 10.3, 10.4_
  - [ ]* 2.4 Write property tests for `TimeUtil` (Properties 1, 2, 3)
    - **Property 1: Time format correctness** — arbitrary `Date`, assert `formatTime` output matches `HH:MM` with correct values
    - **Property 2: Date format correctness** — arbitrary `Date`, assert `formatDate` output matches `"Weekday, Month DD, YYYY"`
    - **Property 3: Greeting correctly partitions the day** — `fc.integer({min:0,max:23})`, assert exactly one greeting per hour with no overlap
    - **Validates: Requirements 1.1, 1.3, 2.1, 2.2, 2.3**
  - [ ]* 2.5 Write property tests for `Validators` (Properties 10, 16, 17)
    - **Property 10: Whitespace-only and empty task descriptions are always rejected** — all-whitespace strings, assert `isValidTaskText` returns false
    - **Property 16: URL validation correctly partitions strings** — arbitrary strings with/without http/https prefix, assert `isValidUrl` return value
    - **Property 17: Duplicate URL rejection** — link array with a known URL, assert `isDuplicateUrl` returns true; unknown URL returns false
    - **Validates: Requirements 5.2, 10.3, 10.4**

- [ ] 3. Implement Greeting Panel
  - [~] 3.1 Implement `GreetingPanel.render()` — reads current `Date`, writes to `#greeting-time`, `#greeting-date`, `#greeting-message`; renders `"--:--"` / `"Date unavailable"` / `"Good Day"` if `Date()` throws or returns invalid
    - _Requirements: 1.1, 1.3, 1.4, 2.1, 2.2, 2.3, 2.5_
  - [~] 3.2 Implement `GreetingPanel.init()` — calls `render()` immediately and starts a single shared 60-second `setInterval` for subsequent ticks; tick also updates greeting if a time-of-day boundary has crossed
    - _Requirements: 1.2, 2.4_
  - [~] 3.3 Add `#greeting-time`, `#greeting-date`, `#greeting-message` DOM targets to `index.html` and wire into `init()`
    - _Requirements: 14.3_

- [~] 4. Checkpoint — Verify Greeting Panel
  - Ensure greeting panel renders correct time, date, and greeting on page load. Ensure all tests written so far pass. Ask the user if questions arise.

- [ ] 5. Implement Focus Timer
  - [~] 5.1 Implement `FocusTimer` state (`remaining`, `running`, `intervalId`) and `formatTimerDisplay(seconds)` pure helper
    - _Requirements: 3.1_
  - [~] 5.2 Implement `FocusTimer.render()` — updates `#timer-display` in `MM:SS` format and sets `#btn-start` / `#btn-stop` enabled states as strict complements; shows session-complete message in `#timer-status` when `remaining === 0`
    - _Requirements: 3.1, 3.3, 3.4, 3.5_
  - [~] 5.3 Implement `FocusTimer.tick()`, `FocusTimer.start()`, `FocusTimer.stop()`, `FocusTimer.reset()` with correct state transitions; ignore redundant start/stop activations; `reset()` always produces `remaining === 1500, running === false`
    - _Requirements: 3.2, 3.6, 3.7, 4.1, 4.2, 4.3, 4.5, 4.6_
  - [~] 5.4 Implement `FocusTimer.init()`, add `#timer-display`, `#btn-start`, `#btn-stop`, `#btn-reset`, `#timer-status` to `index.html`, and attach event listeners
    - _Requirements: 4.4, 14.3_
  - [ ]* 5.5 Write property tests for `FocusTimer` pure logic (Properties 4, 5, 6, 7, 8)
    - **Property 4: Timer countdown arithmetic** — `fc.integer({min:1,max:1500})` for S, `fc.nat()` for N ≤ S, assert `remaining === S - N` after N ticks
    - **Property 5: Timer button state reflects running state** — `fc.boolean()` + `fc.integer({min:0,max:1500})`, assert Start/Stop disabled states are strict complements
    - **Property 6: Timer reset is unconditionally idempotent** — arbitrary timer state, assert `remaining === 1500` and `running === false` after `reset()`
    - **Property 7: Redundant Start/Stop are no-ops** — running state → start again; stopped state → stop again; assert state unchanged
    - **Property 8: Timer pause-resume preserves countdown value** — `fc.integer({min:1,max:1499})`, assert `remaining` unchanged after stop+start without tick
    - **Validates: Requirements 3.2, 3.4, 3.5, 3.7, 4.3, 4.5, 4.6**

- [~] 6. Checkpoint — Verify Focus Timer
  - Ensure timer renders 25:00 on load, Start/Stop/Reset controls work correctly, and all tests pass. Ask the user if questions arise.

- [ ] 7. Implement To-Do List
  - [~] 7.1 Implement `createTask(text)` pure helper returning `{ id, text, done: false, createdAt }` using `crypto.randomUUID()` with `Math.random()` fallback
    - _Requirements: 5.1_
  - [ ]* 7.2 Write property test for `createTask` (Property 9)
    - **Property 9: Task creation produces a valid Task object** — `fc.string({minLength:1,maxLength:500})` filtered to non-whitespace-only, assert correct fields
    - **Validates: Requirements 5.1**
  - [~] 7.3 Implement `TodoList.init()` — loads from `tld_tasks` via `Storage.load()`, treats null as empty array, renders; handles malformed JSON silently
    - _Requirements: 9.1, 9.2, 9.3_
  - [~] 7.4 Implement `TodoList.persist()` — writes `tasks` array to `tld_tasks`; on `StorageError` shows appropriate inline error message
    - _Requirements: 5.4, 5.5, 6.4, 7.3, 7.4_
  - [~] 7.5 Implement `TodoList.add(text)` — validates with `Validators.isValidTaskText`, creates task, prepends to array, calls `persist()`, calls `render()`; on empty/whitespace shows "Task description is required." and retains input value; on >500 chars shows character-limit message
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  - [ ]* 7.6 Write property tests for task add/edit/toggle/delete (Properties 10, 11, 12, 13, 14)
    - **Property 10: Whitespace-only rejected by `TodoList.add`** — all-whitespace strings, assert collection unchanged
    - **Property 11: Task edit round-trip** — valid/invalid replacement text, assert text updated or original restored
    - **Property 12: Completion toggle is a strict involution** — arbitrary `done` states, assert double-toggle restores original
    - **Property 13: Task deletion removes the task** — arbitrary task array + random index, assert id absent after delete
    - **Property 14: Cancelling deletion leaves collection unchanged** — assert collection identical before/after cancelled delete
    - **Validates: Requirements 5.2, 6.2, 6.3, 7.1, 7.2, 8.1, 8.3**
  - [~] 7.7 Implement `TodoList.edit(id, newText)` — in-place editing with `maxlength="500"`, validates new text, updates task, calls `persist()` and `render()`; on whitespace shows error and restores original
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [~] 7.8 Implement `TodoList.toggle(id)` — flips `done` state, applies/removes strikethrough class, calls `persist()` and `render()`
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  - [~] 7.9 Implement `TodoList.delete(id)` — shows confirmation prompt; on confirm removes task, calls `persist()`, calls `render()`; on cancel leaves list unchanged; on storage failure shows error and restores task
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  - [~] 7.10 Implement `TodoList.render()` — full re-render of `#todo-list`; add `#todo-input`, `#todo-add-btn`, `#todo-list`, `#todo-error` to `index.html` and wire event listeners
    - _Requirements: 9.1, 14.3, 16.2_
  - [ ]* 7.11 Write property test for task serialization round-trip (Property 15)
    - **Property 15: Task collection serialization round-trip** — arbitrary `Task` arrays, assert `JSON.parse(JSON.stringify(tasks))` deeply equals `tasks`
    - **Validates: Requirements 9.1**

- [~] 8. Checkpoint — Verify To-Do List
  - Ensure add/edit/toggle/delete all work, tasks persist across simulated reload, error states display correctly, and all tests pass. Ask the user if questions arise.

- [ ] 9. Implement Quick Links
  - [~] 9.1 Implement `QuickLinks.init()` — loads from `tld_links` via `Storage.load()`, treats null as empty array, renders; on malformed data shows "saved links could not be loaded" message
    - _Requirements: 13.1, 13.2, 13.3_
  - [~] 9.2 Implement `QuickLinks.persist()` — writes `links` array to `tld_links`; on `StorageError` shows appropriate error message
    - _Requirements: 10.1, 12.2, 12.3_
  - [~] 9.3 Implement `QuickLinks.add(label, url)` — validates with `isValidLinkLabel`, `isValidUrl`, `isDuplicateUrl`; on success creates link, appends, calls `persist()` and `render()`; on failure shows specific validation message without adding link
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  - [~] 9.4 Implement `QuickLinks.open(id)` — calls `window.open(url, '_blank')`; if URL empty or missing, button is disabled with visual indicator; if URL lacks http/https prefix, shows error and does not open
    - _Requirements: 11.1, 11.2, 11.3_
  - [~] 9.5 Implement `QuickLinks.delete(id)` — removes link immediately from displayed collection, calls `persist()`; on storage failure shows error and restores link to original position
    - _Requirements: 12.1, 12.2, 12.3_
  - [~] 9.6 Implement `QuickLinks.render()` — renders `#links-list` with label buttons and delete controls; add `#links-label-input`, `#links-url-input`, `#links-add-btn`, `#links-list`, `#links-error` to `index.html` and wire event listeners
    - _Requirements: 13.1, 14.3, 16.2_
  - [ ]* 9.7 Write property tests for Quick Links (Properties 16, 17, 18, 19)
    - **Property 16: URL validation correctly partitions strings** — already covered in 2.5; verify `QuickLinks.add` rejects non-http/https URLs
    - **Property 17: Duplicate URL rejection via `QuickLinks.add`** — link array with known URL, assert collection unchanged
    - **Property 18: Link deletion removes the link** — arbitrary link array + random index, assert id absent after delete
    - **Property 19: Link collection serialization round-trip** — arbitrary `Link` arrays, assert `JSON.parse(JSON.stringify(links))` deeply equals `links`
    - **Validates: Requirements 10.3, 10.4, 12.1, 13.1**

- [~] 10. Checkpoint — Verify Quick Links
  - Ensure add/open/delete all work, links persist across simulated reload, duplicate/invalid URL errors display, and all tests pass. Ask the user if questions arise.

- [ ] 11. Wire everything together and polish
  - [~] 11.1 Finalize `init()` — call `GreetingPanel.init()`, `FocusTimer.init()`, `TodoList.init()`, `QuickLinks.init()` in sequence on `DOMContentLoaded`
    - _Requirements: 14.3_
  - [~] 11.2 Apply responsive CSS layout — ensure all four panels render correctly side-by-side (or stacked on narrow viewports) in Chrome, Firefox, Edge, and Safari
    - _Requirements: 15.1, 15.2_
  - [~] 11.3 Add unsupported-browser detection — on load, check User-Agent or feature-detect; if browser is not a recognized modern target, display a banner indicating it may not be fully supported
    - _Requirements: 15.3_
  - [ ]* 11.4 Write integration tests for module wiring
    - Test that `DOMContentLoaded` triggers all four `init()` calls
    - Test that `setInterval` is called once for the 60-second clock
    - Test that modifying a task writes to `localStorage` (`tld_tasks` key)
    - Test that modifying a link writes to `localStorage` (`tld_links` key)
    - Test that calling `init()` again re-renders previously saved tasks and links
    - Test that activating a link button calls `window.open` with `_blank`
    - _Requirements: 1.2, 5.4, 10.1, 13.1_

- [~] 12. Final checkpoint — Pre-theme verification
  - Run `vitest --run` and confirm all tests pass up to this point. Verify Quick Links, To-Do List, Focus Timer, and Greeting Panel all work correctly. Ask the user if questions arise.

- [ ] 13. Implement ThemeManager (Light / Dark Mode)
  - [~] 13.1 Implement `ThemeManager.apply(theme)` — sets `document.documentElement.setAttribute('data-theme', theme)`; all CSS colours must use custom properties driven by `[data-theme]` selectors so a single attribute flip applies the theme universally
    - _Requirements: 17.1, 17.2_
  - [~] 13.2 Implement `ThemeManager.getCurrent()` — returns `document.documentElement.getAttribute('data-theme') || 'light'`
    - _Requirements: 17.2_
  - [~] 13.3 Implement `ThemeManager.init()` — reads `tld_theme` from `Storage`; if present, calls `apply()` with saved value; if absent, checks `window.matchMedia('(prefers-color-scheme: dark)')`; if that matches applies `'dark'`; otherwise falls back to `'light'`; called before initial render to prevent theme flash
    - _Requirements: 17.4, 17.5, 17.6_
  - [~] 13.4 Implement `ThemeManager.toggle()` — reads current theme via `getCurrent()`, flips to opposite, calls `apply()`, persists new value to `tld_theme` via `Storage.save()`
    - _Requirements: 17.2, 17.3_
  - [~] 13.5 Add `#theme-toggle-btn` to `index.html`; attach click handler calling `ThemeManager.toggle()`; update button label/icon to reflect the current theme after each toggle; call `ThemeManager.init()` at the top of the main `init()` function before other modules initialise
    - _Requirements: 17.1, 17.2, 17.3, 14.3_
  - [~] 13.6 Update `css/style.css` — replace all hard-coded colour values with CSS custom properties; add `:root[data-theme="light"]` and `:root[data-theme="dark"]` variable blocks covering background, text, surface, border, and accent colours; verify WCAG 4.5:1 minimum contrast ratio in both themes for all text and interactive elements
    - _Requirements: 17.7_
  - [ ]* 13.7 Write property tests for `ThemeManager` (Properties 20, 21)
    - **Property 20: Theme toggle is a strict involution** — `fc.constantFrom('light', 'dark')` for starting theme; call `toggle()` twice; assert `getCurrent()` equals original value
    - **Property 21: Theme init reads saved preference** — `fc.constantFrom('light', 'dark', null)` for stored value + `fc.boolean()` for system dark pref; assert `getCurrent()` after `init()` equals saved value; if absent matches system pref or `'light'` fallback
    - **Validates: Requirements 17.2, 17.4, 17.5, 17.6**

- [ ] 14. Implement Custom Name in Greeting
  - [~] 14.1 Extend `GreetingPanel.render()` — reads `tld_displayName` via `Storage.load('tld_displayName')`; if non-empty and non-whitespace-only, appends `", [Name]"` to the greeting string (e.g. `"Good Morning, Alex"`); if absent or empty renders the greeting without a name suffix, preserving existing behaviour
    - _Requirements: 18.3, 18.5, 18.6_
  - [~] 14.2 Implement `GreetingPanel.getName()` — returns `Storage.load('tld_displayName') || ''`
    - _Requirements: 18.5_
  - [~] 14.3 Implement `GreetingPanel.setName(name)` — validates that `name.trim().length >= 1` and `name.trim().length <= 50`; on valid: trims the value, persists to `tld_displayName` via `Storage.save()`, calls `render()`; on invalid (empty or whitespace-only): shows `"Name cannot be blank."` in `#greeting-name-error` and does not update storage; on storage failure: retains name in session and shows appropriate error message
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.8_
  - [~] 14.4 Implement `GreetingPanel.clearName()` — removes `tld_displayName` from Storage (write empty string or remove key), calls `render()` so greeting reverts to nameless form
    - _Requirements: 18.7_
  - [~] 14.5 Add `#greeting-name-input` (`maxlength="50"`), `#greeting-name-btn` (save/set action), and `#greeting-name-error` to `index.html` inside the Greeting Panel; attach event listener on `#greeting-name-btn` to call `GreetingPanel.setName()`; attach a separate clear control that calls `GreetingPanel.clearName()`; restore saved name into the input on page load if `tld_displayName` is present
    - _Requirements: 18.1, 18.5, 14.3_
  - [ ]* 14.6 Write property tests for name personalisation (Properties 22, 23)
    - **Property 22: Greeting with name correctly concatenates** — `fc.integer({min:0,max:23})` + `fc.string({minLength:1,maxLength:50})` filtered to non-whitespace-only; assert rendered greeting equals `greetingFromHour(h) + ", " + name` exactly with no extra whitespace or punctuation
    - **Property 23: Empty/whitespace name is always rejected** — all-whitespace strings (spaces, tabs, newlines); assert `getName()` is unchanged after `setName(s)` and `tld_displayName` is not written to localStorage
    - **Validates: Requirements 18.2, 18.3**

- [~] 15. Final checkpoint — Full verification
  - Run `vitest --run` and confirm all tests pass including ThemeManager and name personalisation. Verify `index.html` has no inline `<style>` or `<script>` blocks. Confirm `css/style.css` and `js/app.js` are the only stylesheet and script files loaded. Confirm both light and dark themes render correctly and the greeting name persists across reload. Ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at every major stage
- Property tests validate universal correctness properties; unit tests validate specific examples and edge cases
- The shipped `app.js` remains a self-contained IIFE — the `tests/shim.js` re-exports pure functions for testing only
- Run tests with `vitest --run` (single-pass, no watch mode)

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3"] },
    { "id": 2, "tasks": ["2.4", "2.5", "3.1"] },
    { "id": 3, "tasks": ["3.2"] },
    { "id": 4, "tasks": ["3.3", "5.1"] },
    { "id": 5, "tasks": ["5.2", "5.3"] },
    { "id": 6, "tasks": ["5.4", "7.1"] },
    { "id": 7, "tasks": ["5.5", "7.2", "7.3", "7.4"] },
    { "id": 8, "tasks": ["7.5", "9.1"] },
    { "id": 9, "tasks": ["7.6", "7.7", "7.8", "7.9", "9.2"] },
    { "id": 10, "tasks": ["7.10", "9.3", "9.4", "9.5"] },
    { "id": 11, "tasks": ["7.11", "9.6"] },
    { "id": 12, "tasks": ["9.7", "11.1"] },
    { "id": 13, "tasks": ["11.2", "11.3"] },
    { "id": 14, "tasks": ["11.4"] },
    { "id": 15, "tasks": ["13.1", "13.2", "14.1", "14.2"] },
    { "id": 16, "tasks": ["13.3", "13.4", "14.3", "14.4"] },
    { "id": 17, "tasks": ["13.5", "13.6", "14.5"] },
    { "id": 18, "tasks": ["13.7", "14.6"] }
  ]
}
```
