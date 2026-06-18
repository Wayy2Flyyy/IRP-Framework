import { Inventory, SlotWithItem } from '../../typings';
import React, { Fragment, useMemo } from 'react';
import { Items } from '../../store/items';
import { Locale } from '../../store/locale';
import ReactMarkdown from 'react-markdown';
import { useAppSelector } from '../../store';
import ClockIcon from '../utils/icons/ClockIcon';
import { getItemUrl } from '../../helpers';
import Divider from '../utils/Divider';

const SlotTooltip: React.ForwardRefRenderFunction<
  HTMLDivElement,
  { item: SlotWithItem; inventoryType: Inventory['type']; style: React.CSSProperties }
> = ({ item, inventoryType, style }, ref) => {
  const additionalMetadata = useAppSelector((state) => state.inventory.additionalMetadata);
  const itemData = useMemo(() => Items[item.name], [item]);
  const ingredients = useMemo(() => {
    if (!item.ingredients) return null;
    return Object.entries(item.ingredients).sort((a, b) => a[1] - b[1]);
  }, [item]);
  const description = item.metadata?.description || itemData?.description;
  const plates = item.metadata?.plates;
  const maxPlates = item.metadata?.maxPlates;
  const armorType = item.metadata?.armorType;
  const damageReduction = item.metadata?.damageReduction;
  const ammoName = itemData?.ammoName && Items[itemData?.ammoName]?.label;

  return (
    <>
      {!itemData ? (
        <div className="tooltip-wrapper max-w-[200px]" ref={ref} style={style}>
          <div className='box-tooltip px-5 py-1'>
            <div className="tooltip-header-wrapper uppercase font-semibold">
              <p>{item.name}</p>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ ...style }} className="tooltip-wrapper max-w-[200px] gap-2" ref={ref}>
          <div className='box-tooltip px-5 py-1'>
            <div className="tooltip-header-wrapper uppercase font-semibold">
              <p>{item.metadata?.label || itemData.label || item.name}</p>
              {inventoryType === 'crafting' ? (
                <div className="tooltip-crafting-duration">
                  <ClockIcon />
                  <p>{(item.duration !== undefined ? item.duration : 3000) / 1000}s</p>
                </div>
              ) : (
                <p>{item.metadata?.type}</p>
              )}
            </div>
          </div>
          {description && (
            <div className='box-tooltip px-5 py-1'>
              <div className="tooltip-description max-w-full break-words">
                <ReactMarkdown className="tooltip-markdown">{description}</ReactMarkdown>
              </div>
            </div>
          )}
          {plates !== undefined && (
            <div className='box-tooltip px-5 py-1'>
              <p>
                <span className='uppercase'>Armor Type:</span> <br />
                {armorType === 'light_armor' ? 'Light Armor' :
                armorType === 'heavy_armor' ? 'Heavy Armor' :
                armorType === 'pd_armor' ? 'Police Armor' : 'Standard Armor'}
              </p>
              <p>
                <span className='uppercase'>Armor Plates:</span> <br />
                {Math.trunc(plates)}/{maxPlates || 3}
              </p>
              {damageReduction && (
                <p>
                  <span className='uppercase'>Protection:</span> <br />
                  {Math.round((1 - damageReduction) * 100)}% damage reduction
                </p>
              )}
            </div>
          )}
          {inventoryType !== 'crafting' ? (
            <>
              {item.durability !== undefined && (
                  <div className='box-tooltip px-5 py-1'>
                    <p>
                      <span className='uppercase'>{Locale.ui_durability}:</span> <br></br> {Math.trunc(item.durability)}
                    </p>
                  </div>
                )}
                {item.metadata?.ammo !== undefined && (
                  <div className='box-tooltip px-5 py-1'>
                    <p>
                      <span className='uppercase'>{Locale.ui_ammo}:</span> <br></br> {item.metadata.ammo}
                    </p>
                  </div>
                )}
                {ammoName && (
                  <div className='box-tooltip px-5 py-1'>
                    <p>
                      <span className='uppercase'>{Locale.ammo_type}:</span> <br></br> {ammoName}
                    </p>
                  </div>
                )}
                {item.metadata?.serial && (
                  <div className='box-tooltip px-5 py-1'>
                    <p>
                      <span className='uppercase'>{Locale.ui_serial}:</span> <br></br> {item.metadata.serial}
                    </p>
                  </div>
                )}
                {item.metadata?.components && item.metadata?.components[0] && (
                  <div className='box-tooltip px-5 py-1'>
                    <p>
                      <span className='uppercase'>{Locale.ui_components}:</span> <br></br> {' '}
                      {(item.metadata?.components).map((component: string, index: number, array: []) =>
                        index + 1 === array.length ? Items[component]?.label : Items[component]?.label + ', '
                      )}
                    </p>
                  </div>
                )}
                {item.metadata?.weapontint && (
                  <div className='box-tooltip px-5 py-1'>
                    <p>
                      <span className='uppercase'>{Locale.ui_tint}:</span> <br></br> {item.metadata.weapontint}
                    </p>
                  </div>
                )}
                {additionalMetadata.map((data: { metadata: string; value: string }, index: number) => (
                  <Fragment key={`metadata-${index}`}>
                    {item.metadata && item.metadata[data.metadata] && (
                      <div className='box-tooltip px-5 py-1'>
                        <p>
                          <span className='uppercase'>{data.value}:</span> <br></br> {item.metadata[data.metadata]}
                        </p>
                      </div>
                    )}
                  </Fragment>
                ))}
            </>
          ) : (
            <div className='box-tooltip px-5 py-1'>
              <div className="tooltip-ingredients">
                {ingredients &&
                  ingredients.map((ingredient) => {
                    const [item, count] = [ingredient[0], ingredient[1]];
                    return (
                      <div className="tooltip-ingredient" key={`ingredient-${item}`}>
                        <img src={item ? getItemUrl(item) : 'none'} alt="item-image" />
                        <p>
                          {count >= 1
                            ? `${count}x ${Items[item]?.label || item}`
                            : count === 0
                            ? `${Items[item]?.label || item}`
                            : count < 1 && `${count * 100}% ${Items[item]?.label || item}`}
                        </p>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default React.forwardRef(SlotTooltip);
