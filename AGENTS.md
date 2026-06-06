# AGENTS.md

Guidance for AI agents working in this repository.

## Project overview

**PharmWS** (薬剤師ワークスペース) is a client-only Progressive Web App for hospital pharmacists. It is a single-page app with no build step, backend, or package manager. All application code lives in `index.html`; PWA assets are `manifest.json`, `sw.js`, and icon PNGs.

## Cursor Cloud specific instructions

### Dependencies

There are no npm/pip dependencies to install. Python 3 (for the static server) is sufficient.

### Running the app

The app must be served over HTTP (not `file://`) so the service worker can register.

```bash
python3 -m http.server 8080
```

Open http://localhost:8080/index.html in a browser.

For a long-running dev server, use tmux:

```bash
SESSION_NAME="pharmws-static-server"
tmux -f /exec-daemon/tmux.portal.conf has-session -t "=$SESSION_NAME" 2>/dev/null \
  || tmux -f /exec-daemon/tmux.portal.conf new-session -d -s "$SESSION_NAME" -c "/workspace" -- "${SHELL:-bash}" -l
tmux -f /exec-daemon/tmux.portal.conf send-keys -t "$SESSION_NAME:0.0" 'python3 -m http.server 8080' C-m
```

### Lint, test, and build

This repository has no linter, test runner, or build pipeline. Verification is manual or via HTTP checks:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/index.html   # expect 200
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/manifest.json
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/sw.js
```

### Gotchas

- **In-memory state only**: Tasks, local events, and MR appointments are stored in JavaScript variables; refreshing the page resets user-added data.
- **Mock calendar data**: Google Calendar sync is UI-only; schedule data comes from hardcoded `gcalData` in `index.html`.
- **CDN icons**: Tabler Icons load from jsDelivr; the app works without them if offline, but icons may be missing.
- **No hot reload**: Edit `index.html` and hard-refresh the browser to see changes.
