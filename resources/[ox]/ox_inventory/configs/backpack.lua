---@class BackpackConfig
---Backpack system configuration
BackpackConfig = {}

-- Core backpack settings
BackpackConfig.owner = true -- Each backpack item has its own unique inventory (realistic)
BackpackConfig.requireItem = true -- Need the item to have the inv open
BackpackConfig.itemName = "backpack" -- The item name for the backpack if requireItem is true

-- Default backpack capacity (used as fallback when bp_slot/bp_weight not defined)
BackpackConfig.slots = 20 -- Default amount of slots
BackpackConfig.maxWeight = 40 -- Default max weight in kg

-- List of all backpack item names
-- This is the single source of truth for backpack items
BackpackConfig.items = {
    'backpack',
    'backpack_medium',
    'backpack_large',
    'tactical_backpack'
}

-- Backpack prop settings (visual backpack on player)
BackpackConfig.prop = {
    enabled = false,
    male = {
        drawableId = 45,
        texture = 0
    },
    female = {
        drawableId = 45,
        texture = 0
    }
}

--[[
NOTE: Individual backpack capacities are now defined in the item definitions using:
- bp_slot: Number of inventory slots
- bp_weight: Weight capacity in kilograms
- backpack: Boolean (true) to identify the item as a backpack

Example item definition:
['backpack'] = {
    label = 'Small Backpack',
    weight = 220,
    bp_weight = 40, -- 40kg capacity
    bp_slot = 20,   -- 20 slots
    backpack = true, -- Identifies as backpack
    stack = false,
    close = true,
    description = 'A small backpack for carrying basic items.'
}
--]]

return BackpackConfig
