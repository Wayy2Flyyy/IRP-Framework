---@class Framework
---Centralized framework detection and accessor
local Framework = {}

Framework.ESX = nil
Framework.QBCore = nil
Framework.QBX = nil

Framework.type = nil -- Will be 'esx', 'qb', 'qbx', or nil
Framework.core = nil -- Resource name of the framework
Framework.initialized = false

---Initialize framework detection
---@param callback? function Optional callback to run after initialization
function Framework.Init(callback)
    if Framework.initialized then
        if callback then callback() end
        return
    end

    CreateThread(function()
        Wait(Constants and Constants.FRAMEWORK_INIT_DELAY or 5000)

        if GetResourceState('qbx_core') == 'started' then
            Framework.type = 'qbx'
            Framework.core = 'qbx_core'
            Framework.QBX = exports.qbx_core
        elseif GetResourceState('qb-core') == 'started' then
            Framework.type = 'qb'
            Framework.core = 'qb-core'
            Framework.QBCore = exports['qb-core']:GetCoreObject()
        elseif GetResourceState('es_extended') == 'started' then
            Framework.type = 'esx'
            Framework.core = 'es_extended'
            Framework.ESX = exports.es_extended:getSharedObject()
        end

        if lib.context == 'server' then
            GlobalState.fw = Framework.type
        end

        Framework.initialized = true

        if callback then callback() end
    end)
end

---Get the player object from the current framework
---@param source number Player server ID
---@return table|nil player Player object or nil if not found
function Framework.GetPlayer(source)
    if not Framework.initialized then
        warn('Framework.GetPlayer called before initialization!')
        return nil
    end

    if Framework.type == 'esx' then
        return Framework.ESX.GetPlayerFromId(source)
    elseif Framework.type == 'qb' then
        return Framework.QBCore.Functions.GetPlayer(source)
    elseif Framework.type == 'qbx' then
        return Framework.QBX:GetPlayer(source)
    end

    return nil
end

---Get whether a framework is initialized
---@return boolean
function Framework.IsReady()
    return Framework.initialized
end

---Get the current framework type
---@return string|nil 'esx', 'qb', 'qbx', or nil
function Framework.GetType()
    return Framework.type
end

return Framework
