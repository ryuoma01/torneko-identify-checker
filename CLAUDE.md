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
- `fixed`: 草・巻物・指輪（固定価格）
- `modifier`: 剣・盾（補正値-1〜+3による価格変動）
- `uses`: 杖・壺（残回数0〜6による価格変動）

**Current Database**: Contains 138 items accurately extracted from official Torneko 2 price tables, including:
- 26 grass types (命の草, 薬草, 火炎草, 世界樹の葉, etc.)
- 28 staff types with usage-based pricing (転ばぬ先の杖, 身代わりの杖, モノカの杖, ザキの杖, etc.)
- 15 weapon types with modifier-based pricing (銅の剣 to せいぎのそろばん)
- 12 shield types with modifier-based pricing (皮の盾 to 見切りの盾)
- 27 scroll types with accurate buy/sell prices
- 20 ring types with accurate buy/sell prices
- 10 jar types with accurate buy/sell prices

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
- **Dynamic price search**: Real-time results as user types price values
- Price search matches both buy and sell prices across all modifier/use variations
- Color-coded price display (buy: purple, sell: blue)
- Price filtering: separate buy-only and sell-only search options with checkboxes
- Category-grouped price search results with identification sync

**Category Navigation**:
- Quick jump buttons for all 7 categories (草・杖・剣・盾・巻物・指輪・壺)
- Smooth scrolling with visual highlight effects
- Always accessible category navigation bar

**Sorting**: Always displays items grouped by category, with sorting applied within each category.

**Dual-Tab Interface Design**: 
- Two main tabs: "アイテム一覧" (Item List) and "値段検索" (Price Search)
- Streamlined item list with search/sort/identification and dual price display
- Integrated category jumping and dynamic price search functionality

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

**Category Order**: Fixed display order - 草, 杖, 剣, 盾, 巻物, 指輪, 壺.

**Page Navigation**:
- "先頭に戻る" (scroll to top) buttons on both tabs
- Smooth scrolling to page top functionality
- Fixed positioning in bottom-right corner

**Input Enhancement Components**:
- `.input-with-clear`: Container for inputs with integrated clear buttons
- `.clear-button`: Unified × button styling with hover/active states
- Responsive positioning and touch-friendly sizing

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

## Current Implementation Features

### Search & Filter System

**Item List Search** (`#search-input`):
- Real-time filtering on item name, reading (hiragana), category, and effect text
- Integrated clear button (×) that appears when typing
- Results maintain category grouping with internal sorting

**Dynamic Price Search** (`#price-input`):
- **Real-time search**: No search button required - results update as you type
- Number input with integrated clear button
- Empty input shows helpful guidance message
- Results grouped by category similar to item list
- Searches across all buy/sell price variations (modifiers/uses)

### Advanced Synchronization

**Bidirectional State Sync**:
- Changes in item list instantly reflect in price search results
- Changes in price search results instantly reflect in item list
- Tab switching maintains search state and updates displays
- localStorage persistence works across both interfaces

**Method Architecture**:
- `toggleIdentified()`: Standard identification toggle for item list
- `toggleIdentifiedForPriceSearch()`: Specialized toggle that avoids re-rendering price results
- `updatePriceSearchResults()`: Updates existing price search display without full re-render

## Recent Features Added

**Scroll to Top Buttons**:
- Fixed position buttons on both item list and price search tabs
- Smooth scroll animation to page top
- Located in bottom-right corner with accent color styling
- Touch-friendly design with hover effects

**Category Jump System** (`jumpToCategory`): 
- 7 category buttons for instant navigation
- Smooth scrolling with visual feedback
- Temporary highlight effect on destination

**Enhanced Price Search**:
- **Dynamic Real-time Search**: Results update instantly as user types, no search button needed
- Buy-only and sell-only filtering checkboxes for targeted searches
- Category-grouped results display matching item list structure
- Comprehensive price matching across all modifier/use variations
- Bidirectional sync with item list identification status

**Advanced Input Features**:
- **Clear Buttons**: Both search inputs feature "×" clear buttons that appear when typing
- Unified styling and behavior across all input fields
- Mobile-optimized touch targets and responsive design

**Improved User Interface**:
- Main item tap for identification toggle (UX improvement)
- Dedicated detail buttons for modal access
- Dual price display throughout the application
- Mobile-optimized category navigation
- Real-time synchronization between tabs (identification changes reflect immediately)