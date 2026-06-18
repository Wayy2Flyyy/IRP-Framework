if not lib then return end

local CraftingBenches = {}
local Items = require 'modules.items.server'
local Inventory = require 'modules.inventory.server'

---@param id number
---@param data table
local function createCraftingBench(id, data)
	CraftingBenches[id] = {}
	local recipes = data.items

	if recipes then
		for i = 1, #recipes do
			local recipe = recipes[i]
			local item = Items(recipe.name)

			if item then
				recipe.weight = item.weight
				recipe.slot = i
			else
				warn(('failed to setup crafting recipe (bench: %s, slot: %s) - item "%s" does not exist'):format(id, i, recipe.name))
			end

			for ingredient, needs in pairs(recipe.ingredients) do
				if needs < 1 then
					item = Items(ingredient)

					if item and not item.durability then
						item.durability = true
					end
				end
			end
		end

		if shared.target then
			data.points = nil
		else
			data.zones = nil
		end

		CraftingBenches[id] = data
	end
end

for id, data in pairs(lib.load('data.crafting') or {}) do createCraftingBench(id, data) end

---falls back to player coords if zones and points are both nil
---@param source number
---@param bench table
---@param index number
---@return vector3
local function getCraftingCoords(source, bench, index)
	if not bench.zones and not bench.points then
		return GetEntityCoords(GetPlayerPed(source))
	else
		return shared.target and bench.zones[index].coords or bench.points[index]
	end
end

lib.callback.register('ox_inventory:openCraftingBench', function(source, id, index)
	local left, bench = Inventory(source), CraftingBenches[id]

	if not left then return end

	if bench then
		local groups = bench.groups
		local coords = getCraftingCoords(source, bench, index)

		if not coords then return end

		if groups and not server.hasGroup(left, groups) then return end
		if #(GetEntityCoords(GetPlayerPed(source)) - coords) > 10 then return end

		if left.open and left.open ~= source then
			local inv = Inventory(left.open) --[[@as OxInventory]]

			-- Why would the player inventory open with an invalid target? Can't repro but whatever.
			if inv?.player then
				inv:closeInventory()
			end
		end

		left:openInventory(left)
	end

	return { label = left.label, type = left.type, slots = left.slots, weight = left.weight, maxWeight = left.maxWeight }
end)

local TriggerEventHooks = require 'modules.hooks.server'

