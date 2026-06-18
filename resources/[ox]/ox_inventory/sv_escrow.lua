---@meta

---@class ServerFuncs
---@field getIdentifier fun(source: number): string|nil
---@field GetBankBal fun(source: number): number
---@field RemoveMoney fun(source: number, amount: number, reason?: string): boolean

ServerFuncs = {}

-- Load centralized framework module
local Framework = require 'modules.bridge.framework'
local Inventory = require 'modules.inventory.server'

---@type table|nil ESX framework object
local ESX = nil
---@type table|nil QBCore framework object
local QBCore = nil
---@type table|nil QBX framework object
local QBX = nil

---@type string|nil Current framework type
local fw = nil

-- Framework detection and initialization using centralized module
Framework.Init(function()
    ESX = Framework.ESX
    QBCore = Framework.QBCore
    QBX = Framework.QBX
    fw = Framework.type

    -- Only register default backpack if owner is false (shared backpack system)
    if not Config.Backpack.owner then
        exports.ox_inventory:RegisterStash('backpack', 'Backpack', Config.Backpack.slots, Config.Backpack.maxWeight, true)
    end
end)

---Gets player object based on current framework
---@param source number Player source ID
---@return table|nil player Player object or nil if not found
local function GetPlayer(source)
    return Framework.GetPlayer(source)
end

---Gets player identifier based on framework
---@param source number Player source ID
---@return string|nil identifier Player identifier
function ServerFuncs.getIdentifier(source)
    local player = GetPlayer(source)
    return player and (player.getIdentifier and player.getIdentifier() or player.PlayerData.citizenid)
end

---Gets player bank balance
---@param source number Player source ID
---@return number balance Bank balance
function ServerFuncs.GetBankBal(source)
    local player = GetPlayer(source)
    if not player then return 0 end
    if fw == 'esx' then return player.getAccount('bank').money end
    return player.PlayerData.money.bank
end

---Removes money from player account
---@param source number Player source ID
---@param amount number Amount to remove
---@param reason? string Reason for removal
---@return boolean success Whether money was removed successfully
function ServerFuncs.RemoveMoney(source, amount, reason)
    local player = GetPlayer(source)
    if not player then return false end
    if fw == 'esx' then return player.removeAccountMoney('bank', amount) end
    return player.Functions.RemoveMoney('bank', amount, reason)
end

---Gets backpack properties from item definition
---@param itemName string The backpack item name
---@return number slots, number maxWeight
local function getBackpackProperties(itemName)
    local itemData = exports.ox_inventory:Items(itemName)
    if not itemData then
        return Config.Backpack.slots, Config.Backpack.maxWeight
    end
    local slots = itemData.bp_slot or Config.Backpack.slots
    local maxWeight = (itemData.bp_weight or Config.Backpack.maxWeight) * 1000 -- Convert kg to grams
    return slots, maxWeight
end

---Checks if item is a backpack
---@param itemName string Item name to check
---@return boolean isBackpack
local function isBackpackItem(itemName)
    if not itemName then return false end
    local itemData = exports.ox_inventory:Items(itemName)
    if itemData and itemData.backpack == true then
        return true
    end
    local backpackItems = Config.UtilitySlots[1] or {}
    for _, backpackItem in ipairs(backpackItems) do
        if itemName == backpackItem then
            return true
        end
    end
    for _, backpackItem in ipairs(Config.BackpackBlacklist) do
        if itemName == backpackItem then
            return true
        end
    end
    return false
end

---Registers a backpack stash with properties from item definition
---@param stashId string The stash identifier
---@param itemName string The backpack item name
local function registerBackpackStash(stashId, itemName)
    local slots, maxWeight = getBackpackProperties(itemName)
    exports.ox_inventory:RegisterStash(stashId, 'Backpack', slots, maxWeight, false)
end

---Gets backpack item from player inventory
---@param source number Player source ID
---@return table|nil backpackItem
local function getPlayerBackpackItem(source)
    local backpack = exports.ox_inventory:GetSlot(source, 1)
    if backpack and isBackpackItem(backpack.name) then
        return backpack
    end
    return nil
end

-- Callbacks

---Checks if target player has a backpack and returns its properties
---@param _ any Unused callback source
---@param targetid number Target player ID
---@return table|false backpackInfo Whether target has backpack and its properties
lib.callback.register('akilla-inventory:GetBackpackItem', function(_, targetid)
    local PlayerState = Player(targetid).state
    local BackpackState = PlayerState.backpack

    if BackpackState == nil then
        return false
    end

    local playerInventory = Inventory(targetid)
    if not playerInventory or not playerInventory.items then
        return false
    end

    local slot = 1
    local backpackItem = playerInventory.items[slot]

    if not backpackItem or not isBackpackItem(backpackItem.name) then
        return false
    end

    local slots, maxWeight = getBackpackProperties(backpackItem.name)

    return {
        hasBackpack = true,
        slots = slots,
        maxWeight = maxWeight,
        id = BackpackState.id,
        itemName = backpackItem.name
    }
end)

