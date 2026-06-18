---@class ArmorConfig
---Armor plate system configuration
ArmorConfig = {}

-- Core armor plate settings
ArmorConfig.plateItem = 'armor_plate' -- The item name for armor plates
ArmorConfig.armorPerPlate = 20 -- Amount of armor points each plate provides

-- Armor type definitions
-- Each armor type has a maximum number of plates and a display name
ArmorConfig.types = {
    ['light_armor'] = {
        maxPlates = 2,
        displayName = 'Light Armor'
    },
    ['armour'] = {
        maxPlates = 3,
        displayName = 'Standard Armor'
    },
    ['heavy_armor'] = {
        maxPlates = 4,
        displayName = 'Heavy Armor'
    },
    ['pd_armor'] = {
        maxPlates = 5,
        displayName = 'Police Armor'
    }
}

-- List of all armor item names (derived from types)
ArmorConfig.items = {}
for itemName, _ in pairs(ArmorConfig.types) do
    table.insert(ArmorConfig.items, itemName)
end

return ArmorConfig
