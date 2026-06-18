import React, { useCallback, useRef, useState, useMemo, useEffect } from 'react';
import { DragSource, Inventory, InventoryType, Slot, SlotWithItem } from '../../typings';
import { useAppDispatch, useAppSelector } from '../../store';
import WeightBar from '../utils/WeightBar';
import { onDrop } from '../../dnd/onDrop';
import { Items } from '../../store/items';
import { calculateCanCraftItem, canCraftItem, canPurchaseItem, getItemUrl, isSlotWithItem } from '../../helpers';
import { onUse } from '../../dnd/onUse';
import { Locale } from '../../store/locale';
import { closeTooltip, openTooltip } from '../../store/tooltip';
import { openContextMenu } from '../../store/contextMenu';
import { updateCraftItems } from '../../store/selectedCraftItems';


interface SlotProps {
  inventoryId: Inventory['id'];
  inventoryType: Inventory['type'];
  inventoryGroups: Inventory['groups'];
  item: Slot;
}

const CraftingSlot: React.ForwardRefRenderFunction<HTMLDivElement, SlotProps> = (
  { item, inventoryId, inventoryType, inventoryGroups }
) => {
  const [SelectedItem, setSelectedItem]: any = useState(null);
  const dispatch = useAppDispatch();
  const timerRef = useRef<number | null>(null);

  const handleClick = (data: SlotWithItem) => {
    if (!isSlotWithItem(data)) return;
    const payload = { 
      item: data, 
      maxCraft: calculateCanCraftItem(data, inventoryType),
      source: {
        inventory: inventoryType,
        item: {
          name: item.name,
          slot: item.slot,
          price: item.price || 0,
          currency: 'money',
          type: item.metadata?.type,
          rarity: item.metadata?.rarity || "common"
        },
      }
    };
    setSelectedItem(payload);
  };
  useEffect(() => {
    if (SelectedItem) {
      dispatch(updateCraftItems(SelectedItem));
    }
  }, [SelectedItem]);
  return (
    <div
      onClick={() => handleClick(item as SlotWithItem)}
      className={`
        size-full 
        ${isSlotWithItem(item) && item.slot === (SelectedItem && SelectedItem.item?.slot) ? 'uncommon' : ''}
        ${item.metadata?.rarity === 'uncommon' ? 'uncommon' : item.metadata?.rarity === 'rare' ? 'rare' : item.metadata?.rarity === 'epic' ? 'epic' : item.metadata?.rarity === 'mythic' ? 'mythic' : 'common'}
      `}
      style={{
        filter:
          !canPurchaseItem(item, { type: inventoryType, groups: inventoryGroups }) || !canCraftItem(item, inventoryType)
            ? 'brightness(80%) grayscale(100%)'
            : undefined,
        // opacity: isDragging ? 0.4 : 1.0,
        backgroundImage:  `url(${item?.name ? getItemUrl(item as SlotWithItem) : 'none'})`,
      }}
    >
      {isSlotWithItem(item) && (
        <>
          <div
            className="item-slot-wrapper"
          >
            <div
              className={
                inventoryType === 'player' && item.slot <= 5 ? 'item-hotslot-header-wrapper' : 'item-slot-header-wrapper'
              }
            >
              {/* {inventoryType === 'player' && item.slot <= 5 && <div className="inventory-slot-number">{item.slot}</div>} */}
              <div className="item-slot-info-wrapper w-full flex flex-row justify-end items-center p-2 py-1 text-[10px] pt-2">
                <div className='rounded-full someCircleShitToSayThis p-[1px] flex items-center justify-center px-1'>
                  <p className='text-white text-xs'>{calculateCanCraftItem(item, inventoryType)}</p>
                </div>
              </div>
            </div>
            <div className='relative'>
              <div className="w-full flex flex-row justify-center pb-1">
                <div className="inventory-slot-label-text max-w-[70%] h-auto">
                    {item.metadata?.label ? item.metadata.label : Items[item.name]?.label || item.name}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default React.forwardRef(CraftingSlot);