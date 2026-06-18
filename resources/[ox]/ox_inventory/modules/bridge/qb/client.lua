local QBCore = exports['qb-core']:GetCoreObject()
local Inventory = require 'modules.inventory.client'
local Weapon = require 'modules.weapon.client'

---@class PlayerDataType
---@field loaded boolean
---@field dead boolean
---@field groups table<string, number>
---@field cuffed boolean

---@type PlayerDataType
PlayerData = PlayerData or {}

---Callback for when player is unloaded (logout)
RegisterNetEvent('QBCore:Client:OnPlayerUnload', client.onLogout)

---Handles player data updates (job, gang, death state)
---@param data table Player data
RegisterNetEvent('QBCore:Player:SetPlayerData', function(data)
    if source == '' or not PlayerData.loaded then return end

    -- Update death state
    if (data.metadata.isdead or data.metadata.inlaststand) ~= PlayerData.dead then
        PlayerData.dead = data.metadata.isdead or data.metadata.inlaststand
        OnPlayerData('dead', PlayerData.dead)
        -- Set canSteal state when player is dead/downed
        LocalPlayer.state:set('canSteal', PlayerData.dead, true)
    end

    local groups = PlayerData.groups
    -- Update job/gang group/grade if changed
    if not groups[data.job.name] or not groups[data.gang.name]
      or groups[data.job.name] ~= data.job.grade.level
      or groups[data.gang.name] ~= data.gang.grade.level then
        PlayerData.groups = {
            [data.job.name] = data.job.grade.level,
            [data.gang.name] = data.gang.grade.level,
        }
        OnPlayerData('groups', PlayerData.groups)
    end
end)

---Toggle player cuffed state (and disarm if cuffed)
RegisterNetEvent('police:client:GetCuffed', function()
    PlayerData.cuffed = not PlayerData.cuffed
    LocalPlayer.state:set('invBusy', PlayerData.cuffed, false)
    -- Set canSteal state when player is cuffed
    LocalPlayer.state:set('canSteal', PlayerData.cuffed, true)
    if PlayerData.cuffed then
        Weapon.Disarm()
    end
end)

---Set player status values (hunger, thirst, stress)
---@param values table<string, number>
function client.setPlayerStatus(values)
    for name, value in pairs(values) do
        -- Compatibility for ESX style values
        if value > 100 or value < -100 then
            value = value * 0.0001
        end

        if name == "hunger" then
            TriggerServerEvent('consumables:server:addHunger',
                QBCore.Functions.GetPlayerData().metadata.hunger + value)
        elseif name == "thirst" then
            TriggerServerEvent('consumables:server:addThirst',
                QBCore.Functions.GetPlayerData().metadata.thirst + value)
        elseif name == "stress" then
            if value > 0 then
                TriggerServerEvent('hud:server:GainStress', value)
            else
                value = math.abs(value)
                TriggerServerEvent('hud:server:RelieveStress', value)
            end
        end
    end
end

---Check if player has specified item(s)
---@param items string|string[]
---@param amount number|nil
---@return boolean
local function hasItem(items, amount)
    amount = amount or 1

    if type(items) == 'table' then
        for _, v in pairs(items) do
            if Inventory.GetItemCount(v) < amount then
                return false
            end
        end
        return true
    else
        return Inventory.GetItemCount(items) >= amount
    end
end

---React to inv_busy state changes
AddStateBagChangeHandler('inv_busy', ('player:%s'):format(cache.serverId), function(_, _, value)
    LocalPlayer.state:set('invBusy', value, false)
end)

---Export for qb-inventory compatibility
AddEventHandler(('__cfx_export_qb-inventory_HasItem'), function(setCB)
    setCB(hasItem)
end)
