---@meta

---@class ClientFuncs
---@field SetupInventorySettings fun(): nil
---@field GetPlayerLicense fun(): string|number
---@field CheckForBackpack fun(): boolean
---@field CheckParachuteItem fun(item: string, remove?: boolean): nil
---@field SendGiveUI fun(data: table): nil

ClientFuncs = {}

-- Load centralized framework module
local Framework = require 'modules.bridge.framework'

---@type table|nil ESX framework object
local ESX = nil
---@type table|nil QBCore framework object
local QBCore = nil

-- Framework detection and initialization using centralized module
Framework.Init(function()
    ESX = Framework.ESX
    QBCore = Framework.QBCore
end)

---@type number Previous armor value for tracking changes
local previousArmor = GetPedArmour(PlayerPedId())

---Updates the previous armor value for change detection
---@return nil
function updatePreviousArmor()
    previousArmor = GetPedArmour(PlayerPedId())
end

---Gets the gender of a freemode ped
---@param ped number The ped entity
---@return 'male'|'female' gender The gender of the ped
local function getFreemodeGender(ped)
    local model = GetEntityModel(ped)
    if model == `mp_m_freemode_01` then return 'male' end
    if model == `mp_f_freemode_01` then return 'female' end
    return 'male'
end

---@type table|nil Current theme data
local currentTheme = nil

---Gets the current theme from server
---@return table|nil theme The theme data
local function getCurrentTheme()
    if not currentTheme then
        currentTheme = lib.callback.await('akilla-inventory:getTheme', 200)
    end
    return currentTheme
end

---Sends theme data to NUI
---@param theme table The theme configuration
local function sendThemeToNUI(theme)
    if theme then
        SendNUIMessage({
            action = 'setTheme',
            data = theme
        })
    end
end

---Simple backpack detection that checks common names
---@param itemName string Item name to check
---@return boolean isBackpack
local function isBackpackItem(itemName)
    if not itemName then return false end
    local commonBackpacks = {
        'backpack',
        'small_backpack',
        'medium_backpack',
        'large_backpack',
        'tactical_backpack',
        'school_backpack',
        'hiking_backpack',
        'duffel_bag',
        'sports_bag'
    }
    local lowerName = string.lower(itemName)
    if string.find(lowerName, "backpack") or string.find(lowerName, "bag") then
        return true
    end
    for _, backpackName in ipairs(commonBackpacks) do
        if itemName == backpackName then
            return true
        end
    end
    local itemData = exports.ox_inventory:Items(itemName)
    if itemData and itemData.backpack == true then
        return true
    end
    return false
end

---Sets up inventory settings and sends them to NUI
---@return nil
function ClientFuncs.SetupInventorySettings()
    local data = {
        gender = getFreemodeGender(cache.ped),
        SpecialSlot = Config.UtilitySlots,
        blacklistedItems = Config.BackpackBlacklist
    }
    SendNUIMessage({ action = 'setupInventorySettings', data = data })
end

---Gets the player's license/identifier based on framework
---@return string|number license Player identifier
function ClientFuncs.GetPlayerLicense()
    local fw = GlobalState.fw
    if fw == 'esx' then
        return lib.callback.await('akilla-inventory:ESX:GetLicense', false)
    elseif fw == 'qb' then
        return exports["qb-core"]:GetCoreObject().Functions.GetPlayerData().cid
    elseif fw == 'qbx' then
        return QBX.PlayerData.cid
    end
end

---Checks for backpack item and syncs state using simplified pattern
---@return boolean hasBackpack Whether player has a backpack equipped
function ClientFuncs.CheckForBackpack()
    local allItems = exports.ox_inventory:GetPlayerItems()
    if not allItems then
        LocalPlayer.state:set('backpack', nil, true)
        TriggerServerEvent('akilla-inventory:SyncBackpackClothes', nil)
        return false
    end
    local slot = 1
    local data = slot and allItems[slot]
    if data and isBackpackItem(data.name) then
        local current = LocalPlayer.state.backpack
        if not data.metadata then
            data.metadata = {}
        end
        if not data.metadata.id then
            data.metadata.id = 'bp_' .. GetPlayerServerId(PlayerId()) .. '_' .. math.random(100000, 999999) .. '_' .. GetGameTimer()
        end
        local backpackData = {
            use = true,
            id = data.metadata.id,
            itemName = data.name
        }
        if not current or current.id ~= data.metadata.id then
            LocalPlayer.state:set('backpack', backpackData, true)
            TriggerServerEvent('akilla-inventory:SyncBackpackClothes', data.metadata.id)
        end
        return true
    end
    LocalPlayer.state:set('backpack', nil, true)
    TriggerServerEvent('akilla-inventory:SyncBackpackClothes', nil)
    return false
