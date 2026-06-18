import React, { useContext, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { TransitionGroup } from 'react-transition-group';
import useNuiEvent from '../../hooks/useNuiEvent';
import useQueue from '../../hooks/useQueue';
import { Locale } from '../../store/locale';
import { getItemUrl } from '../../helpers';
import { SlotWithItem } from '../../typings';
import { Items } from '../../store/items';
import FadeZoom from './transitions/FadeZoom';

interface ItemNotificationProps {
  item: SlotWithItem;
  text: string;
}

export const ItemNotificationsContext = React.createContext<{
  add: (item: ItemNotificationProps) => void;
} | null>(null);

export const useItemNotifications = () => {
  const itemNotificationsContext = useContext(ItemNotificationsContext);
  if (!itemNotificationsContext) throw new Error(`ItemNotificationsContext undefined`);
  return itemNotificationsContext;
};

const ItemNotification = React.forwardRef(
  (props: { item: ItemNotificationProps; style?: React.CSSProperties }, ref: React.ForwardedRef<HTMLDivElement>) => {
    const slotItem = props.item.item;

    return (
      <div
        className={`
          hotbar-item-slot
          ${slotItem.metadata?.rarity === 'uncommon' ? 'uncommon' : slotItem.metadata?.rarity === 'rare' ? 'rare' : slotItem.metadata?.rarity === 'epic' ? 'epic' : slotItem.metadata?.rarity === 'mythic' ? 'mythic' : 'common'}
        `}
        style={{
          backgroundImage: `url(${getItemUrl(slotItem) || 'none'}`,
          ...props.style,
        }}
        ref={ref}
      >
        <div className="item-slot-wrapper">
          <div className="item-slot-info-wrapper w-full flex flex-row justify-between items-center px-2 pt-1 text-[10px] h-auto">
            <p className='uppercase text-[8px]'>{props.item.text}</p>
            {/* {slotItem.metadata?.rarity ? (
                <p className={`font-semibold uppercase${slotItem.metadata?.rarity === 'uncommon' ? 'text-[#23db0b]' : slotItem.metadata?.rarity === 'rare' ? 'text-[#0796c2]' : slotItem.metadata?.rarity === 'epic' ? 'text-[#9c32e4]' : slotItem.metadata?.rarity === 'mythic' ? 'text-[#e1e432]' : ''}`}>{slotItem.metadata?.rarity}</p>
              ) : (
                <p className='font-semibold uppercase text-white'>common</p>
            )} */}
          </div>
          <div className='relative'>
            <div className="w-full flex flex-row justify-between">
              <div className="inventory-slot-label-text max-w-[70%] h-auto">
                {slotItem.metadata?.label || Items[slotItem.name]?.label}
              </div>
              <div
                className="justify-end items-end flex max-w-[30%] h-auto pr-[5px] pb-[3px] text-[10px]"
              >
                <p>
                  {slotItem.weight > 0
                    ? slotItem.weight >= 1000
                      ? `${(slotItem.weight / 1000).toLocaleString('en-us', {
                          minimumFractionDigits: 2,
                        })}kg `
                      : `${slotItem.weight.toLocaleString('en-us', {
                          minimumFractionDigits: 0,
                        })}g `
                    : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export const ItemNotificationsProvider = ({ children }: { children: React.ReactNode }) => {
  const queue = useQueue<{
    id: number;
    item: ItemNotificationProps;
    ref: React.RefObject<HTMLDivElement>;
  }>();

  const add = (item: ItemNotificationProps) => {
    const ref = React.createRef<HTMLDivElement>();
    const notification = { id: Date.now(), item, ref: ref };

    queue.add(notification);

    const timeout = setTimeout(() => {
      queue.remove();
      clearTimeout(timeout);
    }, 2500);
  };

  useNuiEvent<[item: SlotWithItem, text: string, count?: number]>('itemNotify', ([item, text, count]) => {
    add({ item: item, text: count ? `${Locale[text]} ${count}x` : `${Locale[text]}` });
  });
  // useEffect(() => {
  //   const handleKeyDown = (event: KeyboardEvent) => {
  //     if (event.key === 'E' || event.key === 'e') {
  //       const dummyItem = { 
  //         slot: 1, 
  //         name: 'water', 
  //         count: 1, 
  //         weight: 1, 
  //         metadata: { label: 'Example Item' } 
  //       } as SlotWithItem;
  //       add({ item: dummyItem, text: 'removed' });
  //     }
  //   };

  //   window.addEventListener('keydown', handleKeyDown);
  //   return () => {
  //     window.removeEventListener('keydown', handleKeyDown);
  //   };
  // }, []);

  return (
    <ItemNotificationsContext.Provider value={{ add }}>
      {children}
      {createPortal(
        <TransitionGroup className="item-notification-container">
          {queue.values.map((notification, index) => (
            <FadeZoom key={`item-notification-${index}`}>
              <ItemNotification item={notification.item} ref={notification.ref} />
            </FadeZoom>
          ))}
        </TransitionGroup>,
        document.body
      )}
    </ItemNotificationsContext.Provider>
  );
};
