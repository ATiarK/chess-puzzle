# Changelog

All notable changes to this project will be documented in this file.

## [0.3.0] - 2026-08-09

### Added
- **Clickable Move History:** The move history strip below the puzzle is now interactive! Moves are grouped into full moves (e.g. `1. e4 e5`). You can click any move to instantly rewind the board to that state. Undone moves are displayed grayed-out, allowing you to easily click forward (redo) as well.

## [0.2.0] - 2026-08-09

### Added
- **Undo & Redo Functionality:** Added the ability to undo and redo moves in the puzzle solver. This allows users to easily back out of incorrect moves without resetting the entire board. Added new icon controls below the board.
- **Tap-to-Move Mechanics:** Added support for tap-to-move in addition to drag-and-drop. First tap on a piece shows its legal moves; second tap on a valid square executes the move.
- **Multi-line Puzzle Solutions:** Creators can now add multiple valid solution lines for a single puzzle. The solver will accept any of these valid variations. 
  - Added UI tabs in the puzzle creator and editor for managing multiple lines.
  - Updated database schema with `alternativeSolutions`.
  - Added line selector in the "Give Up" solution viewer to review all valid solutions.

### Fixed
- **UI Duplication:** Removed duplicate "Give Up" and "Reset Board" buttons in the puzzle solver interface to clean up the layout.

<!-- ## Future Plan / Roadmap

### 1. User Profiles & Statistics
- Allow users to have profiles displaying their created and solved puzzles.
- Track user ratings (Elo) and puzzle completion statistics.
- Implement a difficulty rating system for puzzles based on how frequently they are solved correctly.

### 2. Enhanced Puzzle Creation
- Add PGN import/export for faster and easier puzzle creation.
- Auto-tagging of puzzles (e.g., "mate in 2", "fork", "pin") using a chess engine on the backend.

### 3. Gameplay Improvements
- Add sounds for piece moves, captures, checks, and game ends.
- Add visual indicators (highlighting) for the last move played.
- Configurable board themes (colors) and piece sets for better customization.

### 4. Community & Moderation
- Allow users to upvote or downvote puzzles, creating a "Top Rated" feed.
- Add a dashboard to report or hide broken/invalid puzzles.
- Comment section for users to discuss specific puzzles. -->
