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

**Data Structure** (`items.json`): Array of item objects with enhanced price system:
```json
{
  "name": "アイテム名",
  "reading": "よみがな",
  "category": "カテゴリ",
  "effect": "効果説明",
  "priceType": "fixed|modifier|uses",
  "prices": {
    "buy": { "0": 買値, "+1": 補正買値, ... },
    "sell": { "0": 売値, "+1": 補正売値, ... }
  }
}
```

**Price Types**:
- `fixed`: 草・種・巻物・腕輪・食べ物（固定価格）
- `modifier`: 剣・盾（補正値-1〜+3による価格変動）
- `uses`: 杖・壺（残回数0〜6による価格変動）

**State Management**: 
- `this.items`: All item data from JSON
- `this.identifiedItems`: Set of identified item names
- `this.currentFilter`: Search query string
- `this.currentSort`: Current sort method ('name'|'price'|'identified')

### Key Features

**Identification Tracking**: Uses localStorage with key `torneko-identify-checker-items` to persist checkbox states across sessions.

**Search System**: Supports partial matching on item name, reading (hiragana), category, and effect text.

**Price System**: 
- Displays both buy and sell prices for all items
- Price search matches both buy and sell prices across all modifier/use variations
- Color-coded price display (buy: purple, sell: blue)

**Sorting**: Always displays items grouped by category, with sorting applied within each category.

**Dual Interface**: 
- Item list tab with search/sort/identification and dual price display
- Price search tab for comprehensive price lookup (buy/sell values)

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

When modifying item data, maintain the exact JSON schema including:
- The `reading` field for Japanese hiragana search functionality
- The `priceType` and `prices` structure for accurate price calculations
- Proper buy/sell price mappings for all modifier/use variations

The application is completely client-side with no build process - direct file editing and browser refresh for development.

## Price Calculation Logic

The app uses `getCurrentPrice(item, priceType, modifier)` to retrieve prices:
- For fixed items: Always uses key "0"
- For modifier items: Uses keys "-1", "0", "+1", "+2", "+3" 
- For uses items: Uses keys "0", "1", "2", "3", "4", "5", "6"
- Price search (`itemMatchesPrice`) checks all buy/sell price variations