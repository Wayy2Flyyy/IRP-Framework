import React, { useState, useEffect } from 'react';
import InventoryComponent from './components/inventory';
import useNuiEvent from './hooks/useNuiEvent';
import { Items } from './store/items';
import { Locale } from './store/locale';
import { setImagePath } from './store/imagepath';
import { setupInventory } from './store/inventory';
import { Inventory } from './typings';
import { useAppDispatch } from './store';
import { debugData } from './utils/debugData';
import DragPreview from './components/utils/DragPreview';
import { fetchNui } from './utils/fetchNui';
import { useDragDropManager } from 'react-dnd';
import { updatePlayerList } from './store/playerlist';
import { updateSettings } from './store/settings';
import KeyPress from './components/utils/KeyPress';

// Theme interface
interface ThemeColors {
  primary: string;
  primaryRgb: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  common: string;
  uncommon: string;
  rare: string;
  epic: string;
  mythic: string;
}

interface Theme {
  name: string;
  displayName: string;
  colors: ThemeColors;
}

// Function to apply theme to CSS custom properties
const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  
  // Apply all theme colors as CSS custom properties
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });
  
  // Also set some specific properties for compatibility
  root.style.setProperty('--primary-color', theme.colors.primary);
  root.style.setProperty('--primary-rgb', theme.colors.primaryRgb);
  root.style.setProperty('--secondary-color', theme.colors.secondary);
  root.style.setProperty('--background-color', theme.colors.background);
  root.style.setProperty('--surface-color', theme.colors.surface);
  root.style.setProperty('--text-color', theme.colors.text);
  root.style.setProperty('--text-secondary-color', theme.colors.textSecondary);
  root.style.setProperty('--border-color', theme.colors.border);
  
  // Rarity colors
  root.style.setProperty('--rarity-common', theme.colors.common);
  root.style.setProperty('--rarity-uncommon', theme.colors.uncommon);
  root.style.setProperty('--rarity-rare', theme.colors.rare);
  root.style.setProperty('--rarity-epic', theme.colors.epic);
  root.style.setProperty('--rarity-mythic', theme.colors.mythic);
  
  //console.log(`Applied theme: ${theme.displayName}`);
};

// Set default theme colors as fallback
const setDefaultTheme = () => {
  const defaultTheme: Theme = {
    name: 'default',
    displayName: 'Default Green',
    colors: {
      primary: '#87da21',
      primaryRgb: '135, 218, 33',
      secondary: '#2b2b2b',
      background: '#000000',
      surface: '#1a1a1a',
      text: '#ffffff',
      textSecondary: '#c1c2c5',
      border: '#ffffff40',
      success: '#4ade80',
      warning: '#fbbf24',
      error: '#ef4444',
      common: '#ffffff40',
      uncommon: '#23db0b',
      rare: '#0796c2',
      epic: '#9c32e4',
      mythic: '#e1e432'
    }
  };
  
  applyTheme(defaultTheme);
};

debugData([
  {
    action: 'setupInventory',   
    data: {
      leftInventory: {
        id: 'test', 
        type: 'player',
        slots: 50,
        label: 'Bob Smith',
        weight: 3000,
        maxWeight: 5000,
        items: [
          { 
            slot: 1,
            name: 'iron',
            weight: 3000,
            rarity: 'rare',
            metadata: {
              description: `name: Svetozar Miletic  \n Gender: Male`,
              ammo: 3,
              mustard: '60%',
              ketchup: '30%',
              mayo: '10%',
            },
            count: 5,
          },
          { slot: 2, name: 'powersaw', weight: 0, count: 1, metadata: { durability: 75 } },
          { slot: 3, name: 'copper', weight: 100, count: 12, metadata: { type: 'Special' } },
          {
            slot: 10,
            name: 'water',
            type: 'weapon',
            weight: 100,
            rarity: 'uncommon',
            count: 10,
            metadata: { description: 'Generic item description' },
          },
          { slot: 5, name: 'water', weight: 100, count: 1, rarity: 'epic' },
          {
            slot: 6,
            name: 'backwoods',
            weight: 100,
            count: 1,
            metadata: {
              label: 'Russian Cream',
              imageurl: 'https://i.imgur.com/2xHhTTz.png',
            },
          },
        ],
      },
      rightInventory: {
        id: 'stash',
        type: 'crafting',
        slots: 10,
        label: 'Bob Smith',
        weight: 3000,
        maxWeight: 5000,
        items: [
          {
            slot: 1,
            name: 'water',
            weight: 500,
            price: 300,
            ingredients: {
              water: 1,
            },
            duration: 3000,
            currency: 'black_money',
            metadata: {
              description: 'Simple lockpick that breaks easily and can pick basic door locks',
              rarity: 'common',
            },
          },
        ],
      },
      leftInventoryBottom: {
        id: 'backpack',
        type: 'backpack',
        slots: 50,
        label: 'Backpack',
        weight: 3000,
        maxWeight: 5000,
        open: true,
        items: [
          {
            slot: 1,
            name: 'iron',
            weight: 1,
            metadata: {
              label: 'Iron',
              description: `name: Svetozar Miletic  \n Gender: Male`,
              ammo: 3,
              mustard: '60%',
              ketchup: '30%',
              mayo: '10%',
            },
            count: 1,
          },
          { slot: 12, name: 'powersaw', weight: 3000, count: 1, metadata: { durability: 75, label:'powershow'} },
          { slot: 13, name: 'copper', weight: 100, count: 12, metadata: { type: 'Special',label:'copper' } },
          {
            slot: 14,
            name: 'water',
            weight: 100,
            count: 1,
            metadata: { description: 'Generic item description asd asdsaj kdghaskdgashgdasdhasgdkashgdashjdgashdgasgdaskdh asdasdasdasdsa', label: 'Water'},
          },
          { slot: 15, name: 'water', weight: 100, count: 1 },
          {
            slot: 16,
            name: 'backwoods',
            weight: 100,
            count: 1,
            metadata: {
              label: 'Russian Cream',
              imageurl: 'https://i.imgur.com/2xHhTTz.png',
            },
          },
        ],
      },
    },
  },
]);

