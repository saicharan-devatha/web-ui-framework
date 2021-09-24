module.exports = {
    proxies: {
        prod: {
            proxyUrl: ''
        }
    },
    sauce: {
        user: '',
        key: ''
    },
    seleniumAddress: 'http://localhost:4444/wd/hub',
    maxParalleltests: 10,
    ilist: {
        recipients: ['']
    },
    secretKey: "",
    screenresolution: {
        mac: {
            width: 2360,
            height: 1770
        },
        windows: {
            width: 1920,
            height: 1200
        },
        default: {
            width: 1024,
            height: 768
        }
    }
};