---Gets the current theme configuration
---@return table theme The theme configuration
local function getCurrentTheme()
    local currentThemeName = Config.Themes.current or "default"
    local theme = Config.Themes.themes[currentThemeName]
    if not theme then
        print("^3[WARNING]^7 Theme '" .. currentThemeName .. "' not found, falling back to default theme")
        theme = Config.Themes.themes["default"]
    end
    return {
        name = currentThemeName,
        displayName = theme.name,
        colors = theme.colors
    }
end

lib.callback.register('akilla-inventory:getTheme', function(source)
    return getCurrentTheme()
end)

RegisterNetEvent('akilla-inventory:changeTheme', function(themeName)
    local source = source
    if Config.Themes.themes[themeName] then
        Config.Themes.current = themeName
        TriggerClientEvent('akilla-inventory:themeChanged', -1, getCurrentTheme())
        print("^2[INFO]^7 Theme changed to: " .. themeName .. " by player " .. source)
    else
        TriggerClientEvent('ox_lib:notify', source, {
            type = 'error',
            description = 'Invalid theme name: ' .. themeName
        })
    end
end)

lib.callback.register('akilla-inventory:ESX:GetLicense', function(source)
    return GetPlayer(source)?.getIdentifier()
end)

lib.callback.register("sk-inv:getIdent", function(src)
    return ServerFuncs.getIdentifier(src)
end)

-- Events

RegisterNetEvent('akilla-inventory:RemoveParachute', function()
    exports.ox_inventory:RemoveItem(source, 'parachute', 1)
end)

---Updates armor item metadata
---@param value number New armor value
---@param slot number Armor slot number
RegisterNetEvent('akilla-inventory:UpdateArmor', function(value, slot)
    local armor = exports.ox_inventory:GetSlot(source, slot)
    if armor then
        armor.metadata.value = value
        exports.ox_inventory:SetMetadata(source, armor.slot, armor.metadata)
    end
end)

---Syncs backpack clothes and registers dynamic stash
---@param backpackId string|nil Backpack identifier
RegisterNetEvent('akilla-inventory:SyncBackpackClothes', function(backpackId)
    TriggerClientEvent('akilla-inventory:SetBackpackClothes', -1, source, backpackId)
    if backpackId and Config.Backpack.owner then
        local backpackItem = getPlayerBackpackItem(source)
        if backpackItem then
            local stashId = 'backpack-' .. backpackId
            registerBackpackStash(stashId, backpackItem.name)
        end
    end
end)

RegisterServerEvent("akilla-inventory:Armor:GetIdentifier", function()
    TriggerClientEvent("akilla-inventory:Armor:RecieveIdentifier", source, ServerFuncs.getIdentifier(source))
end)

AddEventHandler('ox_inventory:itemEquipped', function(source, item, slot)
    if slot == 1 and isBackpackItem(item.name) and Config.Backpack.owner then
        local PlayerState = Player(source).state
        local BackpackState = PlayerState.backpack
        if BackpackState then
            local stashId = 'backpack-' .. BackpackState.id
            registerBackpackStash(stashId, item.name)
        end
    end
end)

-- Armor logic

---@type number Current armor plates count
local currentArmorPlates = 0

---Calculates armor value from plates
---@param plates number Number of plates
---@return number armor Calculated armor value
local function calculateArmor(plates)
    return math.min(plates * Config.ArmorPlates.ArmorPerPlate, 100)
end

---Calculates plates from armor value
---@param armor number Current armor value
---@return number plates Number of plates
local function calcPlatesFromArmor(armor)
    if armor >= 100 then return 5
    elseif armor > 80 then return 4
    elseif armor > 60 then return 3
    elseif armor > 40 then return 2
    elseif armor > 20 then return 1
    else return 0 end
end

---Gets armor configuration for item
---@param itemName string
---@return table|nil
local function getArmorConfig(itemName)
    return Config.ArmorPlates.ArmorTypes[itemName]
end

