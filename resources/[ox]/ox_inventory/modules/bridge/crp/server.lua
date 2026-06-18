local Inventory = require 'modules.inventory.server'
local Items = require 'modules.items.server'

local FW
local migrate = GetConvarInt('inventory:fwmigrate', 0) == 1
local setupDone = {}

local function core()
    if FW then return FW end
    if GetResourceState('fw-core') ~= 'started' then return nil end
    FW = exports['fw-core']:GetCoreObject()
    return FW
end

-- ---------------------------------------------------------------------------
-- mapping helpers (fw-inventory <-> ox_inventory)
-- ---------------------------------------------------------------------------

local function variant(itemName, customType)
    if not customType or customType == '' then return nil end
    local ok, data = pcall(function()
        return exports['fw-inventory']:GetItemData(itemName, customType)
    end)
    if ok then return data end
end

---fw `Info` + `CustomType` -> ox metadata
local function toMeta(itemName, info, customType)
    local meta = {}

    if type(info) == 'table' then
        for k, v in pairs(info) do meta[k] = v end
    end

    if customType and customType ~= '' then
        meta.customType = customType
        local v = variant(itemName, customType)
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
    if customType and customType ~= '' then
        return { customType = customType }
    end
    return nil
end

---ox slot -> fw slot shape
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
            if slot and slot.name then
                out[slot.slot] = toFwSlot(slot)
            end
        end
    end
    return out
end

local function groupsFor(pd)
    local grade = pd.job and pd.job.grade and pd.job.grade.level
    return { [pd.job and pd.job.name or 'unemployed'] = tonumber(grade) or 0 }
end

-- ---------------------------------------------------------------------------
-- bridge contract
-- ---------------------------------------------------------------------------

server.GetPlayerFromId = function(source)
    if not core() then return nil end
    return FW.Functions.GetPlayer(source)
end

---@diagnostic disable-next-line: duplicate-set-field
function server.setPlayerData(player)
    return {
        source = player.source,
        name = ('%s %s'):format(player.charinfo.firstname, player.charinfo.lastname),
        groups = groupsFor(player),
        sex = player.charinfo.gender == 0 or player.charinfo.gender == 'm',
        dateofbirth = player.charinfo.birthdate,
        job = player.job and player.job.name,
    }
end

function server.syncInventory(inv)
    local accounts = Inventory.GetAccountItemCounts(inv)
    if not accounts then return end

    local player = server.GetPlayerFromId(inv.id or inv.owner)
    if not player then return end

    player.PlayerData.inventory = toFwInventory(inv.items)

    if accounts.money and accounts.money ~= player.Functions.GetMoney('cash') then
        player.Functions.SetMoney('cash', accounts.money, 'ox_inventory sync')
    end
end

function server.UseItem(source, itemName, data)
    if not core() then return end
    if not FW.Functions.CanUseItem(itemName) then return end

    local meta = data and data.metadata or {}
    FW.Functions.UseItem(source, {
        Item = itemName,
        Slot = data and data.slot,
        Amount = data and data.count or 1,
        Info = meta,
        CustomType = meta.customType or '',
        CreateDate = meta.createdate or (os.time() * 1000),
    })
end

---@diagnostic disable-next-line: duplicate-set-field
function server.canRobPlayer(targetSource)
    local player = server.GetPlayerFromId(targetSource)
    if not player then return false end

    local md = player.PlayerData.metadata or {}
    if md.isdead or md.ishandcuffed then return true end

    return Player(targetSource).state.canSteal == true
end

function server.hasLicense(inv, license)
    local player = server.GetPlayerFromId(inv.id or inv.owner)
    if not player then return false end
    local licenses = player.PlayerData.metadata and player.PlayerData.metadata.licenses
    return licenses and licenses[license] == true
end