lib.callback.register('ox_inventory:craftItem', function(source, id, index, recipeId, toSlot, count)
	local left, bench = Inventory(source), CraftingBenches[id]

	if not left then return end

	-- Default count to 1 if not provided
	count = count or 1

	if bench then
		local groups = bench.groups
		local coords = getCraftingCoords(source, bench, index)

		if groups and not server.hasGroup(left, groups) then return end
		if #(GetEntityCoords(GetPlayerPed(source)) - coords) > 10 then return end

		local recipe = bench.items[recipeId]

		if recipe then
			-- First, check if player has enough of all ingredients for all iterations
			for name, needs in pairs(recipe.ingredients) do
				if needs >= 1 then
					-- Regular item count check
					local totalNeeded = needs * count
					if Inventory.GetItemCount(left, name) < totalNeeded then
						return false, 'not_enough_ingredients'
					end
				else
					-- Durability check (for tools like hammers)
					-- Just check if the tool exists with enough durability
					local items = Inventory.Search(left, 'slots', name) or {}
					if #items == 0 then
						return false, 'not_enough_ingredients'
					end
					
					-- Check total durability needed
					local totalDurabilityNeeded = needs * count * 100
					local totalDurabilityAvailable = 0
					
					for _, slot in ipairs(items) do
						local durability = slot.metadata?.durability or 100
						if durability > 100 then
							-- Time-based durability
							local item = Items(name)
							local degrade = (slot.metadata.degrade or item.degrade) * 60
							local percentage = ((durability - os.time()) * 100) / degrade
							totalDurabilityAvailable = totalDurabilityAvailable + percentage
						else
							totalDurabilityAvailable = totalDurabilityAvailable + durability
						end
					end
					
					if totalDurabilityAvailable < totalDurabilityNeeded then
						return false, 'not_enough_durability'
					end
				end
			end

			local craftedItem = Items(recipe.name)
			local baseCount = (type(recipe.count) == 'number' and recipe.count) or (table.type(recipe.count) == 'array' and math.random(recipe.count[1], recipe.count[2])) or 1
			local totalCraftCount = baseCount * count
			
			-- Weight calculation
			local newWeight = left.weight
			
			-- Subtract weight of ingredients
			for name, needs in pairs(recipe.ingredients) do
				if needs >= 1 then
					local item = Items(name)
					if item then
						newWeight = newWeight - (item.weight * needs * count)
					end
				end
				-- Durability items don't change weight
			end
			
			-- Add weight of crafted items
			newWeight = newWeight + (craftedItem.weight + (recipe.metadata?.weight or 0)) * totalCraftCount

			if newWeight > left.maxWeight then return false, 'cannot_carry' end

			-- Trigger hook once
			if not TriggerEventHooks('craftItem', {
				source = source,
				benchId = id,
				benchIndex = index,
				recipe = recipe,
				toInventory = left.id,
				toSlot = toSlot,
				count = count,
			}) then return false end

			-- Show progress bar once
			local success = lib.callback.await('ox_inventory:startCrafting', source, id, recipeId)
			if not success then return false end

			-- Re-check ingredients after progress bar (in case inventory changed)
			for name, needs in pairs(recipe.ingredients) do
				if needs >= 1 then
					local totalNeeded = needs * count
					if Inventory.GetItemCount(left, name) < totalNeeded then
						return false, 'ingredients_changed'
					end
				end
			end

			-- Process all crafts at once
			-- First handle regular items
			for name, needs in pairs(recipe.ingredients) do
				if needs >= 1 then
					local totalToRemove = needs * count
					local removed = Inventory.RemoveItem(left, name, totalToRemove)
					if not removed then
						return false, 'failed_remove_item'
					end
				end
			end

			-- Then handle durability items
			for name, needs in pairs(recipe.ingredients) do
				if needs > 0 and needs < 1 then
					local totalDurabilityToRemove = needs * count * 100
					local items = Inventory.Search(left, 'slots', name) or {}
					
					for _, slot in ipairs(items) do
						if totalDurabilityToRemove <= 0 then break end
						
						local invSlot = left.items[slot.slot]
						if invSlot then
							local item = Items(invSlot.name)
							local durability = invSlot.metadata.durability or 100
							
							if durability > 100 then
								-- Time-based durability
								local degrade = (invSlot.metadata.degrade or item.degrade) * 60
								local currentPercentage = ((durability - os.time()) * 100) / degrade
								
								if currentPercentage >= totalDurabilityToRemove then
									-- This item has enough durability for all crafts
									durability = durability - (degrade * (totalDurabilityToRemove / 100))
									Items.UpdateDurability(left, invSlot, item, durability)
									totalDurabilityToRemove = 0
								else
									-- Use all durability from this item
									totalDurabilityToRemove = totalDurabilityToRemove - currentPercentage
									Items.UpdateDurability(left, invSlot, item, 0)
								end
							else
								-- Regular durability
								if durability >= totalDurabilityToRemove then
									-- This item has enough durability for all crafts
									durability = durability - totalDurabilityToRemove
									Items.UpdateDurability(left, invSlot, item, durability)
									totalDurabilityToRemove = 0
								else
									-- Use all durability from this item
									totalDurabilityToRemove = totalDurabilityToRemove - durability
									Items.UpdateDurability(left, invSlot, item, 0)
								end
							end
						end
					end
				end
			end

			-- Add all crafted items
			for i = 1, count do
				Inventory.AddItem(left, craftedItem, baseCount, recipe.metadata or {}, craftedItem.stack and toSlot or nil)
			end

			return true
		end
	end
end)