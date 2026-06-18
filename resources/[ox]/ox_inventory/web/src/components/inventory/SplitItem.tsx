import React, { useState, useEffect } from 'react';
import { onDrop } from '../../dnd/onDrop';
import {
  FloatingFocusManager,
  FloatingOverlay,
  FloatingPortal,
  useDismiss,
  useFloating,
  useInteractions,
  useTransitionStyles,
} from '@floating-ui/react';

interface Props {
  infoVisible: boolean;
  setInfoVisible: React.Dispatch<React.SetStateAction<boolean>>;
  item: any;
  inventoryType: string | null;
}

const SplitItem: React.FC<Props> = ({ infoVisible, setInfoVisible, item, inventoryType }) => {
  if (!item || !inventoryType) return null;
  
  const { refs, context } = useFloating({
    open: infoVisible,
    onOpenChange: setInfoVisible,
  });

  const dismiss = useDismiss(context, { outsidePressEvent: 'mousedown' });
  const { isMounted, styles } = useTransitionStyles(context);
  const { getFloatingProps } = useInteractions([dismiss]);

  const [splitValue, setSplitValue] = useState(Math.ceil(item.count / 2));

  useEffect(() => {
    if (!infoVisible) {
      setSplitValue(Math.ceil(item.count / 2));
    }
  }, [infoVisible, item.count]);

  const handleSplit = (fraction: number) => {
    const newValue = Math.ceil(item.count / fraction);
    setSplitValue(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (value >= 0 && value <= item.count) {
      setSplitValue(value);
    } 
  };

  if (!isMounted) {
    return null;
  }
  
  const HandleConfirm = () => {
    // Use the actual inventory type instead of hardcoding 'player'
    onDrop({ item: item, inventory: inventoryType }, { inventory: inventoryType, item: { slot: -1 } }, splitValue);
    setInfoVisible(false);
  };
  
  return (
    <FloatingPortal>
      <FloatingOverlay
        lockScroll
        className="useful-controls-dialog-overlay flex items-center justify-center"
        data-open={infoVisible}
        style={styles}
      >
        <FloatingFocusManager context={context}>
          <div
            ref={refs.setFloating}
            {...getFloatingProps()}
            className="bg-[#2b2b2b50] border border-white/20 p-5 flex flex-col outline-none gap-3 rounded-xl justify-start items-center shadow-md shadow-black/70"
          >
            <div className="geistFont w-full flex items-center justify-center h-fit uppercase text-2xl font-semibold text-white">
              <p>SPLIT</p>
            </div>
            <div className="flex flex-col gap-2 justify-start items-center w-auto">
              <p className="text-white text-sm">Item Quantity</p>
              <input
                className="w-[8rem] bg-black/70 border border-white/30 py-1 rounded-sm text-white/80 outline-none text-center font-semibold"
                type="number"
                value={splitValue}
                onChange={handleInputChange}
                min={0}
                max={item.count}
              />
              <input
                className="inputRange mt-1"
                type="range"
                value={splitValue}
                onChange={(e) => setSplitValue(Number(e.target.value))}
                min={0}
                max={item.count}
              />
              <div className="flex gap-2 mt-3">
                <button
                  className="px-3 py-1 bg-black/70 border border-white/30 text-white rounded-sm hover:bg-[var(--color-secondary)] hover:border-[var(--color-primary)]"
                  onClick={() => handleSplit(2)}
                >
                  1/2
                </button>
                <button
                  className="px-3 py-1 bg-black/70 border border-white/30 text-white rounded-sm hover:bg-[var(--color-secondary)] hover:border-[var(--color-primary)]"
                  onClick={() => handleSplit(3)}
                >
                  1/3
                </button>
                <button
                  className="px-3 py-1 bg-black/70 border border-white/30 text-white rounded-sm hover:bg-[var(--color-secondary)] hover:border-[var(--color-primary)]"
                  onClick={() => handleSplit(4)}
                >
                  1/4
                </button>
              </div>
              <div className="flex gap-2 mt-5 w-full justify-center">
                <button
                  onClick={() => {
                    setInfoVisible(false);
                  }}
                  className="flex-1 py-1 bg-black/70 border border-white/30 text-white rounded-sm hover:bg-[var(--color-secondary)] hover:border-[var(--color-primary)] text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    HandleConfirm();
                  }}
                  className="flex-1 py-1 bg-black/70 border border-white/30 text-white rounded-sm hover:bg-[var(--color-secondary)] hover:border-[var(--color-primary)] text-sm"
                >
                  Split
                </button>
              </div>
            </div>
          </div>
        </FloatingFocusManager>
      </FloatingOverlay>
    </FloatingPortal>
  );
};

export default SplitItem;