end

---Checks for backpack with streamlined pattern
---@return boolean
function ClientFuncs.CheckForBackpackStreamlined()
    local allItems = exports.ox_inventory:GetPlayerItems()
    local slot = 1
    local data = allItems and (slot and allItems[slot])
    if data and isBackpackItem(data.name) then
        data.metadata = data.metadata or {}
        if not data.metadata.id then
            data.metadata.id = 'bp_' .. GetPlayerServerId(PlayerId()) .. '_' .. math.random(100000, 999999) .. '_' .. GetGameTimer()
        end
        local backpackData = { use = true, id = data.metadata.id, itemName = data.name }
        LocalPlayer.state:set('backpack', backpackData, true)
        TriggerServerEvent('akilla-inventory:SyncBackpackClothes', data.metadata.id)
        return true
    end
    LocalPlayer.state:set('backpack', nil, true)
    TriggerServerEvent('akilla-inventory:SyncBackpackClothes', nil)
    return false
end

---Checks if the backpack slot is enabled
---@return boolean
local function shouldEnableBackpack()
    local allItems = exports.ox_inventory:GetPlayerItems()
    local slot = 1
    local data = allItems and (slot and allItems[slot])
    return data and isBackpackItem(data.name) and true or false
end

---Handles backpack clothes synchronization
---@param sourceId number Player source ID
---@param backpackId string|nil Backpack identifier
RegisterNetEvent('akilla-inventory:SetBackpackClothes', function(sourceId, backpackId)
    if not Config.BackpackProp.Enabled then return end
    local ped = GetPlayerPed(GetPlayerFromServerId(sourceId))
    if not DoesEntityExist(ped) then return end
    local gender = getFreemodeGender(ped)
    if not backpackId then
        ClearPedProp(ped, 5)
        SetPedComponentVariation(ped, 5, 0, 0, 2)
    else
        local props = Config.BackpackProp[gender]
        SetPedComponentVariation(ped, 5, props.DrawableID, props.Texture or 0, 2)
    end
end)

---Handles parachute item checking and equipment
---@param item string Item name
---@param remove? boolean Whether to remove parachute
---@return nil
function ClientFuncs.CheckParachuteItem(item, remove)
    if remove then return removeParachute() end
    SetTimeout(1000, function()
        local items = exports.ox_inventory:Search('slots', item)
        for _, k in ipairs(items or {}) do
            if k.slot == 4 then
                local chute = `GADGET_PARACHUTE`
                GiveWeaponToPed(cache.ped, chute, 0, true, false)
                SetPedGadget(cache.ped, chute, true)
                lib.requestModel(1269906701)
                SetPlayerParachuteTintIndex(PlayerId(), k.metadata?.type or -1)
                client.parachute = { CreateParachuteBagObject(cache.ped, true, true), k.metadata?.type or -1 }
            end
        end
    end)
end

-- Armor System
---Checks if an item is an armor item
---@param itemName string
---@return boolean
local function isArmorItem(itemName)
    return itemName == 'armour' or 
           itemName == 'light_armor' or 
           itemName == 'heavy_armor' or 
           itemName == 'pd_armor'
end

-- Update the CheckArmorItem function:
function ClientFuncs.CheckArmorItem(item, remove, to)
    if not item then return end
    
    if remove then
        -- Logic for removing armor
        SetPedArmour(cache.ped or PlayerPedId(), 0)
        TriggerServerEvent('SK-Inventory:UpdateArmor', 0, to or CONSTANTS.ARMOR_SLOT)
    else
        -- Logic for equipping armor - check all armor types
        if isArmorItem(item) then
            -- Apply armor when equipped
            TriggerServerEvent("SK-Inventory:Server:ReApplyPlates")
        end
    end
end

