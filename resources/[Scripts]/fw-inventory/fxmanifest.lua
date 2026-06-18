fx_version 'cerulean'
game 'gta5'

lua54 'yes'

-- ox_inventory now owns the UI. The old fw-inventory NUI is disabled by
-- removing ui_page/files and the client/* scripts. Keep the config files so
-- Shared.Items / Shared.CustomTypes / Config still load, and keep the server
-- shim (server/zz_ox_compat.lua) so exports['fw-inventory']:* routes to ox.

-- ui_page 'html/index.html'        -- DISABLED (ox provides the UI)
-- files { 'html/**/*' }            -- DISABLED

shared_script '@fw-assets/server/sv_errorlog.lua'  -- harmless if you prefer; optional

client_scripts {
    '@fw-assets/client/cl_errorlog.lua',
    'config/_sh_*',
    'config/sh_*',
    -- 'client/*',                   -- DISABLED (old NUI / keybind)
}

server_scripts {
    '@fw-assets/server/sv_errorlog.lua',
    'config/*',
    'server/*',
    'server/zz_ox_compat.lua',       -- loads LAST, overrides storage exports -> ox
}