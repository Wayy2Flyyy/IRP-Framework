fx_version 'cerulean'
use_experimental_fxv2_oal 'yes'
lua54 'yes'
game 'gta5'

name 'ox_inventory'
author 'Overextended'
version '2.44.1'
description 'Slot-based inventory with item metadata support'
repository 'https://github.com/overextended/ox_inventory'

dependencies {
    '/server:6116',
    '/onesync',
    'oxmysql',
    'ox_lib',
}

shared_scripts {
    '@ox_lib/init.lua',
    'configs/constants.lua',
    'configs/backpack.lua',
    'configs/armor.lua',
    'config.lua'
}

ox_libs {
    'locale',
    'math',
    'table',
}

server_scripts {
    '@oxmysql/lib/MySQL.lua',
    'init.lua',
    'sv_escrow.lua',
}

client_scripts {
    'init.lua',
    '@qbx_core/modules/playerdata.lua',
    'cl_escrow.lua',
}

ui_page 'web/build/index.html'

files {
    'cl_escrow',
    'sv_escrow',
    'client.lua',
    'server.lua',
    'init.lua',
    'config.lua',
    'configs/*.lua',
    'data/*.lua',
    'locales/*.json',
    'modules/**/**',
    'setup/*.lua',
    'changelog/*.md',
    'web/build/index.html',
    'web/build/assets/*.js',
    'web/build/assets/*.css',
    'web/build/assets/*.png',
    'web/images/*.png'
}


-- Escrow Ignore (Alphabetized)
escrow_ignore {
    'cl_escrow',
    'sv_escrow',
    'client.lua',
    'server.lua',
    'init.lua',
    'config.lua',
    'configs/*.lua',
    'data/*.lua',
    'locales/*.json',
    'modules/**/**',
    'setup/*.lua',
    'changelog/*.md',
    'web/build/index.html',
    'web/build/assets/*.js',
    'web/build/assets/*.css',
    'web/build/assets/*.png',
    'web/images/*.png',
}

dependency '/assetpacks'