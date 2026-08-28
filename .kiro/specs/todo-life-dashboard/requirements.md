# Requirements Document

## Introduction

The To Do List Life Dashboard is a client-side web application that serves as a personal productivity hub. It combines a greeting panel with live time and date, a Pomodoro-style Focus Timer, a persistent To-Do List, and a Quick Links launcher — all running in a single HTML page with no backend. All user data persists in the browser's Local Storage so the dashboard works across page reloads without any account or server setup.

## Glossary

- **Dashboard**: The single-page web application described in this document.
- **Greeting_Panel**: The UI section that displays the current time, date, and a time-based greeting message.
- **Focus_Timer**: The UI section containing the 25-minute countdown timer and its controls.
- **Todo_List**: The UI section that manages the collection of user tasks.
- **Task**: A single item in the Todo_List with a text description and a completion state (done / not done).
- **Quick_Links**: The UI section that stores and displays user-defined shortcut buttons to external URLs.
- **Link**: A single Quick Links entry consisting of a label and a URL.
- **Storage**: The browser's `localStorage` API used for client-side persistence.
- **Modern_Browser**: Chrome (latest), Firefox (latest), Edge (latest), or Safari (latest).
- **Theme_Toggle**: The UI control that switches the Dashboard between the light color theme and the dark color theme.
- **Display_Name**: The user-provided name string stored in Storage and shown as a personalised suffix in the greeting message.

---

## Requirements

### Requirement 1: Greeting Panel — Live Time and Date

**User Story:** As a user, I want to see the current time and date when I open the dashboard, so that I have an immediate awareness of the moment without switching tabs.

#### Acceptance Criteria

1. WHEN the Dashboard is loaded, THE Greeting_Panel SHALL display the current time in HH:MM format (24-hour or 12-hour with AM/PM) using the user's local system clock.
2. WHILE the Dashboard is open, THE Greeting_Panel SHALL update the displayed time every 60 seconds without requiring a page reload, such that the displayed time never differs from the user's local system clock by more than 60 seconds.
3. WHEN the Dashboard is loaded, THE Greeting_Panel SHALL display the current date in the format "Weekday, Month DD, YYYY" (e.g., "Monday, August 26, 2026") using the user's local system clock.
4. IF the user's local system clock is unavailable, THEN THE Greeting_Panel SHALL display a placeholder indicating that the time and date cannot be retrieved, and shall not display a stale or incorrect value.

---

### Requirement 2: Greeting Panel — Time-Based Greeting

**User Story:** As a user, I want to receive a greeting that matches the time of day, so that the dashboard feels personal and contextual.

#### Acceptance Criteria

1. WHEN the Dashboard is loaded and the local time is between 00:00 and 11:59, THE Greeting_Panel SHALL display the message "Good Morning".
2. WHEN the Dashboard is loaded and the local time is between 12:00 and 17:59, THE Greeting_Panel SHALL display the message "Good Afternoon".
3. WHEN the Dashboard is loaded and the local time is between 18:00 and 23:59, THE Greeting_Panel SHALL display the message "Good Evening".
4. WHEN the local time crosses a time-of-day boundary (00:00, 12:00, or 18:00) WHILE the Dashboard is open, THE Greeting_Panel SHALL update the greeting message within 60 seconds of the boundary crossing.
5. IF the local time cannot be determined, THEN THE Greeting_Panel SHALL display the message "Good Day" as a fallback.

---

### Requirement 3: Focus Timer — Countdown Behaviour

**User Story:** As a user, I want a 25-minute countdown timer, so that I can work in focused Pomodoro sessions.

#### Acceptance Criteria

1. WHEN the Dashboard is loaded, THE Focus_Timer SHALL display an initial countdown of 25:00 (minutes:seconds).
2. WHEN the user activates the Start control, THE Focus_Timer SHALL decrement the countdown by one second at each one-second interval, with each displayed value accurate to within ±50 milliseconds of the elapsed wall-clock time.
3. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL stop automatically and display a visible status message in the Dashboard indicating the session is complete.
4. WHILE the Focus_Timer is running, THE Focus_Timer SHALL disable the Start control and enable the Stop control.
5. WHILE the Focus_Timer is stopped and the countdown has not reached 00:00, THE Focus_Timer SHALL enable the Start control and disable the Stop control.
6. WHEN the user activates the Stop control, THE Focus_Timer SHALL stop decrementing the countdown and retain the current countdown value.
7. IF the Focus_Timer is stopped and the countdown has not reached 00:00, THEN the Focus_Timer SHALL resume decrementing from the retained countdown value when the user next activates the Start control.

