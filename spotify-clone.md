# Phase 4: True Spotify 1:1 Clone

**Project Type**: WEB

## Overview
Refactor the Spotiflow PWA to be a 1:1 pixel-perfect clone of the official Spotify mobile app, restricted to 5 tabs: Library, Search, Swipe, Stats, AI.

## Success Criteria
- Global floating mini-player perfectly matching Spotify's.
- 5-tab Bottom Navigation with correct icons.
- Search styling exactly matches "Browse All" grid.
- Library styling exactly matches "Your Library" top chips and pinned items.

## Tech Stack
- React + Vite
- Tailwind CSS (ignoring standard UI rules to perfectly copy Spotify)
- Lucide React (for icons closest to Spotify's standard set)
- Framer Motion

## File Structure
- `src/App.jsx` (Global router + MiniPlayer)
- `src/components/MiniPlayer.jsx` (Extracted component)
- `src/components/BottomNav.jsx` (Updated to 5 tabs)
- `src/components/LibraryTab.jsx` (Overhauled)
- `src/components/SearchTab.jsx` (Overhauled)

## Task Breakdown
- [ ] **Task 1: Global State & Navigation** (Agent: `frontend-specialist`, Skill: `react-best-practices`)
  - INPUT: `App.jsx`, `LibraryTab.jsx`
  - OUTPUT: Extract `MiniPlayer` into `src/components/MiniPlayer.jsx`. Place it globally in `App.jsx`. Update `BottomNav.jsx` to 5 tabs.
  - VERIFY: Player must remain visible when switching between tabs.

- [ ] **Task 2: Library Tab** (Agent: `frontend-specialist`, Skill: `tailwind-patterns`)
  - INPUT: `LibraryTab.jsx`
  - OUTPUT: Refactor UI strictly matching "Your Library" header and chips.
  - VERIFY: Floating chips must be perfectly styled. Pinned "Liked Songs" must be horizontally scrollable or pinned at the top.

- [ ] **Task 3: Search Tab** (Agent: `frontend-specialist`, Skill: `tailwind-patterns`)
  - INPUT: `SearchTab.jsx`
  - OUTPUT: Add "Browse All" colorful category grid for empty state.
  - VERIFY: Colors match Spotify default genres (Red for Rock, Pink for Pop, etc.).

## Phase X: Verification
- [ ] Security Scan
- [ ] UX Audit
- [ ] Responsive UI verification
- [ ] Touch target size verified
