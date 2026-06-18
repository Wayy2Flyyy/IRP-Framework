import { Locale } from '../../store/locale';
import React, { useState } from 'react';
import {
  FloatingFocusManager,
  FloatingOverlay,
  FloatingPortal,
  useDismiss,
  useFloating,
  useInteractions,
  useTransitionStyles,
} from '@floating-ui/react';

const keybinds = [
  { label: 'Quick Switch Between View', keys: ['Q', 'E'] },
  { label: Locale.ui_rmb, keys: ['RMB'] },
  { label: Locale.ui_ctrl_lmb, keys: ['SHIFT + DRAG'] },
  { label: Locale.ui_alt_lmb, keys: ['ALT + LMB'] },
  { label: Locale.ui_ctrl_lmb, keys: ['CTRL + LMB'] },
  { label: Locale.ui_ctrl_shift_lmb, keys: ['CTRL + SHIFT + LMB'] },
];

interface Props {
  infoVisible: boolean;
  setInfoVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

const UsefulControls: React.FC<Props> = ({ infoVisible, setInfoVisible }) => {
  const { refs, context } = useFloating({
    open: infoVisible,
    onOpenChange: setInfoVisible,
  });

  const dismiss = useDismiss(context, { outsidePressEvent: 'mousedown' });
  const { isMounted, styles } = useTransitionStyles(context);
  const { getFloatingProps } = useInteractions([dismiss]);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isAtEdge, setIsAtEdge] = useState(false); // Untuk menentukan apakah mouse di tepi

  const handleMouseMove = (e: React.MouseEvent) => {
    const bounds = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const y = e.clientY - bounds.top;

    const centerX = bounds.width / 2;
    const centerY = bounds.height / 2;

    const deltaX = (x - centerX) / centerX;
    const deltaY = (y - centerY) / centerY;

    // Margin tepi: misalnya 20% dari lebar/tinggi
    const edgeMargin = 0.2;
    const isEdge =
      x < bounds.width * edgeMargin ||
      x > bounds.width * (1 - edgeMargin) ||
      y < bounds.height * edgeMargin ||
      y > bounds.height * (1 - edgeMargin);

    setMousePos({ x: deltaX, y: deltaY });
    setIsAtEdge(isEdge);
  };

  const handleMouseLeave = () => {
    setIsAtEdge(false);
  };

  if (!isMounted) {
    return null;
  }

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
              className="useful-controls-dialog rounded-xl justify-start items-center shadow-md shadow-black/70"
              style={{
                ...styles,
                transform: isAtEdge
                  ? `perspective(1000px) rotateX(${mousePos.y * 10}deg) rotateY(${mousePos.x * 10}deg)`
                  : 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
                transition: 'transform 0.3s ease-out',
              }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <div className="w-full flex items-center justify-center h-fit uppercase text-lg font-semibold text-white">
                <p>{Locale.ui_usefulcontrols || 'help & keybinds'}</p>
              </div>

              <div className="useful-controls-content-wrapper size-full">
                {keybinds.map((bind, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between ${
                      index < keybinds.length - 1
                        ? 'border-b border-white/60 pb-3'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 justify-between w-full">
                      <p>{bind.label}</p>
                      <div className="flex items-center gap-2">
                        {bind.keys.map((key, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-center h-8 rounded-md bg-black/50 text-white text-sm font-semibold border border-white/20"
                            style={{ width: `${key.length * 10 + 20}px` }}
                          >
                            {key}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FloatingFocusManager>
        </FloatingOverlay>
      </FloatingPortal>
    );
};


export default UsefulControls;