---Inserts armor plate into vest
RegisterNetEvent('armor:insertPlate', function()
    local src = source
    local armor = exports.ox_inventory:GetSlot(src, 2)
    
    if not armor then
        return TriggerClientEvent("ox_lib:notify", src, {
            type = "error",
            description = "No Vest In Armor Slot"
        })
    end

    -- Get armor configuration
    local armorConfig = getArmorConfig(armor.name)
    if not armorConfig then
        -- If no config found, use defaults
        armorConfig = {
            maxPlates = Config.ArmorPlates.MaxPlates or 5
        }
    end
    
    local plates = armor.metadata.plates or 0
    local maxPlates = armorConfig.maxPlates
    
    if plates >= maxPlates then
        return TriggerClientEvent("ox_lib:notify", src, {
            type = 'error',
            description = string.format('Vest is full (%d/%d plates)', plates, maxPlates)
        })
    end

    local plateCount = exports.ox_inventory:GetItemCount(src, Config.ArmorPlates.PlateItem)

    if plateCount < 1 then
        return TriggerClientEvent("ox_lib:notify", src, { 
            type = 'error', 
            description = 'You need armor plates!' 
        })
    end
    
    -- Try to remove the item
    local removed = exports.ox_inventory:RemoveItem(src, Config.ArmorPlates.PlateItem, 1)
    
    if removed then
        plates = plates + 1
        currentArmorPlates = plates
        
        exports.ox_inventory:SetMetadata(src, armor.slot, { 
            plates = plates,
            maxPlates = maxPlates,
            armorType = armor.name,
            rarity = armor.metadata.rarity 
        })
        
        local ident = ServerFuncs.getIdentifier(src)
        GlobalState["aki-inv-" .. ident] = { 
            plates = plates, 
            hasPlates = true,
            armorType = armor.name 
        }
        SetResourceKvp("akilla-inventory-armor-plates-" .. ident, json.encode(GlobalState["aki-inv-" .. ident]))
        SetPedArmour(GetPlayerPed(src), calculateArmor(plates))
        TriggerClientEvent("armor:syncArmor", src)
        TriggerClientEvent("ox_lib:notify", src, {
            type = 'success',
            description = string.format('Plate inserted (%d/%d)', plates, maxPlates)
        })
    else
        TriggerClientEvent("ox_lib:notify", src, {
            type = 'error',
            description = 'Failed to remove armor plates!'
        })
    end
end)

---Removes armor plates from vest and returns them to inventory
RegisterNetEvent('armor:removePlates', function()
    local src = source
    local armor = exports.ox_inventory:GetSlot(src, 2)
    
    if not armor then 
        return TriggerClientEvent("ox_lib:notify", src, { 
            type = "error", 
            description = "No Vest In Armor Slot" 
        }) 
    end
    
    local plates = armor.metadata.plates or 0
    
    if plates <= 0 then
        return TriggerClientEvent("ox_lib:notify", src, { 
            type = 'error', 
            description = 'No plates to remove'
        })
    end
    
    -- Add plates back to inventory
    local success = exports.ox_inventory:AddItem(src, Config.ArmorPlates.PlateItem, plates)
    
    if success then
        -- Get armor configuration
        local armorConfig = getArmorConfig(armor.name)
        if not armorConfig then
            armorConfig = {
                maxPlates = Config.ArmorPlates.MaxPlates or 5,
            }
        end
        
        -- Update armor metadata to remove plates
        exports.ox_inventory:SetMetadata(src, armor.slot, { 
            plates = 0,
            maxPlates = armorConfig.maxPlates,
            armorType = armor.name,
            rarity = armor.metadata.rarity 
        })
        
        -- Update global state
        local ident = ServerFuncs.getIdentifier(src)
        GlobalState["aki-inv-" .. ident] = { 
            plates = 0, 
            hasPlates = false,
            armorType = armor.name 
        }
        SetResourceKvp("akilla-inventory-armor-plates-" .. ident, json.encode(GlobalState["aki-inv-" .. ident]))
        
        -- Remove armor value from player
        SetPedArmour(GetPlayerPed(src), 0)
        TriggerClientEvent("armor:syncArmor", src)
        
        TriggerClientEvent("ox_lib:notify", src, { 
            type = 'success', 
            description = string.format('Removed %d plates from vest', plates)
        })
    else
        TriggerClientEvent("ox_lib:notify", src, { 
            type = 'error', 
            description = 'Not enough inventory space for plates!' 
        })
    end
end)

