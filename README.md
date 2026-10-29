# Little World

Little World is a cosy desktop decorating game. Tend a tiny floating island with a cottage, a garden, ponds and streams, and make it your own. Your world is saved on your computer, so you can come back to it after closing the app.

## Features

- **Decorate an island:** place flowers, trees, ponds, bridges, benches, lanterns and more. Select, move, rotate, delete, undo and redo.
- **Smart placement:** objects have real footprints, so they can't overlap the cottage or each other where they shouldn't. A preview shows whether a spot fits, with a text label as well as colour.
- **Daily goals and milestones:** three new goals each day, plus longer-term milestones. Progress is kept when you miss a day.
- **Petals and unlocks:** earn petals to unlock new decorations, cottage parts, house designs and palettes. Unlocks are permanent.
- **Cottage builder:** mix and match roofs, windows, doors, walls, trim and extras, with colours and live previews.
- **Palettes:** 23 palettes, from soft pastels to moody darker tones, each with its own gentle atmosphere.
- **Autosave:** every change is saved automatically on your computer.

## Built with

- [Tauri 2](https://tauri.app/) for the desktop shell (Rust)
- React and TypeScript for the interface
- Vite for development and bundling
- Vitest for tests

## Prerequisites

- **Node.js** (an LTS release, such as 20 or newer)
- **Rust** and Cargo, installed with [rustup](https://rustup.rs/)
- **macOS:** the Xcode Command Line Tools (`xcode-select --install`)

## Getting started

Install the dependencies:

```bash
npm install
```

Run the tests:

```bash
npm test
```

Build the web app:

```bash
npm run build
```

Launch the desktop app in development mode:

```bash
npm run tauri dev
```

Development mode uses the Vite dev server on port 1420. Stop it with Ctrl+C in the terminal.

## Building the Mac app

```bash
npm run tauri build
```

The build writes these outputs:

- **App:** `src-tauri/target/release/bundle/macos/Little World.app`
- **Installer:** `src-tauri/target/release/bundle/dmg/Little World_0.1.0_aarch64.dmg`

Tauri creates the `.dmg` installer after the `.app`. On some Macs, the DMG step needs permission for your terminal to control Finder, under System Settings → Privacy & Security → Automation. If that step fails, the `.app` is still built, and you can find it at the path above.

## Current limitations

- The current Mac release is built for **Apple Silicon** (M1 and later) Macs only.
- The app is **not notarised** by Apple. macOS may block it or warn that it comes from an unidentified developer. Only open it if you trust where it came from. Right-clicking the app and choosing **Open** may help, but it isn't guaranteed to work.
- Windows and Linux builds have not been produced yet.

## Your save data

Your world is stored inside the app's local web storage on your computer, not in this repository. Nothing is uploaded anywhere.

## Project layout

- `src/`: the game, including React components, game logic, progression, persistence and tests
- `src-tauri/`: the Tauri (Rust) desktop shell, app configuration and icons
- `public/`: static files served with the web app
- `index.html`: the web entry page

## Status

This repository is private, and no licence has been chosen yet.
