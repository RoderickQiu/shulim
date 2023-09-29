const builder = require('electron-builder')
const Platform = builder.Platform

const config = {
    "directories": {
        "output": "packaged/"
    },
    "win": {
        "asarUnpack": [
            "./src/icons/**",
            "./node_modules/mozjpeg/**",
            "./node_modules/bin-build/**",
            "./node_modules/bin-check/**",
            "./node_modules/bin-wrapper/**",
            "./node_modules/execa/**",
            "./node_modules/pngquant-bin/**"
        ],
        "target": [
            {
                "target": "zip",
                "arch": ["x64"]
            }
        ],
        "icon": "src/icons/icon.ico",
        "files": [
            "**/*"
        ]
    },
    "publish": null
}

builder.build({
    targets: Platform.WINDOWS.createTarget(),
    config,
})
    .then(m => {
        console.log("Done!")
    })
    .catch(e => {
        console.error(e)
    })