---

### Requirement 4: Focus Timer — Controls

**User Story:** As a user, I want Start, Stop, and Reset controls for the timer, so that I can manage my work sessions flexibly.

#### Acceptance Criteria

1. WHEN the user activates the Start control while the Focus_Timer is stopped or paused, THE Focus_Timer SHALL begin or resume the countdown from the current displayed value.
2. WHEN the user activates the Stop control while the Focus_Timer is running, THE Focus_Timer SHALL pause the countdown at the current value.
3. WHEN the user activates the Reset control, THE Focus_Timer SHALL stop any running countdown and restore the display to 25:00.
4. THE Focus_Timer SHALL provide three distinct controls labelled "Start", "Stop", and "Reset".
5. IF the user activates the Start control while the Focus_Timer is already running, THEN THE Focus_Timer SHALL ignore the activation and continue the countdown unchanged.
6. IF the user activates the Stop control while the Focus_Timer is already stopped or paused, THEN THE Focus_Timer SHALL ignore the activation and retain the current displayed value.

---

### Requirement 5: To-Do List — Task Creation

**User Story:** As a user, I want to add tasks to my to-do list, so that I can track the things I need to do.

#### Acceptance Criteria

1. WHEN the user submits a non-empty task description via the task input, THE Todo_List SHALL add a new Task with that description, a unique identifier, a creation timestamp, and a "not done" state.
2. IF the user submits an empty or whitespace-only task description, THEN THE Todo_List SHALL reject the submission, display a validation message indicating that the task description is required, and leave the task input field populated with the submitted value.
3. IF the task description exceeds 500 characters, THEN THE Todo_List SHALL reject the submission and display a validation message indicating the character limit.
4. WHEN a new Task is added, THE Todo_List SHALL persist the updated task collection to Storage immediately, before confirming the addition to the user.
5. IF Storage is unavailable when persisting a new Task, THEN THE Todo_List SHALL display an error message indicating that the task could not be saved and shall not add the Task to the displayed task collection.

---

### Requirement 6: To-Do List — Task Editing

**User Story:** As a user, I want to edit an existing task's description, so that I can correct or update what I wrote.

#### Acceptance Criteria

1. WHEN the user activates the edit control on a Task, THE Todo_List SHALL make the Task description editable in place, with a maximum input length of 500 characters.
2. WHEN the user confirms an edit with a non-empty, non-whitespace-only description of 1 to 500 characters, THE Todo_List SHALL update the Task description and persist the change to Storage within 1 second.
3. IF the user confirms an edit with an empty or whitespace-only description, THEN THE Todo_List SHALL reject the change, restore the original Task description, and display an error message indicating the description cannot be empty.
4. IF Storage is unavailable when the Todo_List attempts to persist an edited Task description, THEN THE Todo_List SHALL retain the updated description in the current session and display an error message indicating the change could not be saved.

---

### Requirement 7: To-Do List — Task Completion

**User Story:** As a user, I want to mark tasks as done, so that I can track my progress.

#### Acceptance Criteria

1. WHEN the user activates the completion toggle on a Task with state "not done", THE Todo_List SHALL change the Task state to "done" and apply a strikethrough to the task text and mark the checkbox as checked.
2. WHEN the user activates the completion toggle on a Task with state "done", THE Todo_List SHALL change the Task state to "not done" and remove the strikethrough and uncheck the checkbox.
3. WHEN a Task completion state changes, THE Todo_List SHALL persist the updated task collection to Storage within 2 seconds.
4. IF Storage is unavailable when persisting a Task completion state change, THEN THE Todo_List SHALL retain the updated state in the current session and display an error message indicating the change could not be saved.

---

### Requirement 8: To-Do List — Task Deletion

**User Story:** As a user, I want to delete tasks I no longer need, so that my list stays clean and relevant.

#### Acceptance Criteria

1. WHEN the user activates the delete control on a Task, THE Todo_List SHALL remove that Task from the list and persist the updated task collection to Storage immediately.
2. WHEN the user activates the delete control on a Task, THE Todo_List SHALL display a confirmation prompt before performing the deletion.
3. IF the user cancels the confirmation prompt, THEN THE Todo_List SHALL retain the Task in the list unchanged.
4. IF the Storage write fails after deletion, THEN THE Todo_List SHALL display an error message indicating the Task could not be deleted and restore the Task to its previous position in the list.

---

