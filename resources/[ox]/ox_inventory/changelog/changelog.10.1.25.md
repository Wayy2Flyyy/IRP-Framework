# Changelog

All notable changes to ox_inventory will be documented in this file.

## [Unreleased] - 2025-10-01

### Security Patches (Critical)
- **CRITICAL**: Fixed item duplication exploit in give item system
  - When `AddItem` succeeded but `RemoveItem` failed, items would duplicate
  - Now removes item from target inventory if source removal fails
  - Location: `modules/inventory/server.lua:2496-2499`
- **CRITICAL**: Added invtype validation to prevent unauthorized inventory access (PR #53, PR #55)
  - Server now validates that client-sent invType matches actual inventory type
  - Exploiters attempting to access inventories with wrong invType are kicked
  - Temp inventories excluded from this check (PR #55 fix)
  - Location: `server.lua:356-361`
- **CRITICAL**: Added player inventory access security checks
  - Players can only access other players' inventories if target has `canSteal` state enabled
  - Distance validation enforced (16 units max)
  - Applies to both direct player inventory and backpack stealing
  - Locations: `server.lua:307-321, 375-386`
- **Framework Integration**: Added `canSteal` state management for all supported frameworks
  - **QBCore**: Set when player is dead/downed or cuffed (`modules/bridge/qb/client.lua`)
  - **ESX**: Set when player is cuffed or dead (`modules/bridge/esx/client.lua`)
  - **QBox**: State bag handlers for `isDead` and `isHandcuffed` (`modules/bridge/qbx/client.lua`)
  - **ND Core**: State bag handlers for `isDead` and `isCuffed` (`modules/bridge/nd/client.lua`)
- **Server-Side Rob Validation**: Added `server.canRobPlayer()` function
  - Framework-agnostic check for whether a player can be robbed
  - QBCore implementation checks PlayerData for dead/cuffed status with state fallback
  - Default implementation for other frameworks uses canSteal state
  - Location: `modules/bridge/server.lua:51-59`, `modules/bridge/qb/server.lua:266-280`
- **Fixed Backpack Stealing**: Added exception for `showbpk` invType opening `stash` type inventories
  - Prevents false-positive security kicks when stealing backpacks
  - Location: `server.lua:389-390`

### Performance Improvements
- **CRITICAL**: Removed duplicate `useNuiEvent('refreshSlots')` listeners from InventorySlot component
  - Each of 50+ slots was adding its own listener, causing massive performance overhead
  - Opening inventory: 867ms → <200ms (expected)
  - Idle performance: 18956ms → near zero (expected)
- Removed `React.StrictMode` wrapper to prevent double renders in development mode
- Reduced memory usage and CPU overhead from redundant event processing

### UI/UX Improvements

#### Multi-Resolution Support
- Added responsive scaling for multiple monitor resolutions:
  - **Below 1080p** (< 1920px): Slightly larger elements for smaller screens
  - **1080p** (1920x1080): Default/base sizing
  - **1440p** (2560x1440): Scaled down 15% for better proportions
  - **4K/2160p** (3840x2160+): Scaled down 30% for optimal display
- Dynamic scaling applies to:
  - Grid slot sizes and gaps
  - Font sizes (base, small, tiny)
  - Hotbar positioning
  - Inventory padding
  - Item icon sizes
  - Drag preview elements
  - All UI components

#### Shopping System
- **Redesigned Shopping Cart UI**:
  - Modern, polished e-commerce design
  - Item preview images with hover effects
  - Rarity badges displayed prominently
  - Individual item totals clearly labeled
  - Quantity controls with disabled states
  - Delete button with red accent styling
  - Fade-in animations for cart items
  - Grand total prominently displayed
  - Redesigned payment buttons with gradients and glow effects
- **Fixed Shop Item Rarity Display**:
  - Server-side: Added `rarity = Item.rarity` to shop slot creation (`modules/shops/server.lua:37`)
  - Client-side: Implemented proper rarity detection from multiple sources
  - Shop items now display correct rarity colors and borders
- **Fixed Payment Button Styling**:
  - Bank and Cash buttons now have consistent styling
  - White text with primary color highlight on hover
  - Smooth transitions and shadow effects

#### Crafting System
- Fixed quantity adjustment buttons being inverted
  - Minus (-) button now correctly decreases count
  - Plus (+) button now correctly increases count
  - Restored original button sizes and styling

#### Inventory Tab Management
- Auto-switch to Inventory tab when opening external inventories
  - Applies to: dumpsters, storage containers, vehicle trunks, etc.
  - Prevents staying on utility tab when accessing external storage
  - Users can still manually switch to utility view with 'E' key

#### Visual Fixes
- Fixed metadata description font not applying correctly in tooltips
  - Added explicit font-family rules for ReactMarkdown elements
  - Geist font now consistently applied to all tooltip content
- Fixed utility grid being draggable
  - Added `user-select: none` and `-webkit-user-drag: none` to grid containers
  - Character model image now non-interactive
  - Individual inventory slots remain draggable

### Bug Fixes

#### Item Durability/Decay System
- **CRITICAL**: Fixed decay system deleting all items instead of just one
  - Changed `Inventory.RemoveItem(inv, slot.name, slot.count, nil, slot.slot)` to `Inventory.RemoveItem(inv, slot.name, 1, slot.metadata, slot.slot)`
  - Now only removes the depleted item, not entire stack
  - Example: If you have 2 phone chargers, only the one at 0% durability is deleted
  - Location: `modules/items/server.lua:344`

#### Item Swapping Logic
- Fixed utility slot swap validation
  - Now validates both directions during item swaps
  - Prevents invalid equipment placement (e.g., backpack → vest slot)
  - Properly enforces slot restrictions:
    - Slots 1-4: Restricted to specific item types
    - Slots 5-6: Weapons only
    - Slots 7-9: Hotkey slots, no weapons allowed
  - Location: `web/src/components/inventory/InventorySlot.tsx:126-180`

#### Input Handling
- Fixed search input causing character movement and NUI conflicts
  - Changed all inventory opening events: `SetNuiFocusKeepInput(true)` → `SetNuiFocusKeepInput(false)`
  - Blocks all game input when inventory is open
  - Prevents WASD movement while typing in search
  - Prevents other NUIs from triggering while typing
  - Locations: `client.lua:348, 420, 1733`
  - Simplified search callback to not toggle input state

#### Rob Player System
- Fixed "attempt to call a nil value (global 'Inventory')" error
  - Added missing module import: `local Inventory = require 'modules.inventory.server'`
  - Rob player functionality now works correctly
  - Properly checks for backpacks when robbing
  - Location: `sv_escrow.lua:12`

### Technical Changes
- Updated TypeScript definitions to include `rarity` in `ItemData` type
- Optimized rarity detection with `useMemo` hook for performance
- Added proper variable initialization order to prevent React "temporal dead zone" errors
- Improved CSS custom properties system for dynamic theming

### Files Modified
- `web/src/components/inventory/InventorySlot.tsx`
- `web/src/components/inventory/ShopCart.tsx`
- `web/src/components/inventory/CraftingInformation.tsx`
- `web/src/components/inventory/index.tsx`
- `web/src/index.scss`
- `web/src/typings/item.ts`
- `web/src/main.tsx`
- `modules/items/server.lua`
- `modules/inventory/server.lua` (security patches)
- `modules/shops/server.lua`
- `modules/bridge/server.lua` (canRobPlayer function)
- `modules/bridge/qb/client.lua` (canSteal state)
- `modules/bridge/qb/server.lua` (canRobPlayer implementation)
- `modules/bridge/esx/client.lua` (canSteal state)
- `modules/bridge/qbx/client.lua` (canSteal state)
- `modules/bridge/nd/client.lua` (canSteal state)
- `server.lua` (security patches, showbpk fix)
- `client.lua`
- `sv_escrow.lua`

---

## Notes
- All changes are backward compatible
- No database migrations required
- Restart server required for Lua changes
- Web rebuild included in release

---
