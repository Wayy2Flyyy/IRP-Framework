# 📦 Adding Rarity and Armor Items

This guide explains how to add rarity tiers and create armor items for your inventory system.

---

## 🏷️ Rarity System

Items can have an optional `rarity` field to visually differentiate their tier or value in-game.

### 🔹 Available Rarity Types

- `common`
- `uncommon`
- `rare`
- `epic`
- `mythic`

### ✅ Example: Creating an Item with Rarity

```lua
['armour'] = {
    label = 'Bulletproof Vest',
    weight = 3000,
    stack = false,
    rarity = 'epic', -- Rarity tier
    value = 100,
    client = {
        anim = { dict = 'clothingshirt', clip = 'try_shirt_positive_d' },
        usetime = 3500
    }
}
```

## 🛡️ Armor Items

Armor plates are now used, Spawn in "armor_plate" and "armour" put "armour" in your armor slot and then right click and add or remove plates to your liking as long as in inventory


## Define Custom Shop For Blackmarket Or Use Black Money.

Define item first:

```lua
['black_money'] = {
    label = 'Dirty Money',
    weight = 0,
    stack = true,
    rarity = 'rare',
}
```

Then define shop in custom script using currency argument:

```lua
exports.ox_inventory:RegisterShop('TestShop', {
    name = 'Test shop',
    inventory = {
        { name = 'burger', price = 10, currency = "black_money" },
        { name = 'water', price = 10,  currency = "black_money" },
        { name = 'cola', price = 10,  currency = "black_money" },
    },
    locations = {
        vec3(223.832962, -792.619751, 30.695190),
    },
    groups = {
        police = 0
    },
})
```

This make shop display "Pay dirty money" instead of pay bank and pay cash.