-- Update the NUI callbacks to check for all armor types:
RegisterNUICallback('insertplate', function(data, cb)
    -- Get slot 2 (armor slot) from player inventory
    local playerItems = exports.ox_inventory:GetPlayerItems()
    local slot2Item = playerItems and playerItems[2]
    
    if slot2Item and isArmorItem(slot2Item.name) then
        local success = lib.progressBar({
            duration = 3000,
            label = 'Inserting armor plates...',
            useWhileDead = false,
            canCancel = true,
            disable = {
                car = true,
                move = true,
                combat = true,
                mouse = false
            },
            anim = {
                dict = 'clothingtie',
                clip = 'try_tie_positive_a'
            }
        })
        if success then
            TriggerServerEvent('armor:insertPlate')
        end    
    else
        lib.notify({ 
            type = "error", 
            description = "No armor in slot" 
        })
    end
    cb(1) -- Changed from 'ok' to 1
end)

RegisterNUICallback('removeplates', function(data, cb)
    -- Get slot 2 (armor slot) from player inventory
    local playerItems = exports.ox_inventory:GetPlayerItems()
    local slot2Item = playerItems and playerItems[2]
    
    if slot2Item and isArmorItem(slot2Item.name) then
        local success = lib.progressBar({
            duration = 3000,
            label = 'Removing armor plates...',
            useWhileDead = false,
            canCancel = true,
            disable = {
                car = true,
                move = true,
                combat = true,
                mouse = false
            },
            anim = {
                dict = 'clothingtie',
                clip = 'try_tie_positive_a'
            }
        })
        if success then
            TriggerServerEvent('armor:removePlates')
        end
    else
        lib.notify({ 
            type = "error", 
            description = "No armor in slot" 
        })
    end
    cb(1) -- Changed from 'ok' to 1
end)

---Applies armor from rejoin data
---@param decoded table Armor data containing plates count
RegisterNetEvent("akilla-inventory:Client:ApplyArmorFromRejoin", function(decoded)
    if type(decoded) == 'table' then
        SetPedArmour(PlayerPedId(), math.min(decoded.plates * Config.ArmorPlates.ArmorPerPlate, 100))
    end
end)

---Client event: update theme immediately
---@param theme table Theme data
RegisterNetEvent('akilla-inventory:themeChanged', function(theme)
    currentTheme = theme
    sendThemeToNUI(theme)
end)

---Sets up inventory settings with theme and sends them to NUI
---@return nil
function ClientFuncs.SetupInventorySettings()
    local theme = getCurrentTheme()
    local data = {
        gender = getFreemodeGender(cache.ped),
        SpecialSlot = Config.UtilitySlots,
        blacklistedItems = Config.BackpackBlacklist,
        theme = theme
    }
    SendNUIMessage({ action = 'setupInventorySettings', data = data })
    sendThemeToNUI(theme)
end

---Command for previewing themes (admin/dev tool)
RegisterCommand('previewtheme', function(source, args)
    if args[1] then
        TriggerServerEvent('akilla-inventory:changeTheme', args[1])
    else
        lib.notify({
            type = 'info',
            description = 'Usage: /previewtheme [theme_name]'
        })
    end
end, false)

---Monitors armor changes with damage reduction
local function monitorArmor()
    while true do
        Wait(1500)
        local ped = PlayerPedId()
        local veh = GetVehiclePedIsIn(ped, false)
        
        if veh and veh ~= 0 then
            local currentArmor = GetPedArmour(ped)
            
            if currentArmor < previousArmor then
                
                TriggerServerEvent('armor:maybeRemovePlate', currentArmor)
            end
            
            previousArmor = currentArmor
        else
            previousArmor = GetPedArmour(PlayerPedId())
        end
    end
end

---Handles damage events for armor with type-specific reduction
AddEventHandler('gameEventTriggered', function(event, args)
    if event == 'CEventNetworkEntityDamage' and args[1] == PlayerPedId() then
        local currentArmor = GetPedArmour(PlayerPedId())
        
        if currentArmor < previousArmor then
            local damageTaken = previousArmor - currentArmor
            
            -- Get armor item from slot 2
            local playerItems = exports.ox_inventory:GetPlayerItems()
            local armor = playerItems and playerItems[2]
            
            TriggerServerEvent('armor:maybeRemovePlate', currentArmor)
        end
        
        previousArmor = currentArmor
    end
end)

---Handles player spawn event
AddEventHandler('playerSpawned', function()
    Wait(1000)
    updatePreviousArmor()
end)

---Syncs armor state (from server)
RegisterNetEvent("armor:syncArmor", updatePreviousArmor)

---Sends give UI data to NUI
---@param data table Player list and item data
---@return nil
function ClientFuncs.SendGiveUI(data)
    SendNUIMessage({ action = 'UpdatePlayerList', data = data })
end

