import React, { useCallback, useRef, useState, useMemo } from 'react';
import { DragSource, Inventory, InventoryType, Slot, SlotWithItem } from '../../typings';
import { useDrag, useDragDropManager, useDrop } from 'react-dnd';
import { useAppDispatch, useAppSelector } from '../../store';
import WeightBar from '../utils/WeightBar';
import { onDrop } from '../../dnd/onDrop';
import { Items } from '../../store/items';
import { canCraftItem, canPurchaseItem, getItemUrl, isSlotWithItem } from '../../helpers';
import { onUse } from '../../dnd/onUse';
import { Locale } from '../../store/locale';
import { onCraft } from '../../dnd/onCraft';
import { closeTooltip, openTooltip } from '../../store/tooltip';
import { openContextMenu } from '../../store/contextMenu';
import { useMergeRefs } from '@floating-ui/react';
import ClockIcon from '../utils/icons/ClockIcon';
import RifleIcon from '../utils/icons/RifleIcon';
import PistolIcon from '../utils/icons/PistolIcon';;
import VestIcon from '../utils/icons/VestIcon';


import { PiBackpackDuotone } from "react-icons/pi";
import { IoPhonePortrait } from "react-icons/io5";
import { TbParachute } from "react-icons/tb";
import BackpackIcon from '../utils/icons/BackpackIcon';
import ParachuteIcon from '../utils/icons/ParachuteIcon';

interface SlotProps {
  inventoryId: Inventory['id'];
  inventoryType: Inventory['type'];
  inventoryGroups: Inventory['groups'];
  item: Slot;
}

interface SettingsProps {
  SpecialSlot: any[];
  blacklistedItems: string[];
}

