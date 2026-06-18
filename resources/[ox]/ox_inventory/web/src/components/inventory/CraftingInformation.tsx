import React, { useCallback, useRef, useState, useMemo, useEffect } from 'react';
import { DragSource, Inventory, InventoryType, Slot, SlotWithItem } from '../../typings';
import { useAppDispatch, useAppSelector } from '../../store';
import { getItemUrl } from '../../helpers';
import { Items } from '../../store/items';
import { onCraft } from '../../dnd/onCraft';
import { FaRegPlusSquare } from "react-icons/fa";



interface SlotProps {
  inventoryId: Inventory['id'];
  inventoryType: Inventory['type'];
  inventoryGroups: Inventory['groups'];
  item: Slot;
}

const CraftingInfo: React.FC = () => {
    const GlobalData = useAppSelector((state:any) => state.craftItems.data);
    const MaxCraft = GlobalData.maxCraft as number;
    const craftItems = GlobalData.item as SlotWithItem;
    const source = GlobalData.source as DragSource;
    
    // Initialize to 1 or MaxCraft (whichever is smaller)
    const [count, setCount] = useState(Math.min(1, MaxCraft || 1));
    
    const handleClick = () => {
        if (MaxCraft === 0) return;
        if (count <= MaxCraft) {
            onCraft(source, { inventory: 'player', item: { slot: -1 }}, count);
        }
    };
    
    useEffect(() => {
        // When MaxCraft changes, set count to 1 or MaxCraft (whichever is smaller)
        setCount(Math.min(1, MaxCraft || 1));
    }, [MaxCraft]);
    return (
        <div className='flex flex-col items-start justify-start w-full h-auto min-h-[17.5rem] gap-3 border-t border-white/20 pt-5'>
            {craftItems && craftItems.name ? (
                <>
                    <div className='flex flex-col items-start justify-start gap-1'>
                        <p className='text-white text-2xl font-semibold' style={{lineHeight: '1vh'}}>{craftItems.metadata?.label ? craftItems.metadata.label : Items[craftItems.name]?.label || craftItems.name}</p>
                    </div>
                    <div className='flex flex-row items-center justify-start gap-3'>
                    <h1 className='text-white/40 text-md uppercase font-semibold'>Crafting time:</h1>
                    <div className='px-3 py-[0.5rem] rounded-md border border-[color:var(--color-primary)] border-opacity-80 bg-[color:var(--color-primaryRgb)] bg-opacity-25'>
                        <p className='text-white text-sm font-thin'>{(craftItems.duration || 5000) / 1000}s</p>
                    </div>
                    </div>

                    <div className='flex flex-col items-start justify-start gap-1'>
                        <p className='text-white/40 text-sm font-thin uppercase mb-[0.25rem]'>Items required</p>
                        <div className='grid gap-2 overflow-y-auto no-scrollbar py-1'style={{
                                height: 'fit-content',
                                maxHeight: 'calc(2 * 5rem + 1 * 10px)',
                                gridTemplateColumns: 'repeat(5, 8.2vh)',
                                gridAutoRows: '7.2vh',
                            }}>
                            {craftItems.ingredients && Object.entries(craftItems.ingredients).map(([key, value]) => {
                                return (
                                    <div key={key} className='flex flex-col items-center justify-between gap-2 bg-black/50 border border-white/20 rounded-sm min-h-[5rem] max-h-[5rem] ingredient'
                                        style={{ backgroundImage: `url(${getItemUrl(key)})`,backgroundPosition: 'center 62.5%', // moves the image down slightly
                                        backgroundRepeat: 'no-repeat'}}
                                        >
                                        <p className='text-white/50 text-xs w-full text-left px-1'>{Items[key]?.label || key}</p>
                                        <p className='text-white text-md w-full text-right px-2 pb-0'>{value}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                <span className='quantText text-white/40'>Quantity</span>
                <div className='w-100 h-[5rem] flex flex-row justify-end items-center gap-0'>
                <div className='flex flex-row items-center mt-[1rem]'>
                    <button className='w-8 h-12 flex items-center justify-center bg-black/60 roundandbordernoright'
                    onClick={() => setCount(Math.max(count - 1, 1))}>
                    <p className='text-white text-lg font-bold'>-</p>
                    </button>
                    <input type='number'
                    className='w-12 h-12 bg-black/50 text-white text-center font-semibold outline-none noroundbordertopandbottom'
                    value={count}
                    onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setCount(Math.min(MaxCraft, Math.max(1, isNaN(val) ? 1 : val)));
                    }} />
                    <button className='w-8 h-12 flex items-center justify-center bg-black/60 roundandbordernoleft'
                    onClick={() => setCount(Math.min(count + 1, MaxCraft))}>
                    <p className='text-white text-lg font-bold'>+</p>
                    </button>
                </div>
                <button className='mt-[1rem] h-[4rem] px-[5.5rem] bg-black/60 border border-white/30 rounded-md ml-[7.5rem] addToQueue' onClick={handleClick}>
                    <p className='text-white text-sm font-semibold uppercase'>Craft Item</p>
                </button>
                </div>

                </>
            ) : (
                <p className='text-white text-xl font-semibold selectItemFirst'>{FaRegPlusSquare({ style: {fontSize: '2rem', marginLeft: "5.4rem"} }) as any}<br></br>Select an item to craft <br></br> <div className="divider absolute left-[1.5rem]" style={{width:"31.9rem", top:"38rem"}}></div></p>
            )}
        </div>
    );
};


export default CraftingInfo;