---@diagnostic disable-next-line: duplicate-set-field
function server.buyLicense(inv, license)
    local player = server.GetPlayerFromId(inv.id or inv.owner)
    if not player then return false end

    local licenses = player.PlayerData.metadata.licenses or {}
    if licenses[license.name] then
        return false, 'already_have'
    end

    if Inventory.GetItem(inv, 'money', false, true) < license.price then
        return false, 'can_not_afford'
    end

    Inventory.RemoveItem(inv, 'money', license.price)
    licenses[license.name] = true
    player.Functions.SetMetaData('licenses', licenses)

    return true, 'have_purchased'
end

function server.isPlayerBoss(playerId)
    local player = server.GetPlayerFromId(playerId)
    if not player then return false end
    -- crpframework has no boss flag; treat highest grade of a job as boss.
    local job = player.PlayerData.job
    if not job or not job.grade then return false end
    local grades = FW.Shared.Jobs[job.name] and FW.Shared.Jobs[job.name].grades
    if not grades then return false end
    local top = 0
    for level in pairs(grades) do
        local n = tonumber(level) or 0
        if n > top then top = n end
    end
    return (tonumber(job.grade.level) or 0) >= top and top > 0
end

local function hasItem(source, items, amount)
    amount = amount or 1
    local count = Inventory.Search(source, 'count', items)
    if type(items) == 'table' and type(count) == 'table' then
        for _, v in pairs(count) do
            if v < amount then return false end
        end
        return true
    end
    return (count or 0) >= amount
end

-- ---------------------------------------------------------------------------
-- legacy migration (optional, one-time): player_inventories -> ox
-- ---------------------------------------------------------------------------

local function loadLegacy(citizenid)
    local ok, rows = pcall(MySQL.query.await,
        'SELECT COUNT(item_name) AS amount, item_name, custom_type, slot, MIN(info) AS info FROM player_inventories WHERE inventory = ? GROUP BY slot',
        { 'ply-' .. citizenid })

    if not ok or not rows or not next(rows) then return nil end

    local data = {}
    for _, row in ipairs(rows) do
        if Items(row.item_name) then
            local info = row.info and json.decode(row.info) or {}
            data[#data + 1] = {
                name = row.item_name,
                count = tonumber(row.amount),
                slot = tonumber(row.slot),
                metadata = toMeta(row.item_name, info, row.custom_type),
            }
        end
    end

    return data
end

-- ---------------------------------------------------------------------------
-- player object overrides (route Player.Functions.* item calls to ox)
-- ---------------------------------------------------------------------------

