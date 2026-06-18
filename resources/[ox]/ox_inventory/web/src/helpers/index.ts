import { Inventory, InventoryType, ItemData, Slot, SlotWithItem, State } from '../typings';
import { isEqual } from 'lodash';
import { store } from '../store';
import { Items } from '../store/items';
import { imagepath } from '../store/imagepath';
import { fetchNui } from '../utils/fetchNui';
import { json } from 'stream/consumers';

export const canPurchaseItem = (item: Slot, inventory: { type: Inventory['type']; groups: Inventory['groups'] }) => {
  if (inventory.type !== 'shop' || !isSlotWithItem(item)) return true;

  if (item.count !== undefined && item.count === 0) return false;

  if (item.grade === undefined || !inventory.groups) return true;

  const leftInventory = store.getState().inventory.leftInventory;

  // Shop requires groups but player has none
  if (!leftInventory.groups) return false;

  const reqGroups = Object.keys(inventory.groups);

  if (Array.isArray(item.grade)) {
    for (let i = 0; i < reqGroups.length; i++) {
      const reqGroup = reqGroups[i];

      if (leftInventory.groups[reqGroup] !== undefined) {
        const playerGrade = leftInventory.groups[reqGroup];
        for (let j = 0; j < item.grade.length; j++) {
          const reqGrade = item.grade[j];

          if (playerGrade === reqGrade) return true;
        }
      }
    }

    return false;
  } else {
    for (let i = 0; i < reqGroups.length; i++) {
      const reqGroup = reqGroups[i];
      if (leftInventory.groups[reqGroup] !== undefined) {
        const playerGrade = leftInventory.groups[reqGroup];

        if (playerGrade >= item.grade) return true;
      }
    }

    return false;
  }
};

export const canCraftItem = (item: Slot, inventoryType: string) => {
  if (!isSlotWithItem(item) || inventoryType !== 'crafting') return true;
  if (!item.ingredients) return true;
  const leftInventory = store.getState().inventory.leftInventory;
  const ingredientItems = Object.entries(item.ingredients);

  const remainingItems = ingredientItems.filter((ingredient) => {
    const [item, count] = [ingredient[0], ingredient[1]];
    const globalItem = Items[item];

    if (count >= 1) {
      if (globalItem && globalItem.count >= count) return false;
    }
    const hasItem = leftInventory.items.find((playerItem) => {
      if (isSlotWithItem(playerItem) && playerItem.name === item) {
        if (count < 1) {
          if (playerItem.metadata?.durability >= count * 100) return true;
          return false;
        }
      }
    });
    return !hasItem;
  });
  return remainingItems.length === 0;
};

export const calculateCanCraftItem = (item: Slot, inventoryType: string) => {
  if (!isSlotWithItem(item) || inventoryType !== 'crafting') return 0;
  if (!item.ingredients) return Infinity;

  const leftInventory = store.getState().inventory.leftInventory;
  const ingredientItems = Object.entries(item.ingredients);

  let maxCraftable = Infinity;

  ingredientItems.forEach(([ingredientName, requiredCount]) => {
    let availableCount = 0;
    
    // For regular items (count >= 1)
    if (requiredCount >= 1) {
      // Count items in player's inventory
      leftInventory.items.forEach((playerItem) => {
        if (isSlotWithItem(playerItem) && playerItem.name === ingredientName) {
          availableCount += playerItem.count;
        }
      });
    } else {
      // For durability-based items (count < 1, like 0.05 for hammer)
      leftInventory.items.forEach((playerItem) => {
        if (isSlotWithItem(playerItem) && playerItem.name === ingredientName) {
          const durability = playerItem.metadata?.durability ?? 100;
          // Each use consumes requiredCount * 100 durability
          availableCount += Math.floor(durability / (requiredCount * 100));
        }
      });
    }

    const craftableFromThisIngredient = requiredCount > 0 ? Math.floor(availableCount / requiredCount) : 0;
    maxCraftable = Math.min(maxCraftable, craftableFromThisIngredient);
  });
  
  return Math.max(0, maxCraftable); // Ensure we never return negative
}

export const getCraftableAmount = (item: Slot, inventoryType: string) => {
  if (!isSlotWithItem(item) || inventoryType !== 'crafting') return 0;
  if (!item.ingredients) return Infinity;

  const leftInventory = store.getState().inventory.leftInventory;
  const ingredientItems = Object.entries(item.ingredients);

  let maxCraftable = Infinity;

  ingredientItems.forEach(([ingredientName, requiredCount]) => {
    let availableCount = 0;

    // Only count items in player's inventory, not the global count
    leftInventory.items.forEach((playerItem) => {
      if (isSlotWithItem(playerItem) && playerItem.name === ingredientName) {
        if (requiredCount < 1) {
          // Durability-based items
          availableCount += Math.floor((playerItem.metadata?.durability ?? 0) / 100);
        } else {
          // Regular items
          availableCount += playerItem.count;
        }
      }
    });

    maxCraftable = Math.min(maxCraftable, Math.floor(availableCount / requiredCount));
  });
  
  return maxCraftable;
}

