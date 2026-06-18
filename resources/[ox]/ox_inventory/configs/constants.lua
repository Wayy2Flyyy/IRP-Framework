---@class Constants
---Application-wide constants and magic numbers
Constants = {}

-- Timing Constants
Constants.BACKPACK_CHECK_INTERVAL = 5000 -- ms - How often to check for backpack changes
Constants.FRAMEWORK_INIT_DELAY = 5000 -- ms - Wait time for framework initialization

-- Item Drop Constants
Constants.DEFAULT_DROP_MODEL = "prop_paper_bag_01"

-- Auto-use features
Constants.AUTO_USE = {
    ARMOR = true, -- Auto use armor in armor slot
    PARACHUTE = true, -- Auto use parachute in parachute slot
    RELOAD = false -- Auto reload weapon when it runs out of ammo
}

-- Debug Settings
Constants.DEBUG = {
    ENABLED = false, -- Master debug flag
    BACKPACK = false, -- Debug backpack system
    ARMOR = false, -- Debug armor system
    INVENTORY = false -- Debug inventory operations
}

return Constants
