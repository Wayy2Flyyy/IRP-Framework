import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from "../../store";
import { kosonginPlayerlist } from "../../store/playerlist";
import { fetchNui } from '../../utils/fetchNui';
import {
  FloatingFocusManager,
  FloatingOverlay,
  FloatingPortal,
  useDismiss,
  useFloating,
  useInteractions,
  useTransitionStyles,
} from '@floating-ui/react';

interface PlayerListData {
  playerlist: any[];
  slot: any;
  count: number;
}

const GiveItemPlayerList: React.FC = () => {
  const dispatch = useAppDispatch();
  const player = useAppSelector((state) => state.playerlist.data) as PlayerListData;
  const [selectedPlayer, setSelectedPlayer] = useState(0);
  const [count, setCount] = useState(player.count);

  const { refs, context } = useFloating({
    open: player.playerlist.length > 0,
    onOpenChange: (open) => {
      if (!open) dispatch(kosonginPlayerlist());
    },
  });

  const dismiss = useDismiss(context, { outsidePressEvent: 'mousedown' });
  const { isMounted, styles } = useTransitionStyles(context);
  const { getFloatingProps } = useInteractions([dismiss]);

  if (!isMounted) return null;

  const handleConfirm = () => {
    // Only proceed if count is valid (0 or positive) and a player is selected
    if (count >= 0 && selectedPlayer !== 0) {
      fetchNui('validGiveItem', {
        slot: player.slot,
        count,
        player: selectedPlayer,
      }).then((response) => {
        // Handle response if needed
        if (response === false) {
          // The server will send its own notification, but we can add additional UI feedback here
          console.log('Give item failed');
        }
      }).catch((error) => {
        console.error('Error giving item:', error);
      });
    } else {
      // Show error for invalid input
      console.log('Invalid give parameters');
    }
  };

  return (
    <FloatingPortal>
      <FloatingOverlay
        lockScroll
        className="z-50 flex items-center justify-center"
        style={styles}
      >
        <FloatingFocusManager context={context}>
          <div
            ref={refs.setFloating}
            {...getFloatingProps()}
            className="accent-border givePlayerListContainer w-[28rem] bg-[#1e1e1e] shadow-2xl p-6 flex flex-col gap-4 transition-all border border-white/10"
          >
            {/* Header */}
            <h2 className="text-white text-xl font-semibold tracking-wide text-center uppercase">
              Select Player
            </h2>

            {/* Player Grid */}
            <div className="playerSelectionContainer grid grid-cols-4 gap-2 h-22 overflow-y-auto custom-scroll pr-1">
              {player.playerlist.map((playerData, index) => {
                // Handle both array of server IDs and array of player objects
                const playerId = typeof playerData === 'object' ? playerData.id : playerData;
                const playerLabel = typeof playerData === 'object' ? playerData.label : playerId;
                
                return (
                  <button
                      key={index}
                      onClick={() => setSelectedPlayer(playerId)}
                      className={`text-sm px-3 py-1 rounded-md border text-white transition-all ${
                        selectedPlayer === playerId
                          ? 'bg-[var(--color-secondary)]/30 border-[var(--color-primary)] text-white'  // Changed to secondary
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                    {playerLabel}
                  </button>
                );
              })}
            </div>

            {/* Count Input */}
            <input
              type="number"
              min={0}
              className="w-full text-center px-4 py-2 rounded-md bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              value={count}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setCount(!isNaN(val) && val >= 0 ? val : 0);
              }}
            />
            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => dispatch(kosonginPlayerlist())}
                className="flex-1 px-4 py-2 rounded-md uppercase text-white bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-500/40 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-2 rounded-md uppercase text-white bg-white/5 border border-white/10 hover:bg-[var(--color-primary)]/20 hover:border-[var(--color-primary)]/40 transition-all"  // Changed to secondary
              >
                Give
              </button>
            </div>
          </div>
        </FloatingFocusManager>
      </FloatingOverlay>
    </FloatingPortal>
  );
};

export default GiveItemPlayerList;
