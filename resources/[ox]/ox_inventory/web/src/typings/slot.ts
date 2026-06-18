export type Slot = {
  slot: number;
  name?: string;
  count?: number;
  weight?: number;
  metadata?: {
    [key: string]: any;
  };
  durability?: number;
  price?: number;
  rarity?: string;
};

export type SlotWithItem = Slot & {
  name: string;
  count: number;
  weight: number;
  durability?: number;
  price?: number;
  rarity?: string;
  type?: string;
  currency?: string;
  ingredients?: { [key: string]: number };
  duration?: number;
  image?: string;
  grade?: number | number[];
};