### Requirement 9: To-Do List — Persistence Across Reloads

**User Story:** As a user, I want my tasks to survive a page reload, so that I don't lose work when I close and reopen the browser tab.

#### Acceptance Criteria

1. WHEN the Dashboard is loaded, THE Todo_List SHALL read the task collection from Storage and render all previously saved Tasks, preserving each Task's title, completion status, and order.
2. IF Storage contains no task data, THEN THE Todo_List SHALL render an empty list without error.
3. IF Storage contains malformed or unreadable task data, THEN THE Todo_List SHALL render an empty list and discard the corrupted data without error.
4. WHEN a Task is added, removed, or its completion status is changed, THE Todo_List SHALL write the updated task collection to Storage before the next user interaction is accepted.

---

### Requirement 10: Quick Links — Link Creation

**User Story:** As a user, I want to save my favourite website URLs as labelled buttons, so that I can open them with one click.

#### Acceptance Criteria

1. WHEN the user submits a Link with a non-empty label (up to 100 characters) and a valid URL, THE Quick_Links SHALL add a new Link button and persist the updated link collection to Storage within 2 seconds.
2. IF the user submits a Link with an empty label or an empty URL, THEN THE Quick_Links SHALL reject the submission and display a validation message without adding a Link.
3. IF the user submits a Link with a URL that does not begin with "http://" or "https://", THEN THE Quick_Links SHALL reject the submission and display a validation message indicating the URL format requirement.
4. IF the user submits a Link with a URL that already exists in the Quick_Links collection, THEN THE Quick_Links SHALL reject the submission and display a validation message indicating the duplicate URL.
5. IF Storage is unavailable when persisting a new Link, THEN THE Quick_Links SHALL display an error message and shall not add the Link button to the displayed collection.

---

### Requirement 11: Quick Links — Opening Links

**User Story:** As a user, I want each Quick Link button to open the saved website, so that I can navigate there instantly.

#### Acceptance Criteria

1. WHEN the user activates a Link button, THE Quick_Links SHALL open the associated URL in a new browser tab.
2. IF a Link button has no associated URL or an empty URL, THEN THE Quick_Links SHALL disable the button and display a visual indicator indicating no URL is configured.
3. IF the user activates a Link button whose associated URL does not begin with "http://" or "https://", THEN THE Quick_Links SHALL not open the URL and shall display an error message indicating the URL is invalid.

---

### Requirement 12: Quick Links — Link Deletion

**User Story:** As a user, I want to remove Quick Links I no longer use, so that my launcher stays tidy.

#### Acceptance Criteria

1. WHEN the user activates the delete control on a Link, THE Quick_Links SHALL remove that Link from the displayed collection immediately.
2. WHEN the user activates the delete control on a Link, THE Quick_Links SHALL persist the updated link collection to Storage within 2 seconds.
3. IF Storage is unavailable when persisting the updated link collection, THEN THE Quick_Links SHALL display an error message indicating the deletion could not be saved and restore the deleted Link to its original position in the displayed collection.

---

### Requirement 13: Quick Links — Persistence Across Reloads

**User Story:** As a user, I want my Quick Links to survive a page reload, so that I don't have to re-enter them each session.

#### Acceptance Criteria

1. WHEN the Dashboard is loaded, THE Quick_Links SHALL read the link collection from Storage and render all previously saved Links, displaying each Link's label and URL.
2. IF Storage contains no link data, THEN THE Quick_Links SHALL render an empty link panel without error.
3. IF Storage contains malformed or unreadable link data, THEN THE Quick_Links SHALL discard the corrupted data, render an empty link panel, and display an error message indicating that saved links could not be loaded.
4. WHEN a Link is added or removed, THE Quick_Links SHALL persist the updated link collection to Storage before the operation is considered complete.

---

### Requirement 14: File Structure Constraints

**User Story:** As a developer, I want a single CSS file and a single JavaScript file, so that the project stays simple and maintainable.

#### Acceptance Criteria

1. THE Dashboard SHALL load all styles from exactly one CSS file located at `css/style.css`.
2. THE Dashboard SHALL load all application logic from exactly one JavaScript file located at `js/app.js`.
3. THE Dashboard SHALL consist of a single HTML entry point file (`index.html`) that references the CSS and JavaScript files above.
4. IF the CSS or JavaScript file fails to load, THEN THE Dashboard SHALL display a visible error message in the browser console indicating which file could not be loaded.
5. THE Dashboard SHALL NOT contain any inline `<style>` blocks or inline `<script>` blocks in `index.html`; all styles and logic SHALL reside in `css/style.css` and `js/app.js` respectively.

---

### Requirement 15: Browser Compatibility

**User Story:** As a user, I want the dashboard to work in any modern browser, so that I can use it regardless of my preferred browser.

#### Acceptance Criteria

1. THE Dashboard SHALL render and function correctly on the latest stable release of Chrome, Firefox, Edge, and Safari without requiring browser extensions or plugins.
2. THE Dashboard SHALL use only Web APIs that are natively supported in the latest stable release of Chrome, Firefox, Edge, and Safari without polyfills or transpilation steps.
3. IF the Dashboard is opened in a browser that is not the latest stable release of Chrome, Firefox, Edge, or Safari, THEN the Dashboard SHALL display a message indicating that the browser may not be fully supported.

---

### Requirement 16: Performance

**User Story:** As a user, I want the dashboard to respond quickly to my interactions, so that it feels snappy and does not interrupt my flow.

#### Acceptance Criteria

1. WHEN the Dashboard is loaded on a local filesystem on a computer with at least a dual-core 2GHz CPU and 4GB RAM running a Modern_Browser, THE Dashboard SHALL complete initial render within 2 seconds.
2. WHEN the user interacts with any control (add, edit, delete, toggle, timer buttons), THE Dashboard SHALL reflect the change in the UI within 100 milliseconds.
3. IF the Todo_List or Quick_Links contains more than 500 entries, THEN THE Dashboard SHALL complete the initial render within 5 seconds on the hardware specification in criterion 1.

---

### Requirement 17: Light / Dark Mode

**User Story:** As a user, I want to toggle between a light and dark color theme, so that I can use the dashboard comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE Dashboard SHALL display a Theme_Toggle control that is visible and accessible in all four panels at all times.
2. WHEN the user activates the Theme_Toggle, THE Dashboard SHALL switch the active color theme between the light theme and the dark theme immediately, applying the change to all panels simultaneously.
3. WHEN the user activates the Theme_Toggle, THE Dashboard SHALL persist the selected theme preference to Storage immediately so that the preference survives a page reload.
4. WHEN the Dashboard is loaded and Storage contains a saved theme preference, THE Dashboard SHALL apply the saved theme before the initial render completes, with no flash of an incorrect theme.
5. WHEN the Dashboard is loaded and Storage contains no saved theme preference, THE Dashboard SHALL apply the theme that matches the operating system's preferred color scheme, as indicated by the `prefers-color-scheme` media query.
6. IF the `prefers-color-scheme` media query is unavailable or returns no preference, THEN THE Dashboard SHALL apply the light theme as the default.
7. WHILE either the light or the dark theme is active, THE Dashboard SHALL ensure that all text and interactive elements meet a minimum contrast ratio of 4.5:1 against their background, as defined by WCAG 2.1 Level AA.

---

### Requirement 18: Custom Name in Greeting

**User Story:** As a user, I want to enter my name so that the greeting message addresses me personally, so that the dashboard feels like it belongs to me.

#### Acceptance Criteria

1. THE Greeting_Panel SHALL provide a control that allows the user to set a Display_Name of 1 to 50 characters.
2. IF the user submits a Display_Name that is empty or contains only whitespace characters, THEN THE Greeting_Panel SHALL reject the submission and display a validation message indicating that the name cannot be blank.
3. WHEN the user saves a non-empty, non-whitespace-only Display_Name, THE Greeting_Panel SHALL update the greeting message to the form "[Greeting], [Display_Name]" (e.g., "Good Morning, Alex") immediately, without requiring a page reload.
4. WHEN the user saves a Display_Name, THE Greeting_Panel SHALL persist the value to Storage immediately so that the name survives a page reload.
5. WHEN the Dashboard is loaded and Storage contains a saved Display_Name, THE Greeting_Panel SHALL restore the Display_Name and render the personalised greeting form on the initial render.
6. WHEN the Dashboard is loaded and Storage contains no saved Display_Name, THE Greeting_Panel SHALL render the greeting without a name suffix, preserving the existing greeting behavior.
7. WHEN the user clears the Display_Name field and saves the change, THE Greeting_Panel SHALL remove the Display_Name from Storage and revert the greeting message to the nameless form (e.g., "Good Morning").
8. IF Storage is unavailable when persisting the Display_Name, THEN THE Greeting_Panel SHALL retain the entered name for the current session and display an error message indicating that the name could not be saved.
