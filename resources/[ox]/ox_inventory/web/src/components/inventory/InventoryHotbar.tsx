import React, { useState } from 'react';
import { getItemUrl, isSlotWithItem } from '../../helpers';
import useNuiEvent from '../../hooks/useNuiEvent';
import { Items } from '../../store/items';
import WeightBar from '../utils/WeightBar';
import { useAppSelector } from '../../store';
import { selectLeftInventory } from '../../store/inventory';
import { SlotWithItem } from '../../typings';
import SlideUp from '../utils/transitions/SlideUp';

const InventoryHotbar: React.FC = () => {
  const [hotbarVisible, setHotbarVisible] = useState(false);
  const items = useAppSelector(selectLeftInventory).items.slice(4, 9);

  //stupid fix for timeout
  const [handle, setHandle] = useState<NodeJS.Timeout>();
  useNuiEvent('toggleHotbar', () => {
    if (hotbarVisible) {
      setHotbarVisible(false);
    } else {
      if (handle) clearTimeout(handle);
      setHotbarVisible(true);
      setHandle(setTimeout(() => setHotbarVisible(false), 3000));
    }
  });

  const slotLabels: { [key: number]: string } = {
    1: 'WEAPON SLOT 1',
    2: 'WEAPON SLOT 2',
    3: 'HOTKEY SLOT 3',
    4: 'HOTKEY SLOT 4',
    5: 'HOTKEY SLOT 5',
  };  

  return (
    <SlideUp in={hotbarVisible}>
      <div className="hotbar-container">
        {items.map((item) => (
          <div
            className={`
              hotbar-item-slot
              ${item.metadata?.rarity === 'uncommon' ? 'uncommon' : item.metadata?.rarity === 'rare' ? 'rare' : item.metadata?.rarity === 'epic' ? 'epic' : item.metadata?.rarity === 'mythic' ? 'mythic' : 'common'}
            `}
            style={{
              backgroundImage: `url(${item?.name ? getItemUrl(item as SlotWithItem) : 'none'}`,
            }}
            key={`hotbar-${item.slot}`}
          >

            <div className="slot-label text-[13px] text-white mb-1 text-center">
              {slotLabels[item.slot - 4]}
            </div>
            {isSlotWithItem(item) && (
              <div className="item-slot-wrapper">
                <div className="item-slot-info-wrapper w-full flex flex-row justify-between items-center pr-2 text-[10px] h-auto">
                  <div className='flex items-center justify-center px-1.5 h-5 mt-0.5 bg-white rounded-br-md ml-0.5'>
                    <p className='text-black'>{item.slot - 4}</p>
                  </div>
                  {item.metadata?.rarity ? (
                      <p className={`font-semibold uppercase mt-1 ${item.metadata?.rarity === 'uncommon' ? 'text-[#23db0b]' : item.metadata?.rarity === 'rare' ? 'text-[#0796c2]' : item.metadata?.rarity === 'epic' ? 'text-[#9c32e4]' : item.metadata?.rarity === 'mythic' ? 'text-[#e1e432]' : ''}`}>{item.metadata?.rarity}</p>
                    ) : (
                      <p className='font-semibold uppercase mt-1 text-white'>common</p>
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
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0">
                    {item?.durability !== undefined && <WeightBar percent={item.durability} durability />}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </SlideUp>
  );
};

export default InventoryHotbar;
