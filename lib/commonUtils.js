'use strict';

let fs = require('fs');
let reporter = require('protractor-multicapabilities-htmlreporter_v2');
let xmlReporter = new XMLReporter({
    'title': 'My Protractor End to End Results',
    'xmlReportDestPath': 'junit-output-final.xml'
});
let dateFormat = require('dateformat');
let CryptoJS = require('crypto-js');
let keySize = 256;
let iterations = 100;
let commons = require('../config/commons');

let commonUtils = {
    getDevicetype: function (browserName) {
        switch (true) {
            case browserName === "chrome" || browserName === "firefox" || browserName === "internet explorer" || browserName === "safari" || browserName === "MicrosoftEdge" || browserName === "opera":
                return "desktop";
            case browserName === "iPhone" || browserName === "Samsung Galaxy Nexus":
                return "mobile";
            case browserName === "iPad" || browserName === "Samsung Galaxy Tab":
                return "tablet";
        }
    },
    onlyUnique: function (value, index, self) {
        return self.indexOf(value) === index;
    },
    concatJson: function (type) {
        let stats = fs.existsSync('./results');
        if (stats === false) {
            return true;
        } else {
            let files = this.getFiles("./results");
            console.log(files);
            let allresults = [];
            for (let i = 0, len = files.length; i < len; i++) {
                let filePath = files[i];
                if (filePath.indexOf(type + ".json") !== -1) {
                    console.log(filePath);
                    let data = require("../" + filePath);
                    allresults = allresults.concat(data);
                }
            }
            fs.writeFileSync('ptor-final-' + type + '.json', JSON.stringify(allresults));
        }
    },
    getFiles: function (dir, files_) {
        files_ = files_ || [];
        let files = fs.readdirSync(dir);
        for (let i in files) {
            let name = dir + '/' + files[i];
            if (fs.statSync(name).isDirectory()) {
                return this.getFiles(name, files_);
            } else {
                files_.push(name);
            }
        }
        return files_;
    },
    mergeJson: function () {
        let a = require('../ptor-final-init.json');
        let b = require('../ptor-final-retry.json');
        let aL = a.length,
            bL = b.length,
            aTemp = {},
            bTemp = {},
            aFinal = [];

        for (let i = 0; i < aL; i++) {
            aTemp[a[i].description] = a[i];
        }

        for (let i = 0; i < bL; i++) {
            bTemp[b[i].description] = b[i];
        }

        let keys = Object.keys(bTemp);
        for (let i = 0; i < keys.length; i++) {
            aTemp[keys[i]] = bTemp[keys[i]];
        }

        keys = Object.keys(aTemp);
        for (let i = 0; i < keys.length; i++) {
            aFinal.push(aTemp[keys[i]]);
        }
        fs.writeFileSync('ptor-final.json', JSON.stringify(aFinal));
    },
    generateJunitReport: function (jsonOutputFile, xmlOutputFile) {
        return xmlReporter.generateXMLReport(jsonOutputFile);
    },
    getPtorParams: function (paramsArray) {
        let env = paramsArray[5];
        let run = paramsArray[7];
        let type = paramsArray[9];
        let product = paramsArray[11];
        let parallel = paramsArray[13];
        let exeEnv = paramsArray[15];
        let tunnel = paramsArray[17];
        let shard_index = paramsArray[19];
        let applienabled = paramsArray[21];
        return {
            env: env,
            type: type,
            run: run,
            product: product,
            parallel: parallel,
            exeEnv: exeEnv,
            tunnel: tunnel,
            shard_index: shard_index,
            applienabled: applienabled
        };
    },
    getSpecName: function (theme, testName, browser, version, specFile) {
        return theme + "|" + testName + "|" + browser + "|" + version + "|" + specFile;
    },
    getSpecName2: function (testName, specFile) {
        return browser.params.product + "|"
            + testName + "|"
            + browser.params.browser + "|"
            + browser.params.version + "|"
            + specFile;
    },
    getTasks: function (product, run) {
        let str, appendString = "";
        appendString += "protractor:" + run + ",";
        str = appendString.replace(/,\s*$/, "");
        let tasks = str.split(',');
        console.log("*****TASKS TO BE EXECUTED*****");
        console.log(tasks);
        console.log("*****TASKS TO BE EXECUTED*****");
        return tasks;
    },
    checkRetry: function () {
        let retryTheme, themeArray = [];
        try {
            fs.statSync('./retry.js');
            retryTheme = fs.readFileSync('./retry.js', 'utf8');
            console.log(retryTheme);

            let jsonstr = JSON.parse(retryTheme);
            for (let i in jsonstr) {
                themeArray.push(jsonstr[i].version);
            }
            console.log(themeArray);
            return themeArray.filter(this.onlyUnique);
        } catch (err) {
            retryTheme = [];
            return retryTheme;
        }
    },
    generateInitReport: function () {
        let stats = fs.existsSync('./ptor-final-init.json');
        console.log(stats);
        if (stats === false) {
            return true;
        } else {
            reporter.generateHtmlReport('ptor-final-init.json', 'Automation', 'report.html');
        }
    },
    generateRetryReport: function () {
        let stats = fs.existsSync('./ptor-final-retry.json');
        console.log(stats);
        if (stats === false) {
            return true;
        } else {
            reporter.generateHtmlReport('ptor-final-retry.json', 'Automation', 'report-retry.html');
        }
    },
    generateFinalReport: function () {
        let stats = fs.existsSync('./ptor-final.json');
        console.log(stats);
        if (stats === false) {
            return true;
        } else {
            reporter.generateHtmlReport('ptor-final.json', 'Automation', 'report-final.html');
        }
    },
    consolidateReport: function (type) {
        if (type === "init") {
            this.concatJson(type);
            this.generateInitReport();
            this.generateJunitReport('ptor-final-init.json', 'junit-output-final.xml');
        }
        if (type === "retry") {
            this.concatJson(type);
            this.mergeJson();
            this.generateRetryReport();
            this.generateFinalReport();
            this.generateJunitReport('ptor-final.json', 'junit-output-final.xml');
        }
    },
    getDate_YYYY_MM_DD_HHMMSS: function () {
        let sepr = '-';
        let d = new Date();
        let month = d.getMonth() + 1;
        let str = d.getFullYear() + sepr
            + month + sepr
            + d.getDate() + sepr
            + d.getHours() +
            +d.getMinutes() +
            +d.getSeconds();

        console.log('Genrated Date String -' + str);
        return str;
    },
    generateDomainName: function (pattern) {
        let prefix = ''; //default prefix
        let plan = '';
        let tld = ".com";
        let sep = '-';

        if (pattern['prefix']) {
            prefix = pattern['prefix'];
        }

        if (pattern['rateplan']) {
            plan = pattern['rateplan'].replace(/_/g, '-');
        }

        if (pattern['tld']) {
            tld = String(pattern['tld']).trim();
        }

        let domainName = prefix + sep + plan + sep + this.getDate_YYYY_MM_DD_HHMMSS() + tld;
        domainName = domainName.replace(/^-/, '');
        console.log('Generated domain name :' + domainName);
        return domainName;
    },

    getTodayDateStr: function (format) {
        let now = new Date();
        return dateFormat(now, format);
    },

    getDateStr: function (dt, format) {
        return dateFormat(dt, format);
    },

    encrypt: function (msg) {
        let pass = commons.secretKey;
        let salt = CryptoJS.lib.WordArray.random(128 / 8);
        let key = CryptoJS.PBKDF2(pass, salt, {
            keySize: keySize / 32,
            iterations: iterations
        });

        let iv = CryptoJS.lib.WordArray.random(128 / 8);

        let encrypted = CryptoJS.AES.encrypt(msg, key, {
            iv: iv,
            padding: CryptoJS.pad.Pkcs7,
            mode: CryptoJS.mode.CBC

        });

        // salt, iv will be hex 32 in length
        // append them to the ciphertext for use  in decryption
        let transitmessage = salt.toString() + iv.toString() + encrypted.toString();
        return transitmessage;
    },

    decrypt: function (transitmessage) {
        let pass = commons.secretKey;
        let salt = CryptoJS.enc.Hex.parse(transitmessage.substr(0, 32));
        let iv = CryptoJS.enc.Hex.parse(transitmessage.substr(32, 32))
        let encrypted = transitmessage.substring(64);

        let key = CryptoJS.PBKDF2(pass, salt, {
            keySize: keySize / 32,
            iterations: iterations
        });

        let decrypted = CryptoJS.AES.decrypt(encrypted, key, {
            iv: iv,
            padding: CryptoJS.pad.Pkcs7,
            mode: CryptoJS.mode.CBC

        });
        return decrypted.toString(CryptoJS.enc.Utf8);
    }
};

module.exports = commonUtils;