debugData([
  {
    action: 'UpdatePlayerList',
    data: {
      playerlist: [255, 256, 257, 258],
      slot: {
        slot: 1,
        name: 'backwoods',
        weight: 100,
        count: 1,
        metadata: {
          label: 'Russian Cream',
          imageurl: 'https://i.imgur.com/2xHhTTz.png',
        },
      },
      count: 1,
    }
  }
]);

debugData([
  {
    action: 'setupInventorySettings',
    data: {
      gender: 'male',
      SpecialSlot: [
        ['water'],
        ['water'],
        ['water'],
        ['water'],
      ],
      blacklistedItems: ['backwoods'],
      theme: {
        name: 'default',
        displayName: 'Default Green',
        colors: {
          primary: '#87da21',
          primaryRgb: '135, 218, 33',
          secondary: '#2b2b2b',
          background: '#000000',
          surface: '#1a1a1a',
          text: '#ffffff',
          textSecondary: '#c1c2c5',
          border: '#ffffff40',
          success: '#4ade80',
          warning: '#fbbf24',
          error: '#ef4444',
          common: '#ffffff40',
          uncommon: '#23db0b',
          rare: '#0796c2',
          epic: '#9c32e4',
          mythic: '#e1e432'
        }
      }
    },
  },
]);

const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const manager = useDragDropManager();
  const [inventoryVisible, setInventoryVisible] = useState(false);

  // Set default theme on component mount
  useEffect(() => {
    setDefaultTheme();
  }, []);

  useNuiEvent<{
    locale: { [key: string]: string };
    items: typeof Items;
    leftInventory: Inventory;
    imagepath: string;
  }>('init', ({ locale, items, leftInventory, imagepath }) => {
    for (const name in locale) Locale[name] = locale[name];
    for (const name in items) Items[name] = items[name];

    setImagePath(imagepath);
    dispatch(setupInventory({ leftInventory }));
  });

  // Handle theme changes
  useNuiEvent<Theme>('setTheme', (theme) => {
    applyTheme(theme);
  });

  useNuiEvent('UpdatePlayerList', (data: any) => {
    dispatch(updatePlayerList(data))
  })

  useNuiEvent('setupInventorySettings', (data: any) => {
    dispatch(updateSettings(data))
    
    // Apply theme if provided
    if (data.theme) {
      applyTheme(data.theme);
    }
  })

  
  useNuiEvent<{
    leftInventory?: Inventory;
    rightInventory?: Inventory;
    leftInventoryBottom?: Inventory;
  }>('setupInventory', (data) => {
    dispatch(setupInventory(data));
    !inventoryVisible && setInventoryVisible(true);
  });

  fetchNui('uiLoaded', {});

  useNuiEvent('closeInventory', () => {
    setInventoryVisible(false);
    manager.dispatch({ type: 'dnd-core/END_DRAG' });
  });

  return (
    <div className="app-wrapper">
      <InventoryComponent />
      <DragPreview />
      <KeyPress />
    </div>
  );
};

addEventListener("dragstart", function(event) {
  event.preventDefault()
})

export default App;