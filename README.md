# Personal VFX Workflow Assistant

A local-first React/Vite/TypeScript browser app for a real-time VFX artist managing gameplay VFX work from request intake through verification.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. For a production build:

```bash
npm run build
npm run preview
```

## What is included

- A personal dashboard with Now, Waiting, Recent, and All Tasks views.
- Quick Capture with effect type, map/mode, Jira, raw request, status, next action, priority, tags, and optional production details.
- A task workspace with compact Notes, Feedback, Test, Submit, Reflection, Messages, and History tabs.
- Local keyword suggestions and draft-only Slack/Jira/stand-up messages; there is no external AI call or integration.
- Global search across task metadata, raw requests, work logs, feedback, decisions, reflections, technical problems, and people.
- Filters for map, effect, status, priority, tags, blockers, feedback, changelists, reflections, and active/completed state.
- First-class reflections, learning cards, Starting points, and localStorage JSON export/import with seed/migration support.

## Iteration notes

### Files changed

- `src/App.tsx` - dashboard, Quick Capture, workspace tabs, search, filters, reflections, Starting points, saved views, and local-only interactions.
- `src/types.ts` - effect-type enum, tags, reflection model, saved-view model, and optional Starting point fields.
- `src/data.ts` - defaults, normalization, migration, keyword inference, and compatible seed metadata.
- `src/styles.css` - compact personal-workspace layout and responsive styles.
- `README.md` - this implementation and migration record.

### Model and migration

Tasks now support a controlled `EffectType`, freeform tags, and a first-class `Reflection` record. `AppData` also stores saved views and recent filter snapshots; Starting points can carry a small set of prefills. `migrateAppData` keeps existing task history, follow-ups, blockers, work logs, feedback, decisions, and checklist data intact while filling missing fields with safe defaults. Known seed records receive illustrative metadata only when those fields are absent. Import/export remains local JSON using the existing localStorage data shape.

### Search and filters

Global search is available from the top bar and `Ctrl/Cmd+K`. It searches task metadata and the long-form personal record, then groups results by active/completed state and explains why each result matched. Filter chips can be cleared individually or all at once. Saved views and up to six recent filter snapshots are persisted locally.

### Reflections

Completing a task opens the optional Reflection tab. The quick form captures what worked, what was difficult, and what to try next; the expanded form adds technical usefulness, reusable knowledge, and tags. The Reflection library turns completed reflections into learning cards.

### Deferred by design

External AI, Slack/Jira integrations, backend sync, OS reminders, and a complex query language remain out of scope. Suggestions are intentionally local keyword matches, and the filter model remains compact rather than becoming a multi-select query builder.

## Design decisions

- No backend, login, or external integration. The app is intentionally personal and offline-friendly.
- The seeded tasks demonstrate the full daily loop: a feedback iteration, a ready-to-submit pass, an unclear request, and a blocked hookup bug.
- Generated communication is always a draft. The app never sends Slack, Jira, or other messages.
- Advanced details stay in task tabs so the dashboard remains fast to scan.
- The app is a personal workflow memory: capture, find, reflect, and reuse are prioritized over team-process ceremony.

## Scalability iteration

### Files changed

- `src/types.ts` - separated Work Type, Effect Type, lifecycle, pin/recent metadata, work-type detail models, and archive preferences.
- `src/data.ts` - versioned localStorage migration, legacy Effect Type conversion, sample-task metadata, default detail sections, and archive preference defaults.
- `src/App.tsx` - compact sidebar navigation, All Tasks workspace, multi-select filters, saved views, sorting, grouping, archive/restore actions, work-type workspaces, Quick Capture classification, and search behavior.
- `src/styles.css` - sidebar, All Tasks, filter, work-type workspace, starting-point, and responsive styles.
- `README.md` - implementation notes and deferred functionality.

### Task model and migration

The model now separates `workType` from `effectType`. Work Type defaults are New VFX, Iteration / Polish, Bug Fix, Optimization, Hookup / Integration, and Research / Prototype. Effect Type no longer contains Bug Fix or Optimization. Existing records are migrated without deleting history, notes, feedback, follow-ups, blockers, reflections, or submission data. The migration is versioned at data version 2 so seed metadata is applied once and later user edits are preserved.

### Navigation and All Tasks

The sidebar no longer renders the full task collection. It shows up to five pinned tasks, five recent tasks, and an All Tasks count. All Tasks includes default views for Active, Waiting, Ready to Submit, Bug Fixes, Recently Completed, and Archived; multi-select Work Type, Effect Type, and Tags; filters for status, map, priority, blockers, feedback, changelist, reflection, lifecycle, and updated date; removable chips; sorting; optional grouping; saved views; and recent local filter views.

### Work-type workspaces

New VFX and Iteration / Polish retain the existing creative task shell. Bug Fix uses focused issue, reproduction, investigation, and resolution sections with an ordered reproduction checklist and message generators. Optimization uses problem, baseline, changes, and result sections. Hookup / Integration uses explicit event, Scriptable, dependency, timing, reset, and verification fields. Research / Prototype stays lightweight and note-oriented. All types retain shared task context, notes, messages, history, submission, and reflection tabs.