local function override(player)
    local src = player.PlayerData.source
    local F = player.Functions

    F.AddItem = function(item, amount, slot, info, show, customType)
        local meta = toMeta(item, info, customType)
        local ok = Inventory.AddItem(src, item, amount or 1, meta, slot)
        return ok or false
    end

    F.RemoveItem = function(item, amount, slot, show, customType)
        return Inventory.RemoveItem(src, item, amount or 1, metaMatch(customType), slot) or false
    end

    F.RemoveItemByName = function(item, amount, show, customType)
        return Inventory.RemoveItem(src, item, amount or 1, metaMatch(customType)) or false
    end

    F.RemoveItemByKV = function(item, amount, value, show, customType)
        local slots = Inventory.GetSlotsWithItem(src, item, metaMatch(customType))
        if not slots then return false end
        local removed = 0
        for _, slot in pairs(slots) do
            if removed >= (amount or 1) then break end
            local meta = slot.metadata or {}
            for _, v in pairs(meta) do
                if v == value then
                    Inventory.RemoveItem(src, item, slot.count, meta, slot.slot)
                    removed = removed + 1
                    break
                end
            end
        end
        return removed > 0
    end

    F.RemoveMultiItems = function(items)
        local all = true
        for _, data in pairs(items) do
            local name = data.Item or data.item or data[1]
            local amt = data.Amount or data.amount or data[2] or 1
            if not Inventory.RemoveItem(src, name, amt) then all = false end
        end
        return all
    end

    F.GetItemByName = function(item)
        return toFwSlot(Inventory.GetSlotWithItem(src, item))
    end

    F.GetItemBySlot = function(slot)
        return toFwSlot(Inventory.GetSlot(src, slot))
    end

    F.HasEnoughOfItem = function(item, amount, customType, requiredQuality)
        return Inventory.GetItemCount(src, item, metaMatch(customType)) >= (amount or 1)
    end

    F.ClearInventory = function()
        Inventory.Clear(src)
        return true
    end

    F.RefreshInventory = function()
        local inv = Inventory(src)
        if inv then player.PlayerData.inventory = toFwInventory(inv.items) end
    end

    F.RefreshInvSlot = function(slot)
        F.RefreshInventory()
    end

    F.SetItemKV = function(item, slot, key, value, customType)
        local data = Inventory.GetSlot(src, slot)
        if not data then return false end
        local meta = data.metadata or {}
        meta[key] = value
        return Inventory.SetMetadata(src, slot, meta) ~= false
    end

    F.SetItemMultipleKV = function(item, slot, data)
        local cur = Inventory.GetSlot(src, slot)
        if not cur then return false end
        local meta = cur.metadata or {}
        for k, v in pairs(data) do meta[k] = v end
        return Inventory.SetMetadata(src, slot, meta) ~= false
    end
    player.SetItemMultipleKV = F.SetItemMultipleKV

    F.DecayItem = function(item, slot, percentage)
        local data = Inventory.GetSlot(src, slot)
        if not data or not data.metadata or not data.metadata.durability then return end
        local newDur = data.metadata.durability - (percentage or 0)
        if newDur < 0 then newDur = 0 end
        Inventory.SetDurability(src, slot, newDur)
        return newDur
    end

    -- keep the ox cash item in step with framework cash
    local addMoney, removeMoney, setMoney = F.AddMoney, F.RemoveMoney, F.SetMoney

    F.AddMoney = function(moneytype, amount, reason)
        local ok = addMoney(moneytype, amount, reason)
        if ok and moneytype and moneytype:lower() == 'cash' then
            Inventory.SetItem(src, 'money', player.PlayerData.money.cash)
        end
        return ok
    end

    F.RemoveMoney = function(moneytype, amount, reason)
        local ok = removeMoney(moneytype, amount, reason)
        if ok and moneytype and moneytype:lower() == 'cash' then
            Inventory.SetItem(src, 'money', player.PlayerData.money.cash)
        end
        return ok
    end

    F.SetMoney = function(moneytype, amount, reason)
        local ok = setMoney(moneytype, amount, reason)
        if ok and moneytype and moneytype:lower() == 'cash' then
            Inventory.SetItem(src, 'money', player.PlayerData.money.cash)
        end
        return ok
    end
end

-- ---------------------------------------------------------------------------
-- setup / lifecycle
-- ---------------------------------------------------------------------------

local function setupPlayer(player)
    if not player or not player.PlayerData then return end
    local pd = player.PlayerData
    local src = pd.source

    if setupDone[src] then return end
    local existing = Inventory(src)
    if existing and existing.player then setupDone[src] = true; return end

    local identifier = tostring(pd.citizenid)
    local oxPlayer = {
        source = src,
        identifier = identifier,
        name = ('%s %s'):format(pd.charinfo.firstname, pd.charinfo.lastname),
        charinfo = pd.charinfo,
        job = pd.job,
    }

    local data = db.loadPlayer(identifier)

    if (not data or not next(data)) and migrate then
        data = loadLegacy(pd.citizenid)
    end

    server.setPlayerInventory(oxPlayer, data)
    Inventory.SetItem(src, 'money', pd.money and pd.money.cash or 0)

    override(player)
    setupDone[src] = true
end

AddEventHandler('playerDropped', function()
    local src = source
    setupDone[src] = nil
    server.playerDropped(src)
end)

CreateThread(function()
    while not core() do Wait(500) end

    -- catch players already online when ox (re)starts
    for _, src in pairs(FW.Functions.GetPlayers()) do
        local player = FW.Functions.GetPlayer(src)
        if player then setupPlayer(player) end
    end

    while true do
        Wait(250)
        for src in pairs(FW.Players) do
            if not setupDone[src] then
                setupPlayer(FW.Players[src])
            end
        end
    end
end)
