import { store } from '../store';
import { Slot } from '../typings';
import { fetchNui } from '../utils/fetchNui';

export const onGive = (item: Slot) => {
  const {
    inventory: { itemAmount, leftInventory },
  } = store.getState();
  
  // Use the selected amount from the inventory control, default to 1 if none selected
  const count = itemAmount === 0 ? 1 : Math.min(itemAmount, item.count || 0);
  
  // Check if we're trying to give from utility slots (1-9)
  if (item.slot >= 1 && item.slot <= 9) {
    // For utility slots, just proceed normally as these are the player's equipped items
    fetchNui('giveItem', { slot: item.slot, count: count });
    return;
  }
  
  // For main inventory items (10+), proceed normally
  fetchNui('giveItem', { slot: item.slot, count: count });
};