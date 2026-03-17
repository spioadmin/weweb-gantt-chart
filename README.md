# Gantt – Anstehende Punkte (WeWeb Component)

A custom WeWeb Gantt chart component for displaying **projects and tasks** on a timeline. It supports four grouping views (Projects, Project level, Trades, Employee–Trades), filter dropdowns, a task/project detail popup, and a configurable loading overlay. Built for German-language project management UIs (labels and placeholders are in German).

---

## Table of Contents

- [What the component does](#what-the-component-does)
- [File structure](#file-structure)
- [Data sources and shapes](#data-sources-and-shapes)
- [WeWeb properties](#weweb-properties)
- [Trigger events](#trigger-events)
- [Behaviour details](#behaviour-details)
- [Installation and build](#installation-and-build)

---

## What the component does

- **Timeline**: Renders tasks (or projects) as horizontal bars between `startdatum`/`created_at` and `deadline`. Time scale can be **Day**, **Week**, or **Month**; users can move the visible period with ‹ › controls.
- **Four views** (tabs): Each view groups rows differently and shows the relevant filter(s).
  - **Projekte**: One bar per **project** (from `projekteData`), from `created_at` to `deadline`. If `projekteData` is empty, falls back to task-level data grouped by project.
  - **Projektebene**: Tasks grouped by **phase** (`phase_id` / `phase_name`). Filter: Phase (single select) and Projekt (multi).
  - **Gewerke**: Tasks grouped by **trade** (`gewerk_id` / `gewerk_name`). Filter: Gewerke (multi, with “Ohne Gewerk” option).
  - **Mitarbeiter-Gewerke**: Same as Gewerke but only tasks whose `gewerk_id` is in the selected employee’s gewerke list. Filter: Mitarbeiter (single) + Gewerke (multi).
- **Filters**: Projekt (multi), Phase (single), Gewerke (multi, checkboxes), Mitarbeiter (single). All filter state can be bound in WeWeb (e.g. `selectedProjektIds`, `selectedPhaseId`, `selectedGewerkIds`, `selectedMitarbeiterId`).
- **Task bar click**: Opens a **detail popup** (modal) with task or project fields. Popup shows **Frage** (question) and **Umsetzungsdauer** (implementation duration) as simplified values (question text only, number only).
- **“Zum Projekt” button**: Optional button in the popup; when clicked, emits an event with `projekt_id` (and `id`, `projekt_name`) so WeWeb can run a workflow (e.g. set variable, navigate to project page).
- **Loading overlay**: When a bindable **Loading** flag is `true`, a full overlay with spinner and “Laden …” is shown over the chart (with blur and fade transition).
- **Single project**: If the project list has exactly one project, it is treated as selected automatically (dropdown shows that project, chart is filtered to it).
- **Empty / no dates**: Rows without valid start/end dates are still rendered; bar position logic treats them with a fallback (e.g. small placeholder bar).

---

## File structure

- **`src/wwElement.vue`** – Single-file Vue component (template, script, scoped styles). All Gantt logic, filters, popup, and loader live here.
- **`ww-config.js`** – WeWeb component definition: `editor.label`, `properties` (data bindings, toggles, colors, etc.), and `triggerEvents`.

---

## Data sources and shapes

Bind these in WeWeb under the component’s **Specific** (or equivalent) panel.

### 1. Gantt Data (`ganttData`)

**Purpose**: Task-level rows for the **Projektebene**, **Gewerke**, and **Mitarbeiter-Gewerke** views. Also used to derive project options for the Projekt filter when `projekteData` is not used.

**Type**: Array of objects.

**Required for bar position**:

| Field         | Type   | Description                    |
|---------------|--------|--------------------------------|
| `id`          | string | Unique per row (used for dedupe in Projekte/Projektebene). |
| `startdatum`  | string/date | Bar start (ISO or parseable date). |
| `deadline`    | string/date | Bar end. |

**Required for grouping and display**:

| Field          | Type   | Description |
|----------------|--------|-------------|
| `projekt_id`   | string | Project reference. |
| `projekt_name` | string | Project label. |
| `phase_id`     | string | Phase reference (Projektebene). |
| `phase_name`  | string | Phase label. |
| `gewerk_id`    | string or `null` | Trade reference; `null` = “Ohne Gewerk”. |
| `gewerk_name`  | string or `null` | Trade label. |
| `frage`        | string | Question text (bar label and popup). |

**Optional (shown in popup)**:

| Field              | Type   | Description |
|--------------------|--------|-------------|
| `frage_id`         | any    | Optional. |
| `einheit`          | string | Unit label. |
| `umsetzungsdauer`  | number or string | Only the numeric part is shown in popup. |
| `antwort_text`     | string | Answer. |
| `notizen`          | string | Notes. |

**Example row**:

```json
{
  "id": "141c151d-8751-4d75-b84a-4beacf05d96a",
  "projekt_id": "6ae7e268-174f-402a-b861-cb848123be40",
  "projekt_name": "test3",
  "phase_id": "2eea26fa-4e5d-4ccc-8d6d-1fb143122a2b",
  "phase_name": "Fenster / Türen (zeitkritisch)",
  "gewerk_id": null,
  "gewerk_name": null,
  "frage": "Innentüren neu?",
  "startdatum": "2026-03-17",
  "deadline": "2026-03-25",
  "umsetzungsdauer": 80,
  "antwort_text": "Ja",
  "notizen": "Optional notes"
}
```

**Note**: For “Ohne Gewerk”, use `gewerk_id: null` (and optionally `gewerk_name: null`). Do **not** use empty strings `""`; the component only treats `null`/missing as “Ohne Gewerk” for grouping and filter.

---

### 2. Projects – Projekte (`projekteData`)

**Purpose**: **Projekte** view shows one bar per project, from `created_at` to `deadline`. Also used to build the Projekt filter dropdown when provided.

**Type**: Array of objects (e.g. from `public.projekte`).

**Required**:

| Field          | Type   | Description |
|----------------|--------|-------------|
| `id`           | string | Project ID. |
| `projekt_name` | string | Display name. |
| `created_at`   | string/date | Bar start. |
| `deadline`     | string/date or `null` | Bar end; if `null`, bar is drawn as same day as `created_at`. |

**Example**:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "projekt_name": "Live_TEST_JM",
  "created_at": "2026-03-18T00:00:00.000Z",
  "deadline": "2026-04-30"
}
```

---

### 3. Gewerke (`gewerke`)

**Purpose**: Options for the Gewerke filter and for grouping in Gewerke / Mitarbeiter-Gewerke views.

**Type**: Array of objects.

**Required**:

| Field   | Description |
|---------|-------------|
| `id`    | Gewerk ID. |
| `name` or `label` | Display text in dropdown and group header. |

**Example**:

```json
[
  { "id": "gewerk-uuid-1", "name": "Architekt" },
  { "id": "gewerk-uuid-2", "name": "Fenster / Türen" }
]
```

---

### 4. Mitarbeiter (`mitarbeiter`)

**Purpose**: Options for the Mitarbeiter filter (Mitarbeiter-Gewerke view).

**Type**: Array of objects.

**Required**:

| Field | Description |
|-------|-------------|
| `id`  | Mitarbeiter ID. |

**Display label** (first found): `name` → `label` → `vorname`/`first_name` + `nachname`/`last_name` → `email` → `id`.

**Example**:

```json
[
  { "id": "user-uuid-1", "vorname": "Max", "nachname": "Müller" },
  { "id": "user-uuid-2", "first_name": "Anna", "last_name": "Schmidt" }
]
```

---

### 5. Mitarbeiter–Gewerke (`mitarbeiterGewerke`)

**Purpose**: Links employees to trades; used in **Mitarbeiter-Gewerke** view to restrict tasks to the selected employee’s gewerke.

**Type**: Array of objects.

**Required**:

| Field (either name)   | Description |
|-----------------------|-------------|
| `mitarbeiter_id` or `mitarbeiterId` | Employee ID. |
| `gewerk_id` or `gewerkId`           | Gewerk ID. |

**Example**:

```json
[
  { "mitarbeiter_id": "user-uuid-1", "gewerk_id": "gewerk-uuid-1" },
  { "mitarbeiter_id": "user-uuid-1", "gewerk_id": "gewerk-uuid-2" }
]
```

---

## WeWeb properties

All of these are defined in `ww-config.js` and appear in the WeWeb property panel.

### Data (bindable)

| Property        | Type  | WeWeb label (EN)   | Description |
|-----------------|-------|--------------------|-------------|
| `ganttData`     | Array | Gantt Data         | Task rows (see [Gantt Data](#1-gantt-data-ganttdata)). |
| `projekteData`  | Array | Projects (Projekte)| Project rows for Projekte view and project filter. |
| `gewerke`       | Array | Gewerke List       | Gewerk options. |
| `mitarbeiter`   | Array | Mitarbeiter List   | Employee options. |
| `mitarbeiterGewerke` | Array | Mitarbeiter–Gewerke | Employee–Gewerk links. |

### View visibility (OnOff)

| Property                   | Default | Description |
|---------------------------|---------|-------------|
| `showProjekteView`        | true    | Show “Projekte” tab. |
| `showProjektebeneView`    | true    | Show “Projektebene” tab. |
| `showGewerkeView`         | true    | Show “Gewerke” tab. |
| `showMitarbeiterGewerkeView` | true | Show “Mitarbeiter-Gewerke” tab. |

### Filter state (bindable)

| Property             | Type  | Description |
|----------------------|-------|-------------|
| `viewType`          | TextSelect | Active view: `projekte` \| `projektebene` \| `gewerke` \| `mitarbeiter_gewerke`. |
| `selectedProjektIds`| Array | Selected project IDs (empty = all). |
| `selectedPhaseId`   | Text  | Selected phase ID (empty = all). |
| `selectedGewerkIds` | Array | Selected gewerk IDs; use `"__null__"` for “Ohne Gewerk” in the list. |
| `selectedMitarbeiterId` | Text | Selected employee ID (Mitarbeiter-Gewerke). |

### Loading and UI

| Property                | Type   | Description |
|-------------------------|--------|-------------|
| `isLoading`            | OnOff  | When true, shows overlay with spinner and “Laden …”. Bind to a variable and set true/false around data load. |
| `showZumProjektButton` | OnOff  | When true, shows “Zum Projekt” in the detail popup (when item has `projekt_id`). |

### Time scale

| Property        | Type       | Values | Description |
|-----------------|------------|--------|-------------|
| `visualizacao`  | TextSelect | `dia` \| `semana` \| `mes` | Day / Week / Month. |

### Layout and styling

| Property   | Type   | Description |
|------------|--------|-------------|
| `altura`   | Length | Component height (e.g. `500px`). |
| `corFundo` | Color | Background. |
| `corBorda` | Color | Border color. |
| `corTexto` | Color | Text color. |
| `corHeader`| Color | Header/filter bar background. |
| `corDiaAtual` | Color | Today line on timeline. |
| `corEmDesenvolvimento` | Color | Task/project bar color (and loader spinner). |

---

## Trigger events

The component emits `trigger-event` with one of the following names. In WeWeb, attach workflows to these triggers.

### 1. `onTaskClick` (Task Clicked)

**When**: User clicks a task or project bar.

**Payload**:

- `task`: object with `id`, `projekt_id`, `projekt_name`, `frage_id`, `frage`, `phase_id`, `phase_name`, `gewerk_id`, `gewerk_name`, `startdatum`, `deadline`, `umsetzungsdauer`, `einheit`, `antwort_text`, `notizen`.
- `groupLabel`: label of the group row (e.g. project name, phase name, gewerk name).
- `groupKey`: group id (e.g. `projekt_id`, `phase_id`, `gewerk_id`).

The same click also opens the detail popup.

### 2. `onZumProjekt` (Zum Projekt clicked)

**When**: User clicks “Zum Projekt” in the detail popup (only if the item has a `projekt_id` and the button is enabled).

**Payload**:

- `projekt_id`: project ID.
- `id`: task/project row id.
- `projekt_name`: project name.

Typical use: set a WeWeb variable to `event.projekt_id` and navigate to the project detail page.

---

## Behaviour details

- **Deduplication**: In **Projekte** and **Projektebene** views, task rows are deduplicated by `id` before grouping (first occurrence kept).
- **Ohne Gewerk**: Rows with `gewerk_id === null` (or undefined) are grouped under “Ohne Gewerk” and included when the user selects “Ohne Gewerk” in the Gewerke filter. Empty string `""` is **not** treated as “Ohne Gewerk”.
- **Single project**: If `projectOptions` has length 1, that project is effectively selected (filter and label); no need to set `selectedProjektIds` explicitly.
- **Popup**: Task popup shows “Aufgabendetails” and project popup “Projektdetails”. Frage is shown as `task.frage` only; Umsetzungsdauer is shown as the numeric part only (e.g. from `"80"` or `"80 ..."`).
- **Loader**: Overlay is absolutely positioned over the main Gantt area, with fade transition and a rotating ring spinner; bar color (or current-day color) is used for the spinner accent.

---

## Installation and build

1. **WeWeb**: Add the component to your WeWeb project:
   - `src/wwElement.vue` – main Vue component.
   - `ww-config.js` – component definition.

2. **Local** (if you use the repo for development):
   - `npm install`
   - `npm run build` (or your WeWeb custom component build command).

3. **Data**: Bind **Gantt Data** (and optionally **Projekte**, **Gewerke**, **Mitarbeiter**, **Mitarbeiter–Gewerke**) to your WeWeb data sources (e.g. Supabase views). Ensure dates and IDs match the shapes above; use `null` for “Ohne Gewerk”, not `""`.

4. **Loading**: Create a boolean variable (e.g. `ganttLoading`), bind **Loading** to it, and set it to `true` before fetching and `false` when the fetch completes.

5. **Navigation**: To navigate on “Zum Projekt”, add a workflow on the **Zum Projekt clicked** trigger: e.g. set variable `selectedProjektId` to `event.projekt_id`, then open project page or update context.

---

## Summary for the next developer

- **One component**: `wwElement.vue` holds all UI and logic (views, filters, popup, loader, bar positioning).
- **Config**: `ww-config.js` defines WeWeb properties and trigger events; no separate “backend”.
- **Data**: Five optional arrays drive the chart and filters; exact field names matter (`startdatum`/`deadline`, `projekt_id`, `phase_id`, `gewerk_id`, `frage`, etc.). Use `null` for missing Gewerk.
- **Views**: Four modes (Projekte, Projektebene, Gewerke, Mitarbeiter-Gewerke) with different grouping and filters; which tabs show is controlled by four OnOff props.
- **Interactions**: Bar click → popup + `onTaskClick`; “Zum Projekt” click → `onZumProjekt` with `projekt_id`.
- **Loading**: Bind `isLoading` to a variable and toggle it around your data load for a smooth overlay.