const InventorySlot: React.ForwardRefRenderFunction<HTMLDivElement, SlotProps> = (
  { item, inventoryId, inventoryType, inventoryGroups },
  ref
) => {
  const manager = useDragDropManager();
  const dispatch = useAppDispatch();
  const timerRef = useRef<number | null>(null);
  const [isFading, setIsFading] = useState(false); // Tambahkan state untuk animasi fade
  const settings = useAppSelector((state) => state.settings.data) as SettingsProps;
  const blacklist = settings.blacklistedItems;
  const allowedItemsForSlots: { [key: number]: string[] } = {
    1: settings.SpecialSlot[0],
    2: settings.SpecialSlot[1],
    3: settings.SpecialSlot[2],
    4: settings.SpecialSlot[3],
  };

  // Improved weapon detection function
  const isWeaponItem = useCallback((itemName: string, itemData?: any) => {
    if (!itemName) return false;
    
    // Check if item is in the Items table and has weapon properties
    const itemInfo = Items[itemName];
    if (itemInfo && (itemInfo.weapon || itemInfo.ammoName || itemInfo.durability !== undefined)) {
      return true;
    }
    
    // Check if the item name starts with WEAPON_ (common pattern for weapons)
    if (itemName.toUpperCase().startsWith('WEAPON_')) {
      return true;
    }
    
    // Check metadata for weapon type
    if (itemData?.metadata?.type === 'weapon') {
      return true;
    }
    
    // Check if item has ammo-related properties (indicates it's a weapon)
    if (itemData?.metadata?.ammo !== undefined || itemData?.metadata?.components) {
      return true;
    }
    
    return false;
  }, []);

  const canDrag = useCallback(() => {
    return canPurchaseItem(item, { type: inventoryType, groups: inventoryGroups }) && canCraftItem(item, inventoryType);
  }, [item, inventoryType, inventoryGroups]);

  const ingredients = useMemo(() => {
      if (!isSlotWithItem(item) || !item.ingredients) return null;
      return Object.entries(item.ingredients).sort((a, b) => (a[1] as number) - (b[1] as number));
  }, [item]);

  // Get rarity from metadata or direct property - only for items with content
  const itemRarity = useMemo(() => {
    if (isSlotWithItem(item)) {
      // Check in this order: metadata.rarity, direct rarity property, then Items table
      const rarity = item.metadata?.rarity || item.rarity || Items[item.name]?.rarity || 'common';
      return typeof rarity === 'string' ? rarity.toLowerCase() : 'common';
    }
    return 'common';
  }, [item]);

  const [{ isDragging }, drag] = useDrag<DragSource, void, { isDragging: boolean }>(
    () => ({
      type: 'SLOT',
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
      item: () => {
        if (isSlotWithItem(item, inventoryType !== InventoryType.SHOP)) {
          setIsFading(true); // Aktifkan animasi saat drag dimulai
          return {
            inventory: inventoryType,
            item: {
              name: item.name,
              slot: item.slot,
              price: item.price || 0,
              currency: item.currency || 'money',
              type: item.metadata?.type || (isWeaponItem(item.name, item) ? 'weapon' : undefined),
              rarity: itemRarity
            },
            image: item?.name && `url(${getItemUrl(item) || 'none'})`,
          };
        }
        return null;
      },
      canDrag,
      end: (item, monitor) => {
        setIsFading(false); // Matikan animasi setelah drag selesai
      },
    }),
    [inventoryType, item, isWeaponItem, itemRarity]
  );

  const [, drop] = useDrop<DragSource, void, { isOver: boolean }>(
    () => ({
      accept: 'SLOT',
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
      drop: (source) => {
        dispatch(closeTooltip());
        setIsFading(false); // Matikan animasi setelah drag selesai
        switch (source.inventory) {
          case InventoryType.CRAFTING:
            onCraft(source, { inventory: inventoryType, item: { slot: item.slot } });
            break;
          default:
            onDrop(source, { inventory: inventoryType, item: { slot: item.slot } });
            break;
        }
      },
      canDrop: (source) => {
        const targetSlot = item.slot;
        const sourceSlot = source.item.slot;
        const isBlacklisted = blacklist.includes(source.item.name);
        // Improved weapon detection using the helper function
        const isWeapon = source.item.type === 'weapon' || isWeaponItem(source.item.name);

        if (source.inventory === 'player' && inventoryType === InventoryType.PLAYER) {
          // Validate source item -> target slot
          const isTargetSlotRestricted = targetSlot >= 1 && targetSlot <= 4;
          const allowedItemsForTarget = allowedItemsForSlots[targetSlot] || [];
          const isItemAllowedInTarget = allowedItemsForTarget.includes(source.item.name);
          const isWeaponSlot = targetSlot === 5 || targetSlot === 6; // Weapon slots
          const notWeaponSlot = targetSlot >= 7 && targetSlot <= 9; // Hotkey slots - no weapons allowed

          // Check if source can go to target
          const sourceToTargetValid = (
            (!isTargetSlotRestricted || (isTargetSlotRestricted && isItemAllowedInTarget)) &&
            (!isWeaponSlot || (isWeaponSlot && isWeapon)) &&
            (!notWeaponSlot || (notWeaponSlot && !isWeapon))
          );

          if (!sourceToTargetValid) return false;

          // If it's a swap (target has an item), validate target item -> source slot
          if (isSlotWithItem(item)) {
            const targetItemWeapon = isWeaponItem(item.name, item);
            const isSourceSlotRestricted = sourceSlot >= 1 && sourceSlot <= 4;
            const allowedItemsForSource = allowedItemsForSlots[sourceSlot] || [];
            const isTargetItemAllowedInSource = allowedItemsForSource.includes(item.name);
            const isSourceWeaponSlot = sourceSlot === 5 || sourceSlot === 6;
            const notSourceWeaponSlot = sourceSlot >= 7 && sourceSlot <= 9;

            // Check if target item can go to source slot
            const targetToSourceValid = (
              (!isSourceSlotRestricted || (isSourceSlotRestricted && isTargetItemAllowedInSource)) &&
              (!isSourceWeaponSlot || (isSourceWeaponSlot && targetItemWeapon)) &&
              (!notSourceWeaponSlot || (notSourceWeaponSlot && !targetItemWeapon))
            );

            if (!targetToSourceValid) return false;
          }

          return source.item.slot !== targetSlot || source.inventory !== inventoryType;
        } else {
          return (
            (source.item.slot !== targetSlot || source.inventory !== inventoryType) &&
            inventoryType !== InventoryType.SHOP &&
            inventoryType !== InventoryType.CRAFTING &&
            !(isBlacklisted && inventoryType === 'backpack')
          );
        }
      },
    }),
    [inventoryType, item, isWeaponItem, allowedItemsForSlots, blacklist]
  );

  const connectRef = (element: HTMLDivElement) => drag(drop(element));

  const handleContext = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    
    // Allow context menu for player, backpack, and non-shop/non-crafting inventories
    const allowedInventoryTypes = ['player', 'backpack', 'stash', 'container', 'drop', 'newdrop', 'trunk', 'glovebox'];
    const isAllowedInventory = allowedInventoryTypes.includes(inventoryType);
    
    if (!isAllowedInventory || !isSlotWithItem(item) || inventoryType === 'shop' || inventoryType === 'crafting') return;

    dispatch(openContextMenu({ 
      item, 
      coords: { x: event.clientX, y: event.clientY },
      inventoryType: inventoryType 
    }));
  };

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    dispatch(closeTooltip());
    if (timerRef.current) clearTimeout(timerRef.current);
    
    // Handle shop item clicks (double-click or shift+click to add to cart)
    if (inventoryType === 'shop' && isSlotWithItem(item)) {
      if (event.detail === 2 || event.shiftKey) {
        // Add visual feedback
        const element = event.currentTarget;
        element.classList.add('shop-item-added');
        
        // Remove the class after animation
        setTimeout(() => {
          element.classList.remove('shop-item-added');
        }, 600);
        
        // Create a drag source object to simulate the drop behavior
        const simulatedSource: DragSource = {
          item: {
            name: item.name,
            slot: item.slot,
            price: item.price || 0,
            currency: item.currency || 'money',
            rarity: item.rarity || 'common'
          },
          inventory: 'shop'
        };
        
        // Dispatch custom event with the simulated source
        const addToCartEvent = new CustomEvent('addToShoppingCart', {
          detail: simulatedSource
        });
        window.dispatchEvent(addToCartEvent);
        return;
      }
    }
    
    // Original click handlers for non-shop items
    if (event.ctrlKey && isSlotWithItem(item) && inventoryType !== 'shop' && inventoryType !== 'crafting') {
      onDrop({ item: item, inventory: inventoryType });
    } else if (event.altKey && isSlotWithItem(item) && inventoryType === 'player') {
      onUse(item);
    }
  };

  const refs = useMergeRefs([connectRef, ref]);

  return (
    <div
  ref={refs}
  onContextMenu={handleContext}
  onClick={handleClick}
      className={`
        size-full
        ${inventoryType === 'shop' && isSlotWithItem(item) ? 'shop-item' : ''}
        ${isDragging ? 'dragging' : ''}
        ${isFading ? 'fade-out' : ''}
        ${itemRarity === 'uncommon' ? 'uncommon' : itemRarity === 'rare' ? 'rare' : itemRarity === 'epic' ? 'epic' : itemRarity === 'mythic' ? 'mythic' : 'common'}
      `}
      style={{
        filter:
      !canPurchaseItem(item, { type: inventoryType, groups: inventoryGroups }) || !canCraftItem(item, inventoryType)
        ? 'brightness(80%) grayscale(100%)'
        : undefined,
      backgroundImage:  inventoryType !== 'crafting' ? `url(${item?.name ? getItemUrl(item as SlotWithItem) : 'none'})` : undefined,
    }}
  >
      {isSlotWithItem(item) ? (
        inventoryType !== 'crafting' ? (
          <>
            <div
              className="item-slot-wrapper"
              onMouseEnter={() => {
                timerRef.current = window.setTimeout(() => {
                  dispatch(openTooltip({ item, inventoryType }));
                }, 500) as unknown as number;
              }}
              onMouseLeave={() => {
                dispatch(closeTooltip());
                if (timerRef.current) {
                  clearTimeout(timerRef.current);
                  timerRef.current = null;
                }
              }}
            >
              <div
                className={
                  inventoryType === 'player' && item.slot <= 5 ? 'item-hotslot-header-wrapper' : 'item-slot-header-wrapper'
                }
              >
                {/* {inventoryType === 'player' && item.slot <= 5 && <div className="inventory-slot-number">{item.slot}</div>} */}
                {item.slot < 5 || item.slot > 9  ? (
                  <div className="item-slot-info-wrapper w-full flex flex-row justify-between items-center p-2 py-1 text-[10px]">
                    <p>{item.count ? item.count.toLocaleString('en-us') + `x` : ''}</p>
                    <p className={`font-semibold uppercase ${itemRarity === 'uncommon' ? 'text-[#23db0b]' : itemRarity === 'rare' ? 'text-[#0796c2]' : itemRarity === 'epic' ? 'text-[#9c32e4]' : itemRarity === 'mythic' ? 'text-[#e1e432]' : 'text-white'}`}>
                      {itemRarity}
                    </p>
                  </div>
                ) : (
                  inventoryType !== 'player' ? (
                    <div className="item-slot-info-wrapper w-full flex flex-row justify-between items-center p-2 py-1 text-[10px]">
                      <p>{item.count ? item.count.toLocaleString('en-us') + `x` : ''}</p>
                      <p className={`font-semibold uppercase ${itemRarity === 'uncommon' ? 'text-[#23db0b]' : itemRarity === 'rare' ? 'text-[#0796c2]' : itemRarity === 'epic' ? 'text-[#9c32e4]' : itemRarity === 'mythic' ? 'text-[#e1e432]' : 'text-white'}`}>
                        {itemRarity}
                      </p>
                    </div>
                  ): (
                    <div className="item-slot-info-wrapper w-full flex flex-row justify-between items-center pr-2 text-[10px] h-auto">
                      <div className='flex items-center justify-center px-1.5 h-5 mt-0.5 bg-white rounded-br-md ml-0.5'>
                        <p className='text-black'>{item.slot - 4}</p>
                      </div>
                      <p className={`font-semibold uppercase mt-1 ${itemRarity === 'uncommon' ? 'text-[#23db0b]' : itemRarity === 'rare' ? 'text-[#0796c2]' : itemRarity === 'epic' ? 'text-[#9c32e4]' : itemRarity === 'mythic' ? 'text-[#e1e432]' : 'text-white'}`}>
                        {itemRarity}
                      </p>
                    </div>
                  )
                )}
              </div>
              <div className='relative'>
                <div className="w-full flex flex-row justify-between">
                  <div className="inventory-slot-label-text max-w-[70%] h-auto">
                      {item.metadata?.label ? item.metadata.label : Items[item.name]?.label || item.name}
                  </div>
                  <div
                    className="justify-end items-end flex max-w-[30%] h-auto pr-[5px] pb-[3px] text-[10px]"
                  >
                    {/* {inventoryType === 'player' && item.slot <= 5 && <div className="inventory-slot-number">{item.slot}</div>} */}
                    {inventoryType === 'shop' && item?.price !== undefined ? (
                      <>
                        {item?.currency !== 'money' && item.currency !== 'black_money' && item.price > 0 && item.currency ? (
                          <div className="item-slot-currency-wrapper">
                            <img
                              src={item.currency ? getItemUrl(item.currency) : 'none'}
                              alt="item-image"
                              style={{
                                imageRendering: '-webkit-optimize-contrast',
                                height: 'auto',
                                width: '2vh',
                                backfaceVisibility: 'hidden',
                                transform: 'translateZ(0)',
                              }}
                            />
                            <p>{item.price.toLocaleString('en-us')}</p>
                          </div>
                        ) : (
                          <>
                            {item.price > 0 && (
                              <div
                                className="item-slot-price-wrapper"
                                style={{ color: item.currency === 'money' || !item.currency ? '#8a8a8a' : '#8a8a8a' }}
                              >
                                <p>
                                  {Locale.$ || '$'}
                                  {item.price.toLocaleString('en-us')}
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </>
                    ): (
                      <p>
                        {item.weight > 0
                          ? item.weight >= 1000
                            ? `${(item.weight / 1000).toLocaleString('en-us', {
                                minimumFractionDigits: 2,
                              })}kg `
                            : `${item.weight.toLocaleString('en-us', {
                                minimumFractionDigits: 0,
                              })}g `
                          : ''}
                      </p>
                    )}
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0">
                  {inventoryType !== 'shop' && item?.durability !== undefined && (
                    <WeightBar percent={item.durability} durability />
                  )}
                </div>
              </div>
            </div>
          </>
        ) : null
      ) : (
        inventoryType === 'player' && (
          item.slot === 1 ? (
            <div className='size-full flex flex-col items-center justify-center'>
              <BackpackIcon/>
            </div>
          ) : item.slot === 2 ? (
            <div className='size-full flex flex-col items-center justify-center'>
              <VestIcon/>
            </div>
          ) : item.slot === 3 ? (
            <div className='size-full flex flex-col items-center justify-center'>
              {IoPhonePortrait({ className: 'text-white/20 text-[4rem]' }) as any}
            </div>
          ) : item.slot === 4 ? (
            <div className='size-full flex flex-col items-center justify-center'>
              <ParachuteIcon/>
            </div>
          ) : item.slot === 5 ? (
            <div className='size-full flex flex-col items-center justify-center'>
              <PistolIcon/>
            </div>
          ) : item.slot === 6 ? (
            <div className='size-full flex flex-col items-center justify-center'>
             <RifleIcon/>
            </div>
           ) : null
        )
      )}
    </div>
  );
};

export default React.memo(React.forwardRef(InventorySlot));