### Search and Quick Capture

Search now includes Work Type, Effect Type, task metadata, bug symptoms, reproduction steps, root cause, optimization notes, hookup event names, feedback, changelists, work notes, and reflections. Results explain the matching field, open the relevant task, and close the search panel. Quick Capture defaults to New VFX, lets the user choose Work Type and Effect Type separately, changes its raw-request prompt by Work Type, and keeps local keyword suggestions explicitly reviewable.

### Deferred

Custom Work Type and Effect Type entry is local-only. Backend sync, authentication, team management, external AI, Slack/Jira/Perforce integrations, profiler integrations, and a richer calendar/notification system remain deferred.

## Lean Task View iteration

The task workspace now opens as a Lean working surface. The header keeps the task name, Work Type, Effect Type, map/mode, status, selected tags, next action, and blocker visible; shared metadata moves into an `Edit task details` drawer. `Lean` and `Detailed` density are persisted locally in `AppData.preferences.taskPageDensity`.

The Overview tab presents four short work-type prompts for New VFX, Iteration / Polish, Bug Fix, Optimization, Hookup / Integration, or Research / Prototype. Optional details can be added, edited, collapsed, reordered, hidden, or deleted without changing the existing task model. Quick Capture only requires a task name and keeps the rest of the request lightweight.

Notes are the primary capture path. The note editor supports `/change`, `/issue`, `/test`, `/feedback`, `/decision`, `/todo`, `/cl`, `/learning`, and `/reference` prefixes, an optional link, and note types. A note can be promoted into an existing structured field while the original note remains in the work log.

The migration remains local and backward-compatible: `dataVersion` is still version 3, existing fields and history are preserved, and new `leanCanvas`, `detailPreferences`, and density preferences receive safe defaults during normalization. External integrations, real Jira/Slack actions, AI generation, and profiler data remain deferred.

## Build modes, GitHub Pages, and offline use

The app has two explicit build targets. Both are local-first and have no runtime network dependency.

```bash
npm install

# Local development with the personal workspace seed and local storage.
npm run dev

# Build the local app, then serve dist from 127.0.0.1:4173.
npm run local:build

# Build only the local artifact, or serve an existing dist folder.
npm run build:local
npm run local
```

The public GitHub Pages build is sanitized and uses the `/vfx-flow/` base path:

```bash
npm run build:github
```

To publish it, create or use the public repository `Lyuflora/vfx-flow`, push this project to its `main` branch, and set GitHub Pages to `GitHub Actions` under Settings → Pages. The included `.github/workflows/deploy.yml` builds with `npm run build:github` and deploys `dist`. The resulting URL is:

`https://Lyuflora.github.io/vfx-flow/`

The GitHub build uses generic demo tasks and does not include personal names, company information, internal task identifiers, internal URLs, or changelists. The personal local seed remains in the git-ignored `src/data.ts` file; a checkout without that file falls back to the generic public seed. Keep sensitive production data in the local build. The app shows `Public demo` or `Local workspace` so the active mode is visible.

The PWA caches the built app for offline use. When a new build is available, the app prompts before updating so saved browser data is not silently interrupted. Local and GitHub builds use separate localStorage keys. JSON exports include `exportDate`, `applicationVersion`, and `schemaVersion`; importing offers Merge, Replace, or Cancel, and Replace creates a `.backup` entry before overwriting the local dataset.

The build also runs `scripts/verify-dist.mjs` to audit generated HTML, JavaScript, CSS, manifest, and service-worker output for unexpected external resources. Local-only task links are documented for the local build and rejected from the public build.

## Recommended next improvements

## Progressive disclosure iteration

The task workspace now separates the first useful decision from the full record. Overview is organized into Current Work, Task Context, Technical Details, and Delivery folds; only populated prompts and explicitly added optional fields appear. Technical fields use work-type-aware nested folds, searchable Add field controls, summaries, inline edit/save/cancel actions, and keyboard Escape cancellation. Delivery links to the existing Feedback, Testing, Submission, Messages, and follow-up surfaces instead of duplicating their forms.

Fold state is UI-only and persisted per task in `AppData.taskViewState`, so existing task fields, localStorage imports/exports, notes, history, and work-type data remain compatible. Stage-aware defaults open Current Work plus the most relevant delivery or context layer, while `Expand relevant`, `Collapse details`, and `Reset layout` let the user choose a different working view. Notes keep their quick capture input available, while Feedback, Testing, Submission, Reflection, and History continue to expose their existing data with compact secondary controls.

- Add a compact stage-board view for moving tasks between workflow stages.
- Add template application directly inside Quick Capture.
- Add richer task-level filtering for overdue target dates and unresolved follow-ups.
- Add browser-level smoke tests for the primary create → log → feedback → submit path.
