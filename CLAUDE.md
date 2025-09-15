# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a web-based item management tool for "Torneko no Daibouken 2" (Dragon Quest Mysteries: Tara's Adventure). It helps players track item identification status and search for items by name or price during gameplay.

## Development Commands

```bash
# Start development server
python3 -m http.server 8000
# Then open http://localhost:8000

# Alternative ports if 8000 is in use
python3 -m http.server 8001
python3 -m http.server 8002
```

## Architecture

### Core Components

**TornekoItemApp Class** (`app.js`): Main application class that manages:
- Item data loading from JSON
- localStorage persistence for identification status
- UI rendering and event handling
- Search and sorting functionality
- Modal management

**Data Structure** (`items.json`): Array of item objects with schema:
```json
{
  "name": "アイテム名",
  "reading": "よみがな", 
  "price": 数値,
  "effect": "効果説明",
  "category": "カテゴリ"
}
```

**State Management**: 
- `this.items`: All item data from JSON
- `this.identifiedItems`: Set of identified item names
- `this.currentFilter`: Search query string
- `this.currentSort`: Current sort method ('name'|'price'|'identified')

### Key Features

**Identification Tracking**: Uses localStorage with key `torneko-identify-checker-items` to persist checkbox states across sessions.

**Search System**: Supports partial matching on item name, reading (hiragana), category, and effect text.

**Sorting**: Always displays items grouped by category, with sorting applied within each category.

**Dual Interface**: 
- Item list tab with search/sort/identification
- Price search tab for reverse lookup by price

**Modal System**: Two modals - item details and reset confirmation with safety prompts.

### UI Structure

**Color Palette** (CSS variables):
- `--bg-color`: Slightly purple-tinted white background
- `--main-color`: Blue-navy for text and borders  
- `--accent-color`: Deep purple for highlights and active states
- `--dark-accent`: Dark navy for hover states

**Mobile-First Design**: Optimized for iPhone with WebClip support, touch-friendly controls, and sticky navigation.

**Category Order**: Fixed display order - 草, 種, 杖, 剣, 盾, 食べ物, 巻物, 腕輪.

## File Structure

- `index.html`: Main HTML with tab structure and modals
- `app.js`: Single-class JavaScript application
- `items.json`: Static item database  
- `styles.css`: Complete styling with CSS custom properties
- `icon-192.png`: WebClip icon for iOS home screen

## Important Notes

When modifying item data, maintain the exact JSON schema including the `reading` field for Japanese hiragana search functionality.

The application is completely client-side with no build process - direct file editing and browser refresh for development.