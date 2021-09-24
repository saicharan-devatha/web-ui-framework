'use strict';

let commonUtils = require('./commonUtils.js');
let commons = require('../config/commons.js');

let builder = {
    builder_run: function (type, run, product, parallel, instances, env, exeEnv, tunnel, shard_index) {
        let config_reader = undefined;
        if (run === "retry") {
            config_reader = require('../config/groups_retry_shard.js');
        } else {
            config_reader = require('../config/groups_shard.js');
        }
        let tests = config_reader[shard_index].tests;
        let devices = config_reader[shard_index].devices;
        parallel === "yes" ? parallel = true : parallel = false;
        let pac = commons.proxies[env].proxyUrl;
        return this.device_builder(tests, devices, run, parallel, instances, product, env, exeEnv, pac, tunnel);
    },

    device_builder: function (tests, devices, run, parallel, instances, product, env, exeEnv, pac, tunnel) {
        let multidevices = [];
        for (let i in devices) {
            let obj = devices[i];
            let browser = obj.split("-")[0];
            let version = obj.split("-")[1];
            let os = obj.split("-")[2];
            let deviceArray = this.device_switcher(browser, version, os, tests, parallel, instances, run, product, env, exeEnv, pac, tunnel);
            for (let x in deviceArray) {
                multidevices.push(deviceArray[x]);
            }
        }
        return JSON.stringify(multidevices);
    },

    retry_device_builder: function (retries, product) {
        let deviceretryArray = [];
        let retry_devices = [];
        let browsertestname, devicetype;
        let newtestArr = [];
        let newspecArr = [];

        for (let i in retries) {
            let obj = retries[i];
            console.log(obj);

            if (obj.version === product) {
                retry_devices.push(obj.browser);
            }
        }

        let dev_unique = retry_devices.filter(commonUtils.onlyUnique);

        for (let dev in dev_unique) {
            browsertestname = dev_unique[dev];
            devicetype = commonUtils.getDevicetype(browsertestname.split("-")[0]);
            for (let k in retries) {
                if (retries[k].browser === dev_unique[dev]) {
                    newtestArr = newtestArr.concat(retries[k].testName);
                    newspecArr = newspecArr.concat(retries[k].specFile);
                }
            }
            let newtestArray = newtestArr.filter(commonUtils.onlyUnique);
            let newspecArray = newspecArr.filter(commonUtils.onlyUnique);
            deviceretryArray.push({
                testName: newtestArray,
                specFile: newspecArray,
                browser: browsertestname,
                devicetype: devicetype
            });
            newtestArr = [];
            newspecArr = [];
        }
        return deviceretryArray;
    },

    directConnect: function (exeEnv) {
        return exeEnv !== "sauce";
    },

    device_switcher: function (browser, version, os, testnames, parallel, instances, run, product, env, exeEnv, pac, tunnel) {
        let tunnelName = tunnel;

        if (env === 'prod') {
            tunnelName = tunnel;
        }
        if ((env !== 'prod') && (exeEnv === "sauce")) {
            tunnelName = tunnel;
        }

        console.log(' -- tunnel name in builder.js : ' + tunnel);

        let mobileArray = [];
        let desktopArray = [];

        switch (true) {

            case browser === "chrome" || browser === "firefox" || browser === "Internet Explorer" || browser === "safari" || browser === "opera" || browser === "MicrosoftEdge":
                if (exeEnv === "sauce") {
                    desktopArray.push({
                        name: browser + "-" + run + ":" + product,
                        browserName: browser,
                        browserVersion: 'latest',
                        version: version,
                        platformName: os,
                        platform: os,
                        shardTestFiles: parallel,
                        maxInstances: instances,
                        specs: testnames,
                        marionette: true,
                        nonSyntheticWebClick: "false",
                        maxDuration: 5400,
                        idleTimeout: 5400,
                        'goog:chromeOptions': {'w3c': true},
                        acceptInsecureCerts: true,
                        'sauce:options': {
                            name: browser + "-" + run + ":" + product,
                            tunnelIdentifier: tunnelName,
                            screenResolution: this.chooseScreenResolution(os),
                            extendedDebugging: false,
                            capturePerformance: false,
                            build: tunnelName,
                            avoidProxy: true
                        },
                    });
                } else {
                    desktopArray.push({
                        name: browser + "-" + run + ":" + product,
                        browserName: browser,
                        browserVersion: 'latest',
                        version: version,
                        platform: os, // only for protractor
                        //platformName: os, // only for sauce
                        shardTestFiles: parallel,
                        maxInstances: instances,
                        specs: testnames,
                        marionette: true,
                        nonSyntheticWebClick: "false",
                        maxDuration: 5400,
                        idleTimeout: 5400,
                        'goog:chromeOptions': {'w3c': true},
                        acceptInsecureCerts: true,
                        screenResolution: this.chooseScreenResolution(os),
                        proxy: {
                            proxyAutoconfigUrl: pac,
                            proxyType: 'pac'
                        }
                    });
                }
                return desktopArray;

            case browser === "iPhone":
                mobileArray = [];
                mobileArray.push({
                    name: browser + "-" + run + ":" + product,
                    tunnelIdentifier: tunnelName,
                    shardTestFiles: parallel,
                    maxInstances: instances,
                    specs: testnames,
                    browserName: browser,
                    version: version,
                    app: "safari",
                    deviceName: "iPhone Simulator",
                    nonSyntheticWebClick: "false",
                    "appium-version": "1.5.2"
                });
                return mobileArray;

            case browser === "iPad":
                mobileArray = [];
                mobileArray.push({
                    name: browser + "-" + run + ":" + product,
                    tunnelIdentifier: tunnelName,
                    shardTestFiles: parallel,
                    maxInstances: instances,
                    specs: testnames,
                    browserName: browser,
                    version: version,
                    maxDuration: 5400,
                    idleTimeout: 5400,
                    app: "safari",
                    deviceName: "iPad Simulator",
                    nonSyntheticWebClick: "false",
                    "appium-version": "1.5.2",
                    "device-orientation": "landscape"
                });
                return mobileArray;

            case browser === "Samsung Galaxy Nexus":
                mobileArray = [];
                mobileArray.push({
                    name: browser + "-" + run + ":" + product,
                    tunnelIdentifier: tunnelName,
                    shardTestFiles: parallel,
                    maxInstances: instances,
                    specs: testnames,
                    browserName: "android",
                    version: version,
                    maxDuration: 5400,
                    idleTimeout: 5400,
                    deviceName: "Samsung Galaxy Nexus Emulator",
                    platform: "Linux"
                });
                return mobileArray;

            case browser === "Samsung Galaxy Tab":
                mobileArray = [];
                mobileArray.push({
                    name: browser + "-" + run + ":" + product,
                    tunnelIdentifier: tunnelName,
                    shardTestFiles: parallel,
                    maxInstances: instances,
                    specs: testnames,
                    browserName: "android",
                    version: version,
                    maxDuration: 5400,
                    idleTimeout: 5400,
                    deviceName: "Samsung Galaxy Tab 3 Emulator",
                    platform: "Linux",
                    "device-orientation": "landscape"
                });
                return mobileArray;
        }
    },

    chooseScreenResolution: function (opSys) {
        //kapil: Using Large resolutions due to Consent Banner interference.
        if (opSys.toLowerCase().indexOf("windows") >= 0) {
            return commons.screenresolution.windows.width + 'x' + commons.screenresolution.windows.height;
        } else if (opSys.toLowerCase().indexOf("mac") >= 0) {
            return commons.screenresolution.mac.width + 'x' + commons.screenresolution.mac.height;
        } else {
            return commons.screenresolution.default.width + 'x' + commons.screenresolution.default.height;
        }
    }
};

module.exports = builder;