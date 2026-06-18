import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDrop } from 'react-dnd';
import { Inventory, DragSource, SlotWithItem } from '../../typings';
import { Locale } from '../../store/locale';
import { getItemUrl } from '../../helpers';
import { useAppSelector } from '../../store';
import { Items } from '../../store/items';
import { BsPlusSquare } from "react-icons/bs";
import { FaMinus, FaPlus, FaRegTrashCan } from "react-icons/fa6";
import { LuCoins  } from "react-icons/lu";
import { RiBankCard2Line  } from "react-icons/ri";
import { onBuy } from '../../dnd/onBuy';

const ShopCart: React.FC<{ inventory: Inventory }> = ({ inventory }) => {
  const isBusy = useAppSelector((state) => state.inventory.isBusy);
  const [sourcee, setSourcee] = useState<DragSource | null>(null);
  const [cartItems, setCartItems] = useState<{ 
    name: string; 
    quantity: number; 
    price: number; 
    slot: number; 
    currency: string; 
    rarity: string;
    metadata?: any; // Store full metadata
  }[]>([]);
  const [onlyCash, setOnlyCash] = useState<boolean>(false);
  const [onlyBlackMoney, setOnlyBlackMoney] = useState<boolean>(false);
  const [inventoryType, setInventoryType] = useState<string>('');

  // Helper function to get the full item data from shop inventory
  const getShopItemData = (slot: number): SlotWithItem | undefined => {
    return inventory.items.find((item: any) => item.slot === slot) as SlotWithItem;
  };

  useEffect(() => {
    const handleAddToCart = (event: CustomEvent) => {
      const source = event.detail as DragSource;
      
      if (!sourcee) setSourcee(source);
      if (inventoryType === '') setInventoryType(source.inventory);
      
      const existingItem = cartItems.find((item) => item.name === source.item.name && item.slot === source.item.slot);
      const shopItem = getShopItemData(source.item.slot);
      
      if (existingItem) {
        setCartItems((prev) =>
          prev.map((item) =>
            item.name === source.item.name && item.slot === source.item.slot
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        );
      } else {
        setCartItems((prev) => [
          ...prev,
          {
            name: source.item.name,
            quantity: 1,
            price: source.item.price ?? 0,
            slot: source.item.slot,
            currency: source.item.currency ?? 'money',
            rarity: source.item.rarity ?? 'common',
            metadata: shopItem?.metadata // Store the full metadata
          }
        ]);
        
        if (source.item.currency !== 'money') setOnlyCash(true);
        if (source.item.currency === 'black_money') {
          setOnlyBlackMoney(true);
        }
      }
    };

    window.addEventListener('addToShoppingCart', handleAddToCart as EventListener);

    return () => {
      window.removeEventListener('addToShoppingCart', handleAddToCart as EventListener);
    };
  }, [cartItems, sourcee, inventoryType, inventory]);

  const [{ isOver }, drop] = useDrop({
    accept: 'SLOT',
    drop: (source: DragSource) => {
      if (!sourcee) setSourcee(source);
      if (inventoryType === '') setInventoryType(source.inventory);
      
      const existingItem = cartItems.find((item) => item.name === source.item.name && item.slot === source.item.slot);
      const shopItem = getShopItemData(source.item.slot);
      
      if (existingItem) {
        setCartItems((prev) =>
          prev.map((item) =>
            item.name === source.item.name && item.slot === source.item.slot
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        );
      } else {
        setCartItems((prev) => [
          ...prev,
          {
            name: source.item.name,
            quantity: 1,
            price: source.item.price ?? 0,
            slot: source.item.slot,
            currency: source.item.currency ?? '',
            rarity: source.item.rarity ?? 'common',
            metadata: shopItem?.metadata // Store the full metadata
          }
        ]);
        
        if (source.item.currency !== 'money') setOnlyCash(true);
        if (source.item.currency === 'black_money') {
          setOnlyBlackMoney(true);
        }
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const handlePay = (type: string) => {
    if (!sourcee || cartItems.length === 0) return;
    
    // Pass all cart items instead of just the first one
    onBuy(sourcee, { inventory: inventoryType, item: { slot: -1 } }, 0, type, cartItems);
    
    // Clear the cart after payment
    setCartItems([]);
    setOnlyCash(false);
    setOnlyBlackMoney(false);
  };

  // Helper function to get item image URL with metadata support
  const getCartItemImage = (item: any) => {
    // First check metadata for image
    if (item.metadata?.imageurl) {
      return item.metadata.imageurl;
    }
    if (item.metadata?.image) {
      return item.metadata.image.startsWith('http') 
        ? item.metadata.image 
        : getItemUrl(item.metadata.image);
    }
    // Fallback to regular item image
    return getItemUrl(item.name);
  };

  // Helper function to get item label with metadata support
  const getItemLabel = (item: any) => {
    // First check metadata for label
    if (item.metadata?.label) {
      return item.metadata.label;
    }
    // Then check Items table
    const itemData = Items[item.name];
    if (itemData?.label) {
      return itemData.label;
    }
    // Fallback to formatting the item name
    return item.name
      ?.replace(/[_-]/g, ' ')
      .replace(/\b\w/g, (char: string) => char.toUpperCase());
  };

  return (
    <>
      <div className="inventory-grid-wrapper w-full transform py-5 px-6 bg-black/25 rounded-[8px] miring transition-all duration-500 ease-in-out h-auto" style={{ pointerEvents: isBusy ? 'none' : 'auto', transform: 'rotateX(0deg) rotateY(-7deg)' }}>
        <div>
          {/* Header */}
          <div className="inventory-grid-header-wrapper border-b border-[var(--color-primary)] pb-3 mb-4">
            <div className='flex items-center justify-start gap-3'>
              {BsPlusSquare({ className: 'text-2xl text-[var(--color-primary)]' }) as any}
              <p className="text-lg font-bold text-berjarak uppercase tracking-wider">Shopping Cart</p>
            </div>
            {cartItems.length > 0 && (
              <div className='flex items-center gap-2 px-3 py-1 rounded-md bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30'>
                <p className='text-sm font-semibold text-[var(--color-primary)]'>{cartItems.length} {cartItems.length === 1 ? 'ITEM' : 'ITEMS'}</p>
              </div>
            )}
          </div>

          {/* Cart Items Container */}
          <div
            className={`grid grid-cols-1 gap-2 overflow-y-auto no-scrollbar transition-all duration-300 ${
              cartItems.length > 0 ? 'h-[18rem]' : 'h-[15rem]'
            }`}
            ref={drop}
            style={{
              border: isOver ? '2px dashed var(--color-primary)' : '2px dashed transparent',
              borderRadius: '8px',
              padding: isOver ? '6px' : '0',
              transition: 'all 0.2s ease'
            }}
          >
            {cartItems.length > 0 ? (
              cartItems.map((item, index) => (
                <div
                  key={`${item.name}-${item.slot}-${index}`}
                  className='flex items-center justify-between gap-3 w-full box-cart min-h-[4rem] px-3 py-2 rounded-lg hover:bg-black/30 transition-all duration-200 group'
                  style={{ animation: `fadeIn 0.3s ease ${index * 0.05}s both` }}
                >
                  {/* Item Image */}
                  <div className='relative flex items-center justify-center w-12 h-12 rounded-md bg-black/40 border border-white/10 group-hover:border-[var(--color-primary)]/40 transition-all'>
                    <img
                      src={getCartItemImage(item)}
                      alt={item.name}
                      className='w-full h-full object-contain p-1.5'
                      style={{ imageRendering: '-webkit-optimize-contrast' }}
                    />
                  </div>

                  {/* Item Info */}
                  <div className='flex flex-col items-start justify-center flex-1 min-w-0'>
                    <p className={`text-[9px] font-bold uppercase tracking-wide mb-0.5 rarity-${(item.metadata?.rarity || item.rarity || 'common').toLowerCase()}`}>
                      {(item.metadata?.rarity || item.rarity || 'common').toUpperCase()}
                    </p>
                    <p className='text-xs font-semibold truncate max-w-full text-white'>
                      {getItemLabel(item)}
                    </p>
                    <p className="text-[10px] font-medium text-white/50 mt-0.5">
                      {Locale.$ || '$'}{item.price.toLocaleString('en-us')} each
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className='flex flex-row items-center justify-center gap-1.5 bg-black/40 rounded-md px-1.5 py-1 border border-white/10'>
                    <button
                      className='flex items-center justify-center w-6 h-6 rounded bg-white/5 text-white/70 hover:bg-[var(--color-primary)]/20 hover:text-[var(--color-primary)] transition-all duration-200 border border-white/10 hover:border-[var(--color-primary)]/40 disabled:opacity-30 disabled:cursor-not-allowed'
                      disabled={item.quantity <= 1}
                      onClick={() => setCartItems((prev) => prev.map((cartItem) =>
                        cartItem.name === item.name && cartItem.slot === item.slot && cartItem.quantity > 1
                          ? { ...cartItem, quantity: cartItem.quantity - 1 }
                          : cartItem
                      ))}
                    >
                      {FaMinus({ className: 'text-[9px]' }) as any}
                    </button>
                    <input
                      type='number'
                      className='w-11 h-6 rounded bg-transparent text-white text-xs font-bold text-center outline-none border border-white/10 focus:border-[var(--color-primary)]/50 transition-all'
                      value={item.quantity}
                      onChange={(e) => {
                        const value = Math.max(1, Number(e.target.value));
                        setCartItems((prev) => prev.map((cartItem) =>
                          cartItem.name === item.name && cartItem.slot === item.slot
                            ? { ...cartItem, quantity: value }
                            : cartItem
                        ));
                      }}
                    />
                    <button
                      className='flex items-center justify-center w-6 h-6 rounded bg-white/5 text-white/70 hover:bg-[var(--color-primary)]/20 hover:text-[var(--color-primary)] transition-all duration-200 border border-white/10 hover:border-[var(--color-primary)]/40'
                      onClick={() => setCartItems((prev) => prev.map((cartItem) =>
                        cartItem.name === item.name && cartItem.slot === item.slot
                          ? { ...cartItem, quantity: cartItem.quantity + 1 }
                          : cartItem
                      ))}
                    >
                      {FaPlus({ className: 'text-[9px]' }) as any}
                    </button>
                  </div>

                  {/* Item Total Price */}
                  <div className='flex flex-col items-end justify-center min-w-[70px]'>
                    <p className="text-[9px] font-medium text-white/50 uppercase mb-0.5">Total</p>
                    <p className="text-sm font-bold text-[var(--color-primary)]">
                      {Locale.$ || '$'}{(item.price * item.quantity).toLocaleString('en-us')}
                    </p>
                  </div>

                  {/* Delete Button */}
                  <button
                    className='flex items-center justify-center w-7 h-7 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all duration-200 border border-red-500/20 hover:border-red-500/40'
                    onClick={() => setCartItems((prev) => prev.filter((cartItem) =>
                      !(cartItem.name === item.name && cartItem.slot === item.slot)
                    ))}
                  >
                    {FaRegTrashCan({ className: 'text-xs' }) as any}
                  </button>
                </div>
              ))
            ) : (
              <div className='flex flex-col items-center justify-center w-full h-full'>
                <div className='flex flex-col items-center gap-2 opacity-40'>
                  {BsPlusSquare({ className: "text-5xl" }) as any}
                  <div className='text-center'>
                    <p className="text-sm font-bold uppercase tracking-wide mb-1">Your Cart is Empty</p>
                    <p className="text-xs uppercase tracking-wide">Drag items here to add</p>
                    <p className="text-[10px] mt-1 opacity-70">Or double-click / shift + click items</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer - Total and Payment */}
          {cartItems.length > 0 && (
            <div className='flex flex-col w-full mt-3 pt-3 border-t border-[var(--color-primary)]/30 transition-all duration-200'>
              <div className='flex items-center justify-between w-full mb-3 px-1'>
                <p className='text-sm font-bold uppercase tracking-wide text-white/90'>Grand Total</p>
                <p className='text-xl font-bold text-[var(--color-primary)]'>
                  {Locale.$ || '$'}
                  {cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0).toLocaleString('en-us')}
                </p>
              </div>

              <div className='flex items-center justify-end w-full gap-2'>
                {!onlyCash && (
                  <button
                    className='flex flex-row gap-1.5 items-center justify-center px-4 h-9 rounded-md bg-gradient-to-r from-[var(--color-primary)]/10 to-[var(--color-primary)]/5 text-white text-xs font-bold border border-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/20 hover:border-[var(--color-primary)] hover:shadow-lg hover:shadow-[var(--color-primary)]/20 transition-all duration-200 uppercase tracking-wide'
                    onClick={() => handlePay('bank')}
                  >
                    {RiBankCard2Line({ className: 'text-base' }) as any}
                    <span>Bank</span>
                  </button>
                )}
                {onlyBlackMoney && (
                  <button
                    className='flex flex-row gap-1.5 items-center justify-center px-4 h-9 rounded-md bg-gradient-to-r from-red-500/10 to-red-500/5 text-white text-xs font-bold border border-red-500/40 hover:bg-red-500/20 hover:border-red-500 hover:shadow-lg hover:shadow-red-500/20 transition-all duration-200 uppercase tracking-wide'
                    onClick={() => handlePay('black_money')}
                  >
                    {LuCoins({ className: 'text-base' }) as any}
                    <span>Dirty</span>
                  </button>
                )}
                {!onlyBlackMoney && (
                  <button
                    className='flex flex-row gap-1.5 items-center justify-center px-4 h-9 rounded-md bg-gradient-to-r from-[var(--color-primary)]/10 to-[var(--color-primary)]/5 text-white text-xs font-bold border border-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/20 hover:border-[var(--color-primary)] hover:shadow-lg hover:shadow-[var(--color-primary)]/20 transition-all duration-200 uppercase tracking-wide'
                    onClick={() => handlePay('cash')}
                  >
                    {LuCoins({ className: 'text-base' }) as any}
                    <span>Cash</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ShopCart;