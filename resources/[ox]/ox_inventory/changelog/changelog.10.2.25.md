# Changelog

All notable changes to ox_inventory will be documented in this file.

## [2025-10-02] - Qbox Framework Compatibility & UI Improvements

### UI/UX Improvements

#### Inventory Tab Key Handling
- **Split exit listeners into separate hooks** for better control
  - `useExitListener`: Handles Escape key only
  - `useTabExitListener`: Handles Tab key with smart timing
  - Added `inventoryReady` state to track when inventory is fully loaded
  - Added 200ms delay before Tab listener activates to prevent race condition
  - Prevents Tab from closing inventory when held during opening
  - Locations: `web/src/hooks/useExitListener.ts`, `web/src/components/inventory/index.tsx`

#### Horizontal Scroll Prevention
- **Fixed utility view horizontal scrolling issue**
  - Slots no longer become hidden when mouse wheel scrolling
  - Added `overflow-x-hidden` to container elements
  - Added wheel event listener to prevent horizontal scroll
  - Locations: `web/src/components/inventory/InventoryGrid.tsx`

### Bug Fixes

#### TypeScript Build Errors
- **Fixed 22 TypeScript compilation errors**
  - Added missing `fetchNui` import to InventoryGrid.tsx
  - Fixed React icon type errors by converting from JSX to function calls
  - Added null safety checks in InventoryContext.tsx
  - Added missing properties to ItemData type (`weapon?`, `durability?`)
  - Fixed null safety in ShopCart.tsx with intermediate variables
  - Locations: Multiple web/src files

#### Dumpster Inventory System
- **CRITICAL: Fixed dumpster inventory not opening**
  - Root cause: Dumpster entities are not networked (can't get network IDs)
  - Simplified system to ALWAYS use coordinates instead of network IDs
  - Removed `networkdumpsters` convar (no longer needed)
  - Modified client-side `OpenDumpster` to always send coordinates
  - Modified server-side to always use coordinate-based lookup
  - Error "you can not open inventory" now resolved
  - Locations: `modules/inventory/client.lua`, `server.lua:337-346`

#### Rob Player System (Qbox Framework)
- **Added Qbox-specific `canRobPlayer` function**
  - Checks if target player is dead, in last stand, or handcuffed
  - Also checks `canSteal` state as fallback
  - Added debug logging for troubleshooting
  - Production-ready with proper permission checks enabled
  - Location: `modules/bridge/qbx/server.lua:148-172`

- **Fixed rob player crash when no nearby player found**
  - Added null check for `targetId` before proceeding
  - Returns proper error notification instead of script crash
  - Error "attempt to index a number value (local 'closestPlayer')" resolved
  - Location: `client.lua:231-249`

- **Simplified steal menu**
  - Removed menu choice between "Steal Player Inventory" and "Steal Backpack Inventory"
  - Now directly opens player inventory (already shows all items including backpack)
  - Cleaner, faster user experience
  - Location: `client.lua:807-809`

### Technical Changes
- Updated TypeScript type definitions for ItemData interface
- Improved React hook architecture for event handling
- Enhanced null safety throughout codebase
- Optimized event listener management with proper cleanup

### Framework Compatibility
- **Qbox Framework**: Full compatibility with rob player functionality
  - Checks `PlayerData.metadata.isdead`, `metadata.inlaststand`
  - Checks `PlayerData.metadata.ishandcuffed`
  - Uses `Player.state.canSteal` as fallback
  - Debug logging included for troubleshooting

### Files Modified
- `web/src/hooks/useExitListener.ts` (split into two hooks)
- `web/src/components/inventory/index.tsx` (inventoryReady state)
- `web/src/components/inventory/InventoryGrid.tsx` (scroll prevention, fetchNui import)
- `web/src/components/inventory/InventoryContext.tsx` (null safety)
- `web/src/components/inventory/ShopCart.tsx` (null safety)
- `web/src/typings/item.ts` (weapon/durability properties)
- `modules/inventory/client.lua` (simplified dumpster system)
- `modules/bridge/qbx/server.lua` (canRobPlayer function)
- `server.lua` (coordinate-based dumpster lookup)
- `client.lua` (rob player null checks, simplified steal menu)

---

## Notes
- All changes are backward compatible
- Web rebuild required for UI/UX changes (`pnpm build` in web directory)
- Restart server required for Lua changes
- Qbox framework users: Rob player functionality now fully operational
- Debug logging active in `canRobPlayer` for troubleshooting

---
