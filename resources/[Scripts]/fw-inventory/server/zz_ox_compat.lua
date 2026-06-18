--[[
    fw-inventory  ->  ox_inventory  storage-export shim
    ----------------------------------------------------
    Drop this file into  fw-inventory/server/  and load it LAST in
    fw-inventory/fxmanifest.lua (after the existing server/* files):

        server_scripts {
            '@fw-assets/server/sv_errorlog.lua',
            'config/*',
            'server/*',
            'server/zz_ox_compat.lua',   -- <-- add, loads last, overrides storage exports
        }

    It re-registers fw-inventory's STORAGE exports so any resource calling
    exports['fw-inventory']:<fn> reads/writes the real ox_inventory instead of
    the old player_inventories table. Config/item exports from the original
    sv_utils (GetItemData, GenerateItemInfo, CalculateQuality) are left intact.

    Player inventories ('ply-<citizenid>') map to the player's live ox inventory.
    Drop-/stash names are passed through to ox as a stash id (best-effort); fw's
    old drop ids do not map to ox drops, so use ox stashes/drops directly for new
    code. Every ox call is pcall-guarded so a not-yet-loaded inventory (e.g. mid
    login) returns empty/false instead of throwing.
]]

local FW
local function core()
    if FW then return FW end
    if GetResourceState('fw-core') ~= 'started' then return nil end
    FW = exports['fw-core']:GetCoreObject()
    return FW
end

local ox = exports.ox_inventory

local function guard(default, fn)
    local ok, a, b = pcall(fn)
    if ok then
        if a == nil then return default end
        return a, b
    end
    return default
end

-- ply-<cid> -> player source ; everything else passed through as an ox stash id
local function resolve(invName)
    if type(invName) == 'string' and invName:sub(1, 4) == 'ply-' then
        if not core() then return nil end
        local player = FW.Functions.GetPlayerByCitizenId(invName:sub(5))
        return player and player.PlayerData.source or nil
    end
    return invName
end

local function variant(item, customType)
    if not customType or customType == '' then return nil end
    if not Shared.CustomTypes or not Shared.CustomTypes[item] then return nil end
    return Shared.CustomTypes[item][customType]
end

local function toMeta(item, info, customType)
    local meta = {}
    if type(info) == 'table' then
        for k, v in pairs(info) do meta[k] = v end
    end
    if customType and customType ~= '' then
        meta.customType = customType
        local v = variant(item, customType)
        if v then
            if v.Label then meta.label = v.Label end
            if v.Description then meta.description = v.Description end
            if v.Image then meta.image = v.Image end
            if v.Weight then meta.weight = v.Weight end
        end
    end
    return meta
end

local function metaMatch(customType)
    if customType and customType ~= '' then return { customType = customType } end
    return nil
end

local function toFwSlot(slot)
    if not slot then return nil end
    local meta = slot.metadata or {}
    return {
        Item = slot.name,
        CustomType = meta.customType or '',
        Amount = slot.count,
        Info = meta,
        CreateDate = meta.createdate or (os.time() * 1000),
        Slot = slot.slot,
    }
end

local function toFwInventory(items)
    local out = { [0] = false }
    if type(items) == 'table' then
        for _, slot in pairs(items) do
            if slot and slot.name then out[slot.slot] = toFwSlot(slot) end
        end
    end
    return out
end

-- ---------------------------------------------------------------------------
-- getters
-- ---------------------------------------------------------------------------

local function GetInventoryItems(invName)
    local inv = resolve(invName)
    if not inv then return { [0] = false } end
    local items = guard(nil, function() return ox:GetInventoryItems(inv) end)
    return toFwInventory(items or {})
end
exports('GetInventoryItems', GetInventoryItems)

local function GetInventoryItemBySlot(invName, slot)
    local inv = resolve(invName)
    if not inv then return nil end
    return toFwSlot(guard(nil, function() return ox:GetSlot(inv, slot) end))
end
exports('GetInventoryItemBySlot', GetInventoryItemBySlot)

local function GetTotalItemsWeight(invName)
    local inv = resolve(invName)
    if not inv then return 0.0 end
    local data = guard(nil, function() return ox:GetInventory(inv) end)
    return (data and data.weight) or 0.0
end
exports('GetTotalItemsWeight', GetTotalItemsWeight)

-- ox auto-places items; returning nil lets AddItem choose a slot
local function FindSlot() return nil end
exports('FindSlot', FindSlot)

-- ---------------------------------------------------------------------------
-- add / remove
-- ---------------------------------------------------------------------------

local function AddItemToInventory(invName, item, amount, slot, info, customType)
    local inv = resolve(invName)
    if not inv then return false end
    local ok = guard(false, function()
        return ox:AddItem(inv, item, amount or 1, toMeta(item, info, customType), slot)
    end)
    return ok and true or false
end
exports('AddItemToInventory', AddItemToInventory)

local function RemoveItemFromInventory(invName, item, amount, slot, customType)
    local inv = resolve(invName)
    if not inv then return false end
    local ok = guard(false, function()
        return ox:RemoveItem(inv, item, amount or 1, metaMatch(customType), slot)
    end)
    return ok and true or false
end
exports('RemoveItemFromInventory', RemoveItemFromInventory)

local function RemoveItemFromInventoryByName(invName, item, amount, customType)
    local inv = resolve(invName)
    if not inv then return false, {} end
    local ok = guard(false, function()
        return ox:RemoveItem(inv, item, amount or 1, metaMatch(customType))
    end)
    return ok and true or false, {}
end
exports('RemoveItemFromInventoryByName', RemoveItemFromInventoryByName)

local function RemoveItemsFromInventory(invName, items)
    local inv = resolve(invName)
    if not inv then return false end
    local all = true
    for _, data in pairs(items) do
        local name = data.Item or data.item or data[1]
        local amt = data.Amount or data.amount or data[2] or 1
        local ok = guard(false, function() return ox:RemoveItem(inv, name, amt) end)
        if not ok then all = false end
    end
    return all
end
exports('RemoveItemsFromInventory', RemoveItemsFromInventory)

local function RemoveItemFromInventoryByKV(invName, item, amount, value, customType)
    local inv = resolve(invName)
    if not inv then return false end
    local slots = guard(nil, function() return ox:GetSlotsWithItem(inv, item, metaMatch(customType)) end)
    if not slots then return false end
    local removed = 0
    for _, slot in pairs(slots) do
        if removed >= (amount or 1) then break end
        local meta = slot.metadata or {}
        for _, v in pairs(meta) do
            if v == value then
                guard(false, function() return ox:RemoveItem(inv, item, slot.count, meta, slot.slot) end)
                removed = removed + 1
                break
            end
        end
    end
    return removed > 0
end
exports('RemoveItemFromInventoryByKV', RemoveItemFromInventoryByKV)

-- ---------------------------------------------------------------------------
-- setters / misc
-- ---------------------------------------------------------------------------

local function SetInventoryItemKV(invName, item, slot, key, value)
    local inv = resolve(invName)
    if not inv then return false end
    local data = guard(nil, function() return ox:GetSlot(inv, slot) end)
    if not data then return false end
    local meta = data.metadata or {}
    meta[key] = value
    guard(nil, function() return ox:SetMetadata(inv, slot, meta) end)
    return true
end
exports('SetInventoryItemKV', SetInventoryItemKV)

local function SetInventoryItemMultipleKV(invName, item, slot, data)
    local inv = resolve(invName)
    if not inv then return false end
    local cur = guard(nil, function() return ox:GetSlot(inv, slot) end)
    if not cur then return false end
    local meta = cur.metadata or {}
    for k, v in pairs(data) do meta[k] = v end
    guard(nil, function() return ox:SetMetadata(inv, slot, meta) end)
    return true
end
exports('SetInventoryItemMultipleKV', SetInventoryItemMultipleKV)

local function ClearInventory(invName)
    local inv = resolve(invName)
    if not inv then return false end
    guard(nil, function() return ox:ClearInventory(inv) end)
    return true
end
exports('ClearInventory', ClearInventory)

local function ClearInventoryItemSlot(invName, slot)
    local inv = resolve(invName)
    if not inv then return false end
    local data = guard(nil, function() return ox:GetSlot(inv, slot) end)
    if not data then return false end
    guard(false, function() return ox:RemoveItem(inv, data.name, data.count, nil, slot) end)
    return true
end
exports('ClearInventoryItemSlot', ClearInventoryItemSlot)

local function SetInventoryItemSlot(invName, item, amount, slot, info, customType)
    ClearInventoryItemSlot(invName, slot)
    return AddItemToInventory(invName, item, amount, slot, info, customType)
end
exports('SetInventoryItemSlot', SetInventoryItemSlot)

-- decay / quality: approximate against ox durability
local function DecayItemFromInventory(invName, item, percentage, slot)
    local inv = resolve(invName)
    if not inv or not slot then return end
    local data = guard(nil, function() return ox:GetSlot(inv, slot) end)
    if not data or not data.metadata or not data.metadata.durability then return end
    local newDur = data.metadata.durability - (percentage or 0)
    if newDur < 0 then newDur = 0 end
    guard(nil, function() return ox:SetDurability(inv, slot, newDur) end)
    return newDur
end
exports('DecayItemFromInventory', DecayItemFromInventory)

local function IncreaseQualityItemFromInventory(invName, item, percentage, slot)
    local inv = resolve(invName)
    if not inv or not slot then return end
    local data = guard(nil, function() return ox:GetSlot(inv, slot) end)
    if not data or not data.metadata or not data.metadata.durability then return end
    local newDur = data.metadata.durability + (percentage or 0)
    if newDur > 100 then newDur = 100 end
    guard(nil, function() return ox:SetDurability(inv, slot, newDur) end)
    return newDur
end
exports('IncreaseQualityItemFromInventory', IncreaseQualityItemFromInventory)

-- not meaningful with ox storage; kept so callers don't error
local function SetInventoryName() return false end
exports('SetInventoryName', SetInventoryName)
