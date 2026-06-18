import { canStack, findAvailableSlot, getTargetInventory, isSlotWithItem, findAvailableSlot2 } from '../helpers';
import { validateMove } from '../thunks/validateItems';
import { store } from '../store';
import { DragSource, DropTarget, InventoryType, SlotWithItem } from '../typings';
import { moveSlots, stackSlots, swapSlots } from '../store/inventory';
import { Items } from '../store/items';

export const onDrop = (source: DragSource, target?: DropTarget, splitCount?: number) => {
  const { inventory: state } = store.getState();

  const { sourceInventory, targetInventory } = getTargetInventory(
    state,
    source.inventory,
    target?.inventory
  );

  const sourceSlot = sourceInventory.items[source.item.slot - 1] as SlotWithItem;
  const sourceData = Items[sourceSlot.name];

  if (sourceData === undefined) {
    return console.error(`${sourceSlot.name} item data undefined!`);
  }

  // Container dragging safety checks
  if (sourceSlot.metadata?.container !== undefined) {
    // Block storing container inside another container
    if (targetInventory.type === InventoryType.CONTAINER) {
      return console.log(`Cannot store container ${sourceSlot.name} inside another container`);
    }

    // Block moving container if it's open in any inventory view
    const openContainerId = state.rightInventory.id || state.leftInventoryBottom.id;
    if (openContainerId === sourceSlot.metadata.container) {
      return console.log(`Cannot move container ${sourceSlot.name} when opened`);
    }
  }

  // Determine appropriate target slot
  let targetSlot;
  if (target) {
    targetSlot = target.item.slot === -1
      ? findAvailableSlot2(sourceSlot, sourceData, targetInventory.items, targetInventory.type)
      : targetInventory.items[target.item.slot - 1];
  } else {
    targetSlot = findAvailableSlot(sourceSlot, sourceData, targetInventory.items, targetInventory.type);
  }

  if (!targetSlot) {
    return console.error('Target slot undefined!');
  }

  // Don't allow swapping into an opened container
  const targetIsOpenContainer =
    targetSlot.metadata?.container !== undefined &&
    (state.rightInventory.id === targetSlot.metadata.container ||
     state.leftInventoryBottom.id === targetSlot.metadata.container);

  if (targetIsOpenContainer) {
    return console.log(`Cannot swap item ${sourceSlot.name} with container ${targetSlot.name} when opened`);
  }

  // Determine quantity to move
  const count =
    splitCount && splitCount > 0
      ? splitCount
      : state.shiftPressed && sourceSlot.count > 1 && sourceInventory.type !== 'shop'
      ? Math.floor(sourceSlot.count / 2)
      : state.itemAmount === 0 || state.itemAmount > sourceSlot.count
      ? sourceSlot.count
      : state.itemAmount;

  const data = {
    fromSlot: sourceSlot,
    toSlot: targetSlot,
    fromType: sourceInventory.type,
    toType: targetInventory.type,
    item: sourceSlot.name,
    count: count,
  };

  store.dispatch(
    validateMove({
      ...data,
      fromSlot: sourceSlot.slot,
      toSlot: targetSlot.slot,
    })
  );

  if (isSlotWithItem(targetSlot, true)) {
    if (sourceData.stack && canStack(sourceSlot, targetSlot)) {
      store.dispatch(stackSlots({ ...data, toSlot: targetSlot }));
    } else {
      store.dispatch(swapSlots({ ...data, toSlot: targetSlot }));
    }
  } else {
    store.dispatch(moveSlots(data));
  }
};
