const builder = require('electron-builder')
const Platform = builder.Platform

const config = {
    "directories": {
        "output": "packaged/"
    },
    "mac": {
        "asarUnpack": [
            "./src/icons/**",
            "./node_modules/mozjpeg/**",
            "./node_modules/bin-build/**",
            "./node_modules/bin-check/**",
            "./node_modules/bin-wrapper/**",
            "./node_modules/execa/**",
            "./node_modules/pngquant-bin/**"
        ],
        "target": {
            "arch": ['arm64'],
            "target": 'dir'
        },
        "icon": "src/icons/icon.icns",
        "darkModeSupport": true,
        "files": [
            "**/*"
        ]
    },
    "publish": null
}

builder.build({
    targets: Platform.MAC.createTarget(),
    config,
})
    .then(m => {
        console.log("Done!")
    })
    .catch(e => {
        console.error(e)
    })