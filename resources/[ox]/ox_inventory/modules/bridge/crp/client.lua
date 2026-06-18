local Inventory = require 'modules.inventory.client'
local Weapon = require 'modules.weapon.client'

local FW

local function core()
    if FW then return FW end
    if GetResourceState('fw-core') ~= 'started' then return nil end
    FW = exports['fw-core']:GetCoreObject()
    return FW
end

PlayerData = PlayerData or {}

-- ---------------------------------------------------------------------------
-- groups / state from a PlayerData payload
-- ---------------------------------------------------------------------------

local function applyState(data)
    if not data then return end

    if data.job then
        local grade = data.job.grade and data.job.grade.level
        local groups = { [data.job.name] = tonumber(grade) or 0 }
        PlayerData.groups = groups
        OnPlayerData('groups', groups)
    end

    local md = data.metadata
    if md then
        local dead = md.isdead or md.inlaststand or false
        if dead ~= PlayerData.dead then
            PlayerData.dead = dead
            OnPlayerData('dead', dead)
            LocalPlayer.state:set('canSteal', dead, true)
        end

        local cuffed = md.ishandcuffed or false
        if cuffed ~= PlayerData.cuffed then
            PlayerData.cuffed = cuffed
            LocalPlayer.state:set('invBusy', cuffed, false)
            LocalPlayer.state:set('canSteal', cuffed, true)
            if cuffed then Weapon.Disarm() end
        end
    end
end

RegisterNetEvent('FW:Player:SetPlayerData', function(data)
    if not PlayerData.loaded then return end
    applyState(data)
end)

RegisterNetEvent('FW:Client:OnJobUpdate', function(job)
    if not PlayerData.loaded then return end
    local grade = job.grade and job.grade.level
    local groups = { [job.name] = tonumber(grade) or 0 }
    PlayerData.groups = groups
    OnPlayerData('groups', groups)
end)

RegisterNetEvent('FW:Client:OnPlayerUnload', client.onLogout)

-- ---------------------------------------------------------------------------
-- status (hunger / thirst / stress) updates from item use
-- ---------------------------------------------------------------------------

function client.setPlayerStatus(values)
    if not core() then return end
    local md = FW.Functions.GetPlayerData().metadata or {}

    for name, value in pairs(values) do
        if value > 100 or value < -100 then
            value = value * 0.0001
        end

        if name == 'hunger' or name == 'thirst' then
            local current = md[name] or 0
            local new = current + value
            if new > 100 then new = 100 elseif new < 0 then new = 0 end
            TriggerServerEvent('FW:Server:SetMetaData', name, new)
        elseif name == 'stress' then
            local current = md.stress or 0
            local new = current + value
            if new > 100 then new = 100 elseif new < 0 then new = 0 end
            TriggerServerEvent('FW:Server:SetMetaData', 'stress', new)
        end
    end
end

-- ---------------------------------------------------------------------------
-- inv_busy state passthrough (other resources may set it)
-- ---------------------------------------------------------------------------

AddStateBagChangeHandler('inv_busy', ('player:%s'):format(cache.serverId), function(_, _, value)
    LocalPlayer.state:set('invBusy', value, false)
end)