---Handles armor damage with type-specific reduction
RegisterNetEvent('armor:maybeRemovePlate', function(currArmour)
    local src = source
    local ident = ServerFuncs.getIdentifier(src)
    if not ident then return end
    
    local slot = 2
    local armor = exports.ox_inventory:GetSlot(src, slot)
    if not armor or not armor.metadata.plates then return end
    
    -- Get armor configuration for damage reduction
    local armorConfig = getArmorConfig(armor.name)
    if not armorConfig then return end
    
    -- Apply damage reduction based on armor type
    local actualDamage = currArmour
    if armor.metadata then
        -- This is handled client-side, but we track it here for consistency
        local newCount = calcPlatesFromArmor(actualDamage)
        
        if newCount ~= armor.metadata.plates then
            GlobalState["aki-inv-" .. ident] = GlobalState["aki-inv-" .. ident] or {}
            GlobalState["aki-inv-" .. ident].plates = newCount
            GlobalState["aki-inv-" .. ident].armorType = armor.name
            SetResourceKvp("akilla-inventory-armor-plates-" .. ident, json.encode(GlobalState["aki-inv-" .. ident]))
            
            exports.ox_inventory:SetMetadata(src, armor.slot, { 
                plates = newCount,
                maxPlates = armorConfig.maxPlates,
                armorType = armor.name,
                    rarity = armor.metadata.rarity 
            })
        end
    end
end)

---Re-applies armor plates after equipment
RegisterServerEvent("akilla-inventory:Server:ReApplyPlates", function()
    local src = source
    Wait(250)
    local armor = exports.ox_inventory:GetSlot(src, 2)
    if armor then
        local newArmor = calculateArmor(armor.metadata.plates or 0)
        TriggerClientEvent('akilla-inventory:setArmor', src, newArmor)
    end
end)

lib.addCommand('setinvtheme', {
    help = 'Change the inventory theme',
    params = {
        { name = 'theme', type = 'string', help = 'Theme name (default, dark, blue, purple, red, green, custom)' }
    },
    restricted = 'group.admin',
}, function(source, args)
    local themeName = args.theme
    if Config.Themes.themes[themeName] then
        Config.Themes.current = themeName
        TriggerClientEvent('akilla-inventory:themeChanged', -1, getCurrentTheme())
        TriggerClientEvent('ox_lib:notify', source, {
            type = 'success',
            description = 'Theme changed to: ' .. Config.Themes.themes[themeName].name
        })
    else
        TriggerClientEvent('ox_lib:notify', source, {
            type = 'error',
            description = 'Available themes: ' .. table.concat(table.keys(Config.Themes.themes), ', ')
        })
    end
end)

---Handles player disconnection - returns plates to inventory
AddEventHandler('playerDropped', function()
    local src = source
    local armor = exports.ox_inventory:GetSlot(src, 2)
    if armor and armor.metadata.plates then
        exports.ox_inventory:AddItem(src, Config.ArmorPlates.PlateItem, armor.metadata.plates)
        exports.ox_inventory:SetMetadata(src, armor.slot, { 
            plates = 0, 
            rarity = armor.metadata.rarity 
        })
    end
end)

-- Drop Props System

---@type table<string, number> Item drop model mappings
local dropItems = Config.ItemDrops
local defaultDropModel = Config.DefaultDropModel

---Hook for handling item drops with custom props
---@param payload table Drop payload containing item and player data
---@return boolean success Whether the drop was handled
exports.ox_inventory:registerHook('swapItems', function(payload)
    if payload.toInventory ~= 'newdrop' then return end

    local item = payload.fromSlot
    ---@type table[] Items array for drop
    local items = { { item.name, payload.count, item.metadata } }

    local dropModel = dropItems[item.name] or defaultDropModel
    local dropId = exports.ox_inventory:CustomDrop(
        item.label,
        items,
        GetEntityCoords(GetPlayerPed(payload.source)),
        50,
        99999999,
        nil,
        dropModel
    )

    if not dropId then 
        print("ERROR: Failed to create drop for item: " .. item.name)
        return 
    end

    CreateThread(function()
        exports.ox_inventory:RemoveItem(payload.source, item.name, item.count, nil, item.slot)
        Wait(0)
        exports.ox_inventory:forceOpenInventory(payload.source, 'drop', dropId)
    end)

    return false
end, {
    typeFilter = { 
        player = true,
        backpack = true
    }
})

CreateThread(function()
    Wait(1000)
    print("^2[LOADED]^7 - ^1PRODIGY INVENTORY V2^7 - CREATED BY ^5AKILLA DEVELOPMENTS^7")
end)

--[[
    EmmyLua Stub
    =============
    ---@type ServerFuncs
    local ServerFuncs = {
        getIdentifier = function(source) return "" end,
        GetBankBal = function(source) return 0 end,
        RemoveMoney = function(source, amount, reason) return false end
    }
]]
