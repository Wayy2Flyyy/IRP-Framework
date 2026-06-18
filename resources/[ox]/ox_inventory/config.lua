---Main Configuration File
---This file loads all sub-configurations and provides backward compatibility

-- Load sub-configs
Constants = require 'configs.constants'
BackpackConfig = require 'configs.backpack'
ArmorConfig = require 'configs.armor'

-- Main Config table for backward compatibility
Config = {}

-- Backpack Configuration (merged from BackpackConfig)
Config["Backpack"] = {
    owner = BackpackConfig.owner,
    requireItem = BackpackConfig.requireItem,
    itemName = BackpackConfig.itemName,
    slots = BackpackConfig.slots,
    maxWeight = BackpackConfig.maxWeight
}

-- Armor Configuration (merged from ArmorConfig)
Config.ArmorPlates = {
    PlateItem = ArmorConfig.plateItem,
    ArmorPerPlate = ArmorConfig.armorPerPlate,
    ArmorTypes = ArmorConfig.types
}

-- Backpack Prop Settings
Config["BackpackProp"] = {
    ["Enabled"] = BackpackConfig.prop.enabled,
    ["male"] = {
        ["DrawableID"] = BackpackConfig.prop.male.drawableId,
        ["Texture"] = BackpackConfig.prop.male.texture
    },
    ["female"] = {
        ["DrawableID"] = BackpackConfig.prop.female.drawableId,
        ["Texture"] = BackpackConfig.prop.female.texture
    }
}

-- Item Drops
Config["EnableItemDrops"] = true
Config["DefaultDropModel"] = Constants.DEFAULT_DROP_MODEL

Config["ItemDrops"] = {
    WEAPON_PISTOL = `w_pi_pistol`,
    burger = `prop_cs_burger_01`
}

-- Auto-Use Features
Config["Auto-Use"] = {
    ["Armor"] = Constants.AUTO_USE.ARMOR,
    ["Parachute"] = Constants.AUTO_USE.PARACHUTE,
    ["Reload"] = Constants.AUTO_USE.RELOAD
}

-- Backpack Blacklist (consolidated from BackpackConfig.items)
Config["BackpackBlacklist"] = BackpackConfig.items

-- Items Configuration
Config["Items"] = {
    ["CustomMetadata"] = {
        'water'
    }
}

-- Utility Slots (consolidated to use BackpackConfig.items and ArmorConfig.items)
Config["UtilitySlots"] = {
    BackpackConfig.items, -- Backpack Slot
    ArmorConfig.items,    -- Armour Slot
    {'phone', 'black_phone', 'yellow_phone', 'red_phone', 'green_phone', 'white_phone'},            -- Phone Slot
    {'parachute'},        -- Parachute Slot
}

-- Theme Configuration (loaded from data/themes.lua)
-- Using LoadResourceFile since data() function isn't available yet
local function loadThemes()
    local resource = GetCurrentResourceName()
    local themeFile = LoadResourceFile(resource, 'data/themes.lua')
    if themeFile then
        local func, err = load(themeFile, '@@' .. resource .. '/data/themes.lua')
        if func and not err then
            return func()
        end
    end
    -- Fallback to empty theme config
    return { current = "blue", themes = {} }
end

Config["Themes"] = loadThemes()
