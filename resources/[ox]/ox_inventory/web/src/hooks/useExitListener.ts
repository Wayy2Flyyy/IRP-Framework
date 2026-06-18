import { useEffect, useRef } from 'react';
import { noop } from '../utils/misc';
import { fetchNui } from '../utils/fetchNui';
import { closeTooltip } from '../store/tooltip';
import { deleteCraftItems } from '../store/selectedCraftItems';
import { useAppDispatch } from '../store';
import { closeContextMenu } from '../store/contextMenu';
import { kosonginPlayerlist } from "../store/playerlist";

type FrameVisibleSetter = (bool: boolean) => void;

// Basic hook to listen for key presses in NUI in order to exit
export const useExitListener = (visibleSetter: FrameVisibleSetter) => {
  const setterRef = useRef<FrameVisibleSetter>(noop);
  const dispatch = useAppDispatch();

  useEffect(() => {
    setterRef.current = visibleSetter;
  }, [visibleSetter]);

  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      // Only handle Escape key - Tab will be handled separately after inventory setup
      if (e.code === 'Escape') {
        setterRef.current(false);
        dispatch(closeTooltip());
        dispatch(kosonginPlayerlist());
        dispatch(closeContextMenu());
        dispatch(deleteCraftItems());
        fetchNui('exit');
      }
    };

    window.addEventListener('keyup', keyHandler);

    return () => window.removeEventListener('keyup', keyHandler);
  }, []);
};

// New hook specifically for Tab key handling after inventory setup
export const useTabExitListener = (visibleSetter: FrameVisibleSetter, inventoryReady: boolean) => {
  const setterRef = useRef<FrameVisibleSetter>(noop);
  const dispatch = useAppDispatch();

  useEffect(() => {
    setterRef.current = visibleSetter;
  }, [visibleSetter]);

  useEffect(() => {
    if (!inventoryReady) return;

    const keyHandler = (e: KeyboardEvent) => {
      if (e.code === 'Tab') {
        e.preventDefault(); // Prevent tab navigation
        setterRef.current(false);
        dispatch(closeTooltip());
        dispatch(kosonginPlayerlist());
        dispatch(closeContextMenu());
        dispatch(deleteCraftItems());
        fetchNui('exit');
      }
    };

    // Add a small delay before activating the Tab listener
    // This prevents closing if Tab is still held down from opening the inventory
    const timeoutId = setTimeout(() => {
      window.addEventListener('keyup', keyHandler);
    }, 200);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('keyup', keyHandler);
    };
  }, [inventoryReady]);
};