export const findAvailableMainSlot = (items: Slot[], invtype: string) => {
  if (invtype === 'player') {
    // For player inventory, only return slots 10+ (main inventory, not utility slots)
    return items.slice(9).find((target) => target.name === undefined);
  } else {
    // For other inventory types, use all slots
    return items.find((target) => target.name === undefined);
  };
};


export const findAvailableSlot2 = (item: Slot, data: ItemData, items: Slot[], targetInventoryType?: string) => {
  // Only skip first 9 slots for player inventory (left inventory)
  if (targetInventoryType === 'player') {
    return items.slice(9).find((target) => target.name === undefined);
  }
  // For all other inventories (right inventory), use all slots
  return items.find((target) => target.name === undefined);
};

export const isSlotWithItem = (slot: Slot, strict: boolean = false): slot is SlotWithItem =>
  (slot.name !== undefined && slot.weight !== undefined) ||
  (strict && slot.name !== undefined && slot.count !== undefined && slot.weight !== undefined);

export const canStack = (sourceSlot: Slot, targetSlot: Slot) =>
  sourceSlot.name === targetSlot.name && isEqual(sourceSlot.metadata, targetSlot.metadata);

export const findAvailableSlot = (item: Slot, data: ItemData, items: Slot[], invtype: string) => {
  if (invtype === 'player') {
    // Skip utility slots (1-9) for player inventory
    const mainInventoryItems = items.slice(9); // This gets slots 10+
    
    if (!data.stack) return mainInventoryItems.find((target) => target.name === undefined);

    const stackableSlot = mainInventoryItems.find((target) => 
      target.name === item.name && 
      isEqual(target.metadata, item.metadata)
    );

    return stackableSlot || mainInventoryItems.find((target) => target.name === undefined);
  } else {
    if (!data.stack) return items.find((target) => target.name === undefined);

    const stackableSlot = items.find((target) => 
      target.name === item.name && 
      isEqual(target.metadata, item.metadata)
    );

    return stackableSlot || items.find((target) => target.name === undefined);
  }
};

export const getTargetInventory = (
  state: State,
  sourceType: Inventory['type'],
  targetType?: Inventory['type']
): { sourceInventory: Inventory; targetInventory: Inventory } => ({
  sourceInventory: sourceType === InventoryType.PLAYER ? state.leftInventory : sourceType === InventoryType.BACKPACK ? state.leftInventoryBottom : state.rightInventory,
  targetInventory: targetType
    ? targetType === InventoryType.PLAYER ? state.leftInventory 
      : targetType === InventoryType.BACKPACK ? state.leftInventoryBottom 
      : state.rightInventory
    : sourceType === InventoryType.PLAYER ? state.rightInventory 
      : sourceType === InventoryType.BACKPACK ? state.leftInventoryBottom 
      : state.leftInventory,
});
// export const getTargetInventory = (
//   state: State,
//   sourceType: Inventory['type'],
//   targetType?: Inventory['type']
// ): { sourceInventory: Inventory; targetInventory: Inventory } => ({
//   sourceInventory: sourceType === InventoryType.PLAYER ? state.leftInventory : state.rightInventory,
//   targetInventory: targetType
//     ? targetType === InventoryType.PLAYER
//       ? state.leftInventory
//       : state.rightInventory
//     : sourceType === InventoryType.PLAYER
//     ? state.rightInventory
//     : state.leftInventory,
// });

export const itemDurability = (metadata: any, curTime: number) => {
  // sorry dunak
  // it's ok linden i fix inventory
  if (metadata?.durability === undefined) return;

  let durability = metadata.durability;

  if (durability > 100 && metadata.degrade)
    durability = ((metadata.durability - curTime) / (60 * metadata.degrade)) * 100;

  if (durability < 0) durability = 0;

  return durability;
};

export const getTotalWeight = (items: Inventory['items']) =>
  items.reduce((totalWeight, slot) => (isSlotWithItem(slot) ? totalWeight + slot.weight : totalWeight), 0);

export const isContainer = (inventory: Inventory) => inventory.type === InventoryType.CONTAINER;

export const getItemData = async (itemName: string) => {
  const resp: ItemData | null = await fetchNui('getItemData', itemName);

  if (resp?.name) {
    Items[itemName] = resp;
    return resp;
  }
};

export const getItemUrl = (item: string | SlotWithItem) => {
  const isObj = typeof item === 'object';

  if (isObj) {
    if (!item.name) return;

    const metadata = item.metadata;

    // @todo validate urls and support webp
    if (metadata?.imageurl) return `${metadata.imageurl}`;
    if (metadata?.image) return `${imagepath}/${metadata.image}.png`;
  }

  const itemName = isObj ? (item.name as string) : item;
  const itemData = Items[itemName];

  if (!itemData) return `${imagepath}/${itemName}.png`;
  if (itemData.image) return itemData.image;

  itemData.image = `${imagepath}/${itemName}.png`;

  return itemData.image;
};