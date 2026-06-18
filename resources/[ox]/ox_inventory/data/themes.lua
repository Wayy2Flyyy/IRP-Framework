---UI Theme System Configuration
---@class ThemeConfig
return {
    -- Current theme to use (change this to switch themes)
    current = "blue", -- Options: "default", "dark", "blue", "purple", "red", "green", "custom"

    -- Define available themes
    themes = {
        ["default"] = {
            name = "Default Green",
            colors = {
                primary = "#87da21",           -- Main accent color
                primaryRgb = "135, 218, 33, 0.5",   -- RGB version for rgba usage
                secondary = "#2b2b2b",         -- Secondary backgrounds
                background = "#000000",        -- Main background
                surface = "#1a1a1a",          -- Card/surface backgrounds
                text = "#ffffff",             -- Primary text
                textSecondary = "#c1c2c5",    -- Secondary text
                border = "#ffffff40",         -- Border colors
                success = "#4ade80",          -- Success color
                warning = "#fbbf24",          -- Warning color
                error = "#ef4444",            -- Error color
                common = "#ffffff40",         -- Common rarity
                uncommon = "#23db0b",         -- Uncommon rarity
                rare = "#0796c2",             -- Rare rarity
                epic = "#9c32e4",             -- Epic rarity
                mythic = "#e1e432"            -- Mythic rarity
            }
        },

        ["dark"] = {
            name = "Dark Mode",
            colors = {
                primary = "#6366f1",
                primaryRgb = "99, 102, 241",
                secondary = "#1f1f23",
                background = "#09090b",
                surface = "#161618",
                text = "#fafafa",
                textSecondary = "#a1a1aa",
                border = "#27272a",
                success = "#22c55e",
                warning = "#eab308",
                error = "#dc2626",
                common = "#71717a",
                uncommon = "#22c55e",
                rare = "#3b82f6",
                epic = "#a855f7",
                mythic = "#eab308"
            }
        },

        ["blue"] = {
            name = "Ocean Blue",
            colors = {
                primary = "#0ea5e9",
                primaryRgb = "14, 165, 233",
                secondary = "#313b4c",
                background = "#020617",
                surface = "#0f172a",
                text = "#f8fafc",
                textSecondary = "#cbd5e1",
                border = "#334155",
                success = "#10b981",
                warning = "#f59e0b",
                error = "#ef4444",
                common = "#64748b",
                uncommon = "#10b981",
                rare = "#3b82f6",
                epic = "#8b5cf6",
                mythic = "#f59e0b"
            }
        },

        ["purple"] = {
            name = "Royal Purple",
            colors = {
                primary = "#a855f7",
                primaryRgb = "168, 85, 247",
                secondary = "#2e1065",
                background = "#1e1b4b",
                surface = "#312e81",
                text = "#f3f4f6",
                textSecondary = "#d1d5db",
                border = "#4c1d95",
                success = "#059669",
                warning = "#d97706",
                error = "#dc2626",
                common = "#6b7280",
                uncommon = "#059669",
                rare = "#3b82f6",
                epic = "#a855f7",
                mythic = "#d97706"
            }
        },

        ["red"] = {
            name = "Crimson Red",
            colors = {
                primary = "#dc2626",
                primaryRgb = "220, 38, 38",
                secondary = "#7f1d1d",
                background = "#450a0a",
                surface = "#991b1b",
                text = "#fef2f2",
                textSecondary = "#fecaca",
                border = "#b91c1c",
                success = "#16a34a",
                warning = "#ea580c",
                error = "#dc2626",
                common = "#6b7280",
                uncommon = "#16a34a",
                rare = "#2563eb",
                epic = "#9333ea",
                mythic = "#ea580c"
            }
        },

        ["green"] = {
            name = "Forest Green",
            colors = {
                primary = "#16a34a",
                primaryRgb = "22, 163, 74",
                secondary = "#14532d",
                background = "#052e16",
                surface = "#166534",
                text = "#f0fdf4",
                textSecondary = "#bbf7d0",
                border = "#22c55e",
                success = "#16a34a",
                warning = "#ea580c",
                error = "#dc2626",
                common = "#6b7280",
                uncommon = "#16a34a",
                rare = "#0ea5e9",
                epic = "#a855f7",
                mythic = "#ea580c"
            }
        },

        ["custom"] = {
            name = "Custom Theme",
            colors = {
                -- You can customize these colors to your liking
                primary = "#ff6b35",           -- Orange accent
                primaryRgb = "255, 107, 53",
                secondary = "#2d3748",
                background = "#1a202c",
                surface = "#2d3748",
                text = "#f7fafc",
                textSecondary = "#e2e8f0",
                border = "#4a5568",
                success = "#48bb78",
                warning = "#ed8936",
                error = "#f56565",
                common = "#718096",
                uncommon = "#48bb78",
                rare = "#4299e1",
                epic = "#9f7aea",
                mythic = "#ed8936"
            }
        }
    }
}
