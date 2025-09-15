# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a web-based item identification management tool for "Torneko no Daibouken 2" (Dragon Quest Mysteries: Tara's Adventure). It helps players track item identification status, search for items by name, and look up prices with advanced filtering capabilities during gameplay.

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

**Data Structure** (`items.json`): Array of item objects with enhanced price system based on official price tables:
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
- `uses`: 杖（残回数0〜6による価格変動）

**Current Database**: Contains 60+ items accurately extracted from official Torneko 2 price tables, including:
- 15 grass types (命の草, 薬草, 火炎草, 世界樹の葉, etc.)
- 10 seed types (ちからのたね, 胃拡張のたね, しあわせのたね, etc.)
- 4 staff types with usage-based pricing (転ばぬ先の杖, 身代わりの杖, モノカの杖, ザキの杖)
- 7 weapon types with modifier-based pricing (銅の剣 to せいぎのそろばん)
- 5 shield types with modifier-based pricing (皮の盾 to 見切りの盾)
- Food, scroll, and ring categories with accurate buy/sell prices

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
- Price filtering: separate buy-only and sell-only search options

**Category Navigation**:
- Quick jump buttons for all 8 categories (草・種・杖・剣・盾・食べ物・巻物・腕輪)
- Smooth scrolling with visual highlight effects
- Always accessible category navigation bar

**Sorting**: Always displays items grouped by category, with sorting applied within each category.

**Single Interface Design**: 
- Streamlined item list with search/sort/identification and dual price display
- Integrated category jumping and price search functionality
- Removed tab system for simplified navigation

**Modal System**: Two modals - item details (with buy/sell prices) and reset confirmation with safety prompts.

**User Experience Enhancements**:
- Main tap toggles identification status (not modal)
- Dedicated "詳細" (Details) button for item information modal
- Responsive design optimized for mobile gameplay

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
- Price search (`itemMatchesPrice`) checks all buy/sell price variations with filtering support

## New Features Added

**Category Jump System** (`jumpToCategory`): 
- 8 category buttons for instant navigation
- Smooth scrolling with visual feedback
- Temporary highlight effect on destination

**Enhanced Price Search**:
- Buy-only and sell-only filtering checkboxes
- Real-time search result updates
- Comprehensive price matching across all variations

**Improved User Interface**:
- Main item tap for identification toggle (UX improvement)
- Dedicated detail buttons for modal access
- Dual price display throughout the application
- Mobile-optimized category navigation