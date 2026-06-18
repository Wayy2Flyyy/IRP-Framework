import { store } from '../store';
import { DragSource, DropTarget } from '../typings';
import { isSlotWithItem, findAvailableSlot } from '../helpers';
import { Items } from '../store/items';
import { craftItem } from '../thunks/craftItem';

export const onCraft = (source: DragSource, target: DropTarget, Count?: number) => {
  const { inventory: state } = store.getState();

  const sourceInventory = state.rightInventory;
  const targetInventory = state.leftInventory;

  const sourceSlot = sourceInventory.items[source.item.slot - 1];

  if (!isSlotWithItem(sourceSlot)) throw new Error(`Item ${sourceSlot.slot} name === undefined`);

  if (sourceSlot.count === 0) return;

  const sourceData = Items[sourceSlot.name];

  if (sourceData === undefined) return console.error(`Item ${sourceSlot.name} data undefined!`);

  const targetSlot = findAvailableSlot(sourceSlot, sourceData, targetInventory.items, 'player');

  if (targetSlot === undefined) return console.error(`Target slot undefined`);

  const count = Count || 1;

  const data = {
    fromSlot: sourceSlot,
    toSlot: targetSlot,
    fromType: sourceInventory.type,
    toType: targetInventory.type,
    count,
  };

  store.dispatch(
    craftItem({
      ...data,
      fromSlot: sourceSlot.slot,
      toSlot: targetSlot.slot,
    })
  );
};
