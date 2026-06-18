import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Inventory } from '../../typings';
import WeightBar from '../utils/WeightBar';
import InventorySlot from './InventorySlot';
import { getTotalWeight } from '../../helpers';
import { useAppSelector } from '../../store';
import { useIntersection } from '../../hooks/useIntersection';
import { getItemUrl } from '../../helpers';
import CraftingSlot from './CraftingTable';
import CraftingInfo from './CraftingInformation';
import { Locale } from '../../store/locale';
import { fetchNui } from '../../utils/fetchNui';


import { LuWeight } from "react-icons/lu";
import { FaChevronUp } from "react-icons/fa";

interface GenderProps {
  gender : string;
}

const PAGE_SIZE = 150;
const InventoryGrid: React.FC<{ inventory: Inventory, utility?: boolean }> = ({ inventory, utility }) => {
  const weight = useMemo(
    () => (inventory.maxWeight !== undefined ? Math.floor(getTotalWeight(inventory.items) * 1000) / 1000 : 0),
    [inventory.maxWeight, inventory.items]
  );
  const [page, setPage] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { ref, entry } = useIntersection({ threshold: 0.5 });
  const isBusy = useAppSelector((state) => state.inventory.isBusy);
  const gender = useAppSelector((state) => state.settings.data) as GenderProps;
  const [extend, setExtend] = useState<{ [key: string]: boolean }>({});
  const [animate, setAnimate] = useState(false); // State untuk animasi
  const [search, setSearch] = useState('');
  const [filteredItems, setFilteredItems] = useState(inventory.type === 'crafting' ? inventory.items : []);

  useEffect(() => {
    if (entry && entry.isIntersecting) {
      setPage((prev) => ++prev);
    }
  }, [entry]);
  useEffect(() => {
    setExtend((prev) => ({ ...prev, [inventory.id]: true }));
  }, [inventory]);
  useEffect(() => {
    if (utility) {
      setAnimate(true);
    }
  }, [utility]);

  useEffect(() => {
    if (utility && containerRef.current) {
      const handleWheel = (e: WheelEvent) => {
        if (e.shiftKey || e.deltaX !== 0) {
          e.preventDefault();
        }
      };

      const container = containerRef.current;
      container.addEventListener('wheel', handleWheel, { passive: false });

      return () => {
        container.removeEventListener('wheel', handleWheel);
      };
    }
  }, [utility]);

  useEffect(() => {
    if (search.length > 0) {
      setFilteredItems(inventory.items.filter((item:any) => {
        if (item.label) {
          return item.label.toLowerCase().includes(search.toLowerCase());
        } else if (item.name) {
          return item.name.toLowerCase().includes(search.toLowerCase());
        }
        // item.label && item.label.toLowerCase().includes(search.toLowerCase())
      }));
    } else {
      setFilteredItems(inventory.items);
    }
  }, [search, inventory.items]);
  return (
    <>
      {!utility ? (
        <div className="inventory-grid-wrapper transform py-5 px-6 bg-black/25 rounded-[8px] miring transition-all duration-500 ease-in-out h-auto" style={{ pointerEvents: isBusy ? 'none' : 'auto', transform: inventory.type === 'player' && !utility || inventory.type === 'backpack' ? 'rotateX(0deg) rotateY(7deg)' : 'rotateX(0deg) rotateY(-7deg)' }}>
          <div>
            <div className="inventory-grid-header-wrapper">
              <div className='flex items-center justify-start gap-3'>
                <p className="text-md font-semibold text-berjarak">
                  {inventory.type === 'player' ? Locale.ui_pockets || 'Pocket' : inventory.type === 'backpack' ? Locale.ui_backpack || 'Backpacks' : inventory.type === 'crafting' ? Locale.ui_crafting || "Recipe" : inventory.type === 'drop' || inventory.type === 'newdrop' ? Locale.ui_ground || "Grounds" : inventory.label}
                </p>
                {inventory.type != 'shop' && inventory.type != 'crafting' && (
                  <div className="flex items-center gap-2">
                  {LuWeight({ className: "text-sm text-white" }) as any}
                  {inventory.maxWeight && (
                    <p className="text-[14px] font-[600] text-white">
                      {weight / 1000}/
                      {(inventory.type === "drop" || inventory.type === "newdrop") ? (
                        <i className="fa-regular fa-infinity inf-icon"></i>
                      ) : (
                        inventory.maxWeight / 1000
                      )}
                      kg
                    </p>
                  )}
                </div>
                )}
              </div>
              {inventory.type != 'shop' && inventory.type != 'crafting' && (
                <button
                className="flex items-center text-md font-semibold text-white transition-transform duration-200"
                onClick={() => setExtend((prev) => ({ ...prev, [inventory.id]: !prev[inventory.id] }))}>
                  {FaChevronUp({ className: `transform ${extend[inventory.id] ? 'rotate-180' : 'rotate-0'} transition-transform duration-200` }) as any}
                </button>
              )}
            </div>
            {inventory.type != 'shop' && inventory.type != 'crafting' && (
              <WeightBar percent={inventory.maxWeight ? (weight / inventory.maxWeight) * 100 : 0} />
            )}
            {inventory.type === 'crafting' && (
              <div className='flex flex-row gap-4 justify-start items-center h-8 mt-1'>
                <div className='w-[100%] h-full flex flex-row gap-4 justify-start items-center'>
                  <input 
                  type='text' 
                  className='w-full h-full bg-black/80 text-white text-xs font-semibold border border-white/40 rounded-sm px-2 py-1' 
                  placeholder='Search' 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={() => {
                    fetchNui('setSearching', true);
                  }}
                  onBlur={() => {
                    fetchNui('setSearching', false);
                  }}
                />
                </div>
              </div>
            )}
          </div>
          <div
            className={`inventory-grid-container transition-all duration-500 ease-in-out overflow-hidden ${
              extend[inventory.id] ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
            }`}
            style={{
              height: inventory.type === 'player' || inventory.type === 'shop' ? 'calc(3 * 11vh + 2 * 10px': 
              inventory.type === 'backpack' ? 'calc(2 * 10.77vh + 1 * 10px' : 
              inventory.type === 'stash' ? 'calc(3*10.92vh + 2 * 10px' :
              inventory.type === 'crafting' ? 'calc(2 * 10.92vh + 1 * 10px' : 
              'calc(4 * 10.77vh + 3 * 10px',
              // gridTemplateColumns: inventory.type === 'crafting' ? 'repeat(3, 15.5vh)' : '',
              // gridAutoRows: inventory.type === 'crafting' ? '23.5vh' : '',
            }}
            ref={containerRef}
          >
            <>
            {inventory.type === 'player' ? (
                inventory.items.slice(9, (page + 1) * PAGE_SIZE).map((item, index) => (
                  <InventorySlot
                    key={`${inventory.type}-${inventory.id}-${item.slot}`}
                    item={item}
                    ref={index === (page + 1) * PAGE_SIZE - 1 ? ref : null}
                    inventoryType={inventory.type}
                    inventoryGroups={inventory.groups}
                    inventoryId={inventory.id}
                  />
                ))
              ): inventory.type === 'crafting' ? (
                filteredItems.slice(0, (page + 1) * PAGE_SIZE).map((item, index) => (
                  <CraftingSlot
                    key={`${inventory.type}-${inventory.id}-${item.slot}`}
                    item={item}
                    // ref={index === (page + 1) * PAGE_SIZE - 1 ? ref : null}
                    inventoryType={inventory.type}
                    inventoryGroups={inventory.groups}
                    inventoryId={inventory.id}
                  />
                ))
              ) : (
                inventory.items.slice(0, (page + 1) * PAGE_SIZE).map((item, index) => (
                  <InventorySlot
                    key={`${inventory.type}-${inventory.id}-${item.slot}`}
                    item={item}
                    ref={index === (page + 1) * PAGE_SIZE - 1 ? ref : null}
                    inventoryType={inventory.type}
                    inventoryGroups={inventory.groups}
                    inventoryId={inventory.id}
                  />
                ))
              )}
            </>
          </div>
          {inventory.type === 'crafting' && (
            <CraftingInfo />
          )}
        </div>
      ):(
        <div
          ref={containerRef}
          className={`inventory-grid-wrapper transform py-5 px-6 transition-all duration-500 ease-in-out h-auto gap-5 border-none items-center overflow-x-hidden ${
            animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
          style={{
            pointerEvents: isBusy ? 'none' : 'auto',
            transform: 'rotateX(0deg) rotateY(-7deg)',
          }}
        >
          <div id='atas' className='w-auto flex flex-row gap-5 justify-start items-start relative overflow-x-hidden'>
            <div className='inventory-grid-container2 gap-[15px]' style={{ gridTemplateColumns: 'repeat(1, 10.77vh)', height: 'calc(3 * 10.77vh + 3 * 35px' }}>
                {inventory.items.slice(0, 3).map((item, index) => (
                  <div className='flex flex-col justify-start items-start gap-1' key={index}>
                    <p className='text-xs font-semibold uppercase'>{index === 0 ? 'backpack' : index === 1 ? 'body armour' : 'phone'}</p>
                    <InventorySlot
                      key={`${inventory.type}-${inventory.id}-${item.slot}`}
                      item={item}
                      ref={index === (page + 1) * PAGE_SIZE - 1 ? ref : null}
                      inventoryType={inventory.type}
                      inventoryGroups={inventory.groups}
                      inventoryId={inventory.id}
                    />
                  </div>
                ))}
            </div>
            <img src={getItemUrl(gender.gender)} alt='backpack' className='h-[29rem] img-rendering'/>
            <div className='inventory-grid-container2 gap-[15px]' style={{ gridTemplateColumns: 'repeat(1, 10.77vh)', height: 'calc(3 * 10.77vh + 3 * 36px' }}>
                {inventory.items.slice(3, 6).map((item, index) => (
                  <div className='flex flex-col justify-start items-start gap-1' key={index}>
                    <p className='text-xs font-semibold uppercase'>{index === 0 ? 'parachute' : 'weapon slot'}</p>
                    <InventorySlot
                      key={`${inventory.type}-${inventory.id}-${item.slot}`}
                      item={item}
                      ref={index === (page + 1) * PAGE_SIZE - 1 ? ref : null}
                      inventoryType={inventory.type}
                      inventoryGroups={inventory.groups}
                      inventoryId={inventory.id}
                    />
                  </div>
                ))}
            </div>
          </div>
          <div className='inventory-grid-container2 gap-8 mt-2' style={{ gridTemplateColumns: 'repeat(3, 10.77vh)' }}>
                {inventory.items.slice(6, 9).map((item, index) => (
                  <div className='flex flex-col justify-start items-start gap-1' key={index}>
                    <p className='text-xs font-semibold uppercase'>{'hotkey slot ' + (index + 1)}</p>
                    <InventorySlot
                      key={`${inventory.type}-${inventory.id}-${item.slot}`}
                      item={item}
                      ref={index === (page + 1) * PAGE_SIZE - 1 ? ref : null}
                      inventoryType={inventory.type}
                      inventoryGroups={inventory.groups}
                      inventoryId={inventory.id}
                    />
                  </div>
                ))}
          </div>
        </div>
      )}
    </>
  );
};

export default InventoryGrid;
