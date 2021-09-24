'use strict';

let SpecReporter = require('jasmine-spec-reporter').SpecReporter;
let commonUtils = require('../lib/commonUtils.js');
let commons = require('./commons.js');
let builder = require('../lib/builder.js');
let ptorparams = commonUtils.getPtorParams(process.argv);
let env = ptorparams.env;
let run = ptorparams.run;
let type = ptorparams.type;
let product = ptorparams.product;
let parallel = ptorparams.parallel;
let exeEnv = ptorparams.exeEnv;
let tunnel = ptorparams.tunnel;
let shard_index = ptorparams.shard_index;
let applienabled = ptorparams.applienabled;
applienabled = applienabled === undefined ? false : applienabled.trim().toLowerCase() === "yes";
let maxParalleltests = (process.env.maxParalleltests !== undefined) ? process.env.maxParalleltests : commons.maxParalleltests;
let capability_builder = builder.builder_run(type, run, product, parallel, maxParalleltests, env, exeEnv, tunnel, shard_index);
let multiCapabilities = JSON.parse(capability_builder);
let directConnect = builder.directConnect(exeEnv);
let runtimeTestConfig = {};

/* kapil: make testConfig object passed from environment var  available for tests. */
if (process.env.testConfig !== undefined) {
    console.log("****** Runtime testConfig = " + process.env.testConfig);
    runtimeTestConfig = JSON.parse(process.env.testConfig);
}

require('babel-core/register');

console.log(' -- tunnel name in conf.js : ' + tunnel);
console.log(' -- process.argv in conf.js : ' + process.argv);

exports.config = {
    directConnect: directConnect,
    chromeDriver: '../node_modules/chromedriver/bin/chromedriver',
    firefoxPath: '/Applications/Firefox.app/Contents/MacOS/firefox',
    geckoDriver: '../node_modules/geckodriver/geckodriver',
    maxSessions: 1,
    allScriptsTimeout: 900000,
    multiCapabilities: multiCapabilities,
    params: require('../config/urls.json'),
    onPrepare: function () {
        let capsPromise = browser.getProcessedConfig();
        capsPromise.then(function (caps) {
            console.log(caps.capabilities);
            browser.params.browser = caps.capabilities.name.split("-")[0];
            browser.params.version = caps.capabilities.version;
            browser.params.os = caps.capabilities.platform;
            browser.params.product = product;
            browser.params.runtimeTestConfig = runtimeTestConfig;
            browser.params.applienabled = applienabled;
            browser.params.phase = {
                launchURL: function () {
                    if (process.env.phaseurl !== undefined && process.env.phaseurl.trim() !== '') {
                        let phaseurls = process.env.phaseurl.trim().split(',');
                        console.log(' --> Launching Phase URLs : ', phaseurls);
                        let urls = [];
                        phaseurls.forEach(function (phaseurl) {
                            urls.push(
                                browser.get(phaseurl.trim()).then(function () {
                                    return browser.sleep(3000);
                                })
                            );
                        });
                        return Promise.all(urls);
                    } else {
                        return Promise.resolve();
                    }
                }
            }
        });
        jasmine.getEnv().addReporter(new SpecReporter({
            suite: {
                displayNumber: true
            },
            spec: {
                displayErrorMessages: true,
                displayStacktrace: true,
                displaySuccessful: true,
                displayFailed: true,
                displayPending: true,
                displayDuration: true
            },
            summary: {
                displayErrorMessages: true,
                displayStacktrace: true,
                displaySuccessful: true,
                displayFailed: true,
                displayPending: true,
                displayDuration: true
            }
        }));
    },
    framework: 'jasmine2',
    SELENIUM_PROMISE_MANAGER: false,
    afterLaunch: function () {
        commonUtils.consolidateReport(run);
    },
    resultJsonOutputFile: 'results/' + product + '_' + shard_index + '-' + run + '.json',
    jasmineNodeOpts: {
        showColors: true,
        defaultTimeoutInterval: 1800000
    },
};

if (exeEnv === "local") {
    console.log(commons.seleniumAddress);
    if (!directConnect) {
        exports.config.seleniumAddress = commons.seleniumAddress;
    }
} else {
    exports.config.sauceUser = commons.sauce.user;
    exports.config.sauceKey = commons.sauce.key;
}