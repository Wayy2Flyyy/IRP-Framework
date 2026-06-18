import React, { useState, useEffect } from 'react';
import useNuiEvent from '../../hooks/useNuiEvent';
import InventoryHotbar from './InventoryHotbar';
import { useAppDispatch } from '../../store';
import { refreshSlots, setAdditionalMetadata, setupInventory, selectRightInventory, selectLeftInventoryBottom } from '../../store/inventory';
import { useExitListener, useTabExitListener } from '../../hooks/useExitListener';
import type { Inventory as InventoryProps } from '../../typings';
import RightInventory from './RightInventory';
import LeftInventory from './LeftInventory';
import Utility from './Utility';
import LeftInventoryBottom from './LeftInventoryBottom';
import Tooltip from '../utils/Tooltip';
import { kosonginPlayerlist } from "../../store/playerlist";
import { closeTooltip } from '../../store/tooltip';
import { deleteCraftItems } from '../../store/selectedCraftItems';
import InventoryContext from './InventoryContext';
import { closeContextMenu } from '../../store/contextMenu';
import Fade from '../utils/transitions/Fade';
import { IoIosHelpCircleOutline } from "react-icons/io";
import UsefulControls from './UsefulControls';
import { useAppSelector } from '../../store';
import ShopCart from './ShopCart';
import GiveItemPlayerList from './GiveItemPlayerList';

const Inventory: React.FC = () => {
  const [inventoryVisible, setInventoryVisible] = useState(false);
  const [inventoryReady, setInventoryReady] = useState(false);
  const dispatch = useAppDispatch();
  const [hover, setHover] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const [utility, setUtility] = useState(false);
  const [lastKeyPress, setLastKeyPress] = useState<number>(0);
  const delay = 500; // delay in milliseconds

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const currentTime = Date.now();
      if (currentTime - lastKeyPress < delay) return;

      if (event.key === 'Q' || event.key === 'q') {
        if (utility) setUtility(false);
      } else if (event.key === 'E' || event.key === 'e') {
        if (!utility) setUtility(true);
      }

      setLastKeyPress(currentTime);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [utility, lastKeyPress]);

  const RightInventoryData = useAppSelector(selectRightInventory);
  const LeftBottomData = useAppSelector(selectLeftInventoryBottom);

  useNuiEvent<boolean>('setInventoryVisible', setInventoryVisible);
  useNuiEvent<false>('closeInventory', () => {
    setInventoryVisible(false);
    setInventoryReady(false);
    dispatch(closeContextMenu());
    dispatch(closeTooltip());
    dispatch(kosonginPlayerlist());
    dispatch(deleteCraftItems());
  });
  useExitListener(setInventoryVisible);
  useTabExitListener(setInventoryVisible, inventoryReady);

  useNuiEvent<{
    leftInventory?: InventoryProps;
    rightInventory?: InventoryProps;
  }>('setupInventory', (data) => {
    dispatch(setupInventory(data));
    setUtility(false); // Reset to inventory tab when opening new inventory
    !inventoryVisible && setInventoryVisible(true);
    setInventoryReady(true);
  });

  useNuiEvent('refreshSlots', (data) => dispatch(refreshSlots(data)));

  useNuiEvent('displayMetadata', (data: Array<{ metadata: string; value: string }>) => {
    dispatch(setAdditionalMetadata(data));
  });

  return (
    <>
      <Fade in={inventoryVisible}>
        <div className="inventory-wrapper relative">
          <GiveItemPlayerList />
          {RightInventoryData.type !== 'shop' && RightInventoryData.type !== 'crafting' && (
            <div id='info' className='absolute top-7 right-12 flex flex-row gap-2 z-10'>
              <div className={`border py-2 px-4 rounded-sm flex gap-2 items-center justify-center hover:bg-[var(--color-secondary)] hover:border-[var(--color-primary)] ${utility ? 'bg-[var(--color-secondary)] border-white/20' : 'bg-[var(--color-secondary)] border-[var(--color-primary)]'}`} onClick={() => setUtility(false)}>
                <p className='text-white text-xs font-semibold uppercase'>Inventories</p>
                <div className='bg-black/50 py-1 px-2 rounded-sm text-xs border border-white/20 font-semibold'>
                  Q
                </div>
              </div>
                <div className={`border py-2 px-4 rounded-sm flex gap-2 items-center justify-center hover:bg-[var(--color-secondary)] hover:border-[var(--color-primary)] ${!utility ? 'bg-[var(--color-secondary)] border-white/20' : 'bg-[var(--color-secondary)] border-[var(--color-primary)]'}`} onClick={() => setUtility(true)}>
                <p className='text-white text-xs font-semibold uppercase'>utility</p>
                <div className='bg-black/50 py-1 px-2 rounded-sm text-xs border border-white/20 font-semibold'>
                  E
                </div>
              </div>
            </div>
          )}
          <UsefulControls infoVisible={infoVisible} setInfoVisible={setInfoVisible} />
          <div className='h-full flex flex-col items-center justify-center gap-3 py-10' style={{ perspective: '1000px' }}>
            <LeftInventory />
            {LeftBottomData.open && (
              <LeftInventoryBottom />
            )}
          </div>
          <div className='h-full flex flex-col items-center justify-center gap-3 py-10 overflow-x-hidden' style={{ perspective: '1000px' }}>
          {RightInventoryData.type !== 'shop' && RightInventoryData.type !== 'crafting' && RightInventoryData.type !== 'externalcraft' ? (
          utility ? (
            <Utility />
          ) : (
            <RightInventory />
          )
        ) : (
          RightInventoryData.type !== 'externalcraft' && <RightInventory />
        )}

          {RightInventoryData.type === 'shop' && <ShopCart inventory={RightInventoryData} />}
          </div>
          <Tooltip />
          <InventoryContext />
        </div>
      </Fade>
      <InventoryHotbar />
    </>
  );
};

export default Inventory;
