'use strict';

let path = require('path');
let fs = require('fs');

let ShardTests = function () {
};

ShardTests._SPECS_AND_DEVICES = {};
ShardTests._INDEX = 0;
ShardTests._HOW_MANY_SHARDS = undefined;
ShardTests._TESTS = undefined;
ShardTests._DEVICES = undefined;

/**
 * @return {number}
 */
ShardTests.SHARD = function (how_many_groups, tests, _devices) {

    ShardTests._SPECS_AND_DEVICES = {};
    ShardTests._INDEX = 0;
    ShardTests._HOW_MANY_SHARDS = undefined;
    ShardTests._TESTS = undefined;
    ShardTests._DEVICES = undefined;

    if (ShardTests._HOW_MANY_SHARDS === undefined &&
        ShardTests._TESTS === undefined &&
        ShardTests._DEVICES === undefined) {
        how_many_groups = how_many_groups > 10 ? 10 : how_many_groups;
        ShardTests._HOW_MANY_SHARDS = how_many_groups;
        ShardTests._TESTS = tests;
        ShardTests._DEVICES = _devices;
    }

    if (Object.keys(ShardTests._SPECS_AND_DEVICES) !== undefined && Object.keys(ShardTests._SPECS_AND_DEVICES).length === 0) {
        let obj = {};
        if (ShardTests._DEVICES.length > ShardTests._HOW_MANY_SHARDS) {
            for (let i = 0; i < ShardTests._HOW_MANY_SHARDS; i++) {
                obj = {};
                obj.devices = [];
                obj.devices.push(ShardTests._DEVICES[i]);
                obj.tests = ShardTests._TESTS;
                ShardTests._SPECS_AND_DEVICES[i] = obj;
            }

            for (let j = 0; j < ShardTests._DEVICES.length - ShardTests._HOW_MANY_SHARDS; j++) {
                obj = {};
                obj = ShardTests._SPECS_AND_DEVICES[ShardTests._HOW_MANY_SHARDS - 1];
                obj.devices.push(ShardTests._DEVICES[j + ShardTests._HOW_MANY_SHARDS]);
            }
        } else if (ShardTests._DEVICES.length === ShardTests._HOW_MANY_SHARDS) {
            for (let k = 0; k < ShardTests._HOW_MANY_SHARDS; k++) {
                obj = {};
                obj.devices = [];
                obj.devices.push(ShardTests._DEVICES[k]);
                obj.tests = ShardTests._TESTS;
                ShardTests._SPECS_AND_DEVICES[k] = obj;
            }
        } else if (ShardTests._DEVICES.length < ShardTests._HOW_MANY_SHARDS) {
            let devices = [];
            let devices_count = 0;
            let device_indices = {};

            for (let d = 0; d < ShardTests._HOW_MANY_SHARDS; d++) {
                devices[d] = ShardTests._DEVICES[devices_count++];

                if (device_indices[devices[d]] === undefined) {
                    device_indices[devices[d]] = [];
                }

                device_indices[devices[d]].push(d);

                if (devices_count === ShardTests._DEVICES.length) {
                    devices_count = 0;
                }
            }
            devices = Object.keys(device_indices);
            for (let l = 0; l < devices.length; l++) {
                let tests_count = 0;
                let indices_count = 0;
                let indices = device_indices[devices[l]];
                while (tests_count < ShardTests._TESTS.length) {
                    let device = devices[l];
                    if (indices_count > indices.length - 1) {
                        indices_count = 0;
                    }
                    let index = indices[indices_count];
                    obj = ShardTests._SPECS_AND_DEVICES[index] === undefined ? {} : ShardTests._SPECS_AND_DEVICES[index];
                    obj.devices = obj.devices === undefined ? [] : obj.devices;
                    obj.tests = obj.tests === undefined ? [] : obj.tests;
                    obj.devices.push(device);
                    obj.devices = Array.from(new Set(obj.devices));
                    obj.tests.push(ShardTests._TESTS[tests_count]);
                    ShardTests._SPECS_AND_DEVICES[index] = obj;
                    tests_count++;
                    indices_count++;
                }
            }
        }

        let txtFile = path.dirname(__dirname) + path.sep + 'config' + path.sep + 'groups_shard.js';
        let stream = fs.createWriteStream(txtFile);
        stream.once('open', (fd) => {
            stream.write("module.exports = " + JSON.stringify(ShardTests._SPECS_AND_DEVICES));
            // Important to close the stream when you're ready
            stream.end();
        });
    }

    return Object.keys(ShardTests._SPECS_AND_DEVICES).length;
};


/**
 * @return {number}
 */
ShardTests.SHARD_RETRY = function (how_many_groups, tests, _devices, retryJSON) {

    ShardTests._SPECS_AND_DEVICES = {};
    ShardTests._INDEX = 0;
    ShardTests._HOW_MANY_SHARDS = undefined;
    ShardTests._TESTS = undefined;
    ShardTests._DEVICES = undefined;

    if (ShardTests._HOW_MANY_SHARDS === undefined &&
        ShardTests._TESTS === undefined &&
        ShardTests._DEVICES === undefined) {
        how_many_groups = how_many_groups > 10 ? 10 : how_many_groups;
        ShardTests._HOW_MANY_SHARDS = how_many_groups;
    }

    // Figure out the unique devices first.
    // Add the unique devices to the shard
    // and then add the remaining devices.
    // Iterate and now map the specs against to the devices.

    let unique_devices = new Set();
    let devices = [];

    for (let i = 0; i < retryJSON.length; i++) {
        if (!unique_devices.has(retryJSON[i].browser)) {
            unique_devices.add(retryJSON[i].browser);
        } else {
            devices.push(retryJSON[i].browser);
        }
    }

    if (retryJSON.length > how_many_groups) {
        //very rare.
        let total_no_of_specs = retryJSON.length;
        let device_index = 0;
        let retryJSON_index = 0;
        let shard_count = how_many_groups;

        while (total_no_of_specs > 0) {
            if (total_no_of_specs < shard_count) {
                shard_count = total_no_of_specs;
            }

            for (let l = 0; l < shard_count; l++) {
                let obj = {};
                obj.devices = [];
                obj.tests = [];

                //look for the device from devices and add absolute device settings.
                let device = _devices.find(function (device) {
                    return device.trim().toLowerCase().indexOf(retryJSON[retryJSON_index].browser.trim().toLowerCase()) !== -1;
                });
                //device match found.
                obj.devices.push(device);

                let test = tests.find(function (test) {
                    return test.trim().toLowerCase().indexOf(retryJSON[retryJSON_index].specFile.trim().toLowerCase()) !== -1;
                    //test match found. [ For now there is no clue, whether the spec belongs to smoke or regression, because there is no spec path information in retry.js]
                });
                obj.tests.push(test);
                if (retryJSON_index >= shard_count && Object.keys(ShardTests._SPECS_AND_DEVICES).length >= how_many_groups) {
                    //Now search and append.
                    let indices = Object.keys(ShardTests._SPECS_AND_DEVICES);
                    for (let i = 0; i < indices.length; i++) {
                        //device match found.
                        if (ShardTests._SPECS_AND_DEVICES[i].devices.find(
                            function (device) {
                                return obj.devices[0].trim().toLowerCase() === device.trim().toLowerCase();
                            }) !== undefined) {

                            obj.tests = obj.tests.filter(function (test) {
                                return test !== null && test !== undefined;
                            });
                            ShardTests._SPECS_AND_DEVICES[i].tests.push(...obj.tests);
                            ShardTests._SPECS_AND_DEVICES[i].tests = Array.from(new Set(ShardTests._SPECS_AND_DEVICES[i].tests)); // remove duplicate specs.
                            retryJSON_index++;
                            break;
                        }
                    }
                } else {
                    obj.tests = obj.tests.filter(function (test) {
                        return test !== null && test !== undefined;
                    });

                    if (obj.tests.length > 0) {
                        let keys = Object.keys(ShardTests._SPECS_AND_DEVICES);
                        //if device already added, do not add it again.
                        let alreadyExists = undefined;
                        for (let d = 0; d < keys.length; d++) {
                            if (JSON.stringify(ShardTests._SPECS_AND_DEVICES[d]) === JSON.stringify(obj)) {
                                alreadyExists = true;
                                break;
                            }
                        }

                        if (!alreadyExists) {
                            ShardTests._SPECS_AND_DEVICES[device_index] = obj;
                            device_index++;
                        }
                    }
                    retryJSON_index++;
                }
            }
            total_no_of_specs = total_no_of_specs - how_many_groups;
        }
    } else {
        let index = 0;
        for (let l = 0; l < retryJSON.length; l++) {
            let obj = {};
            obj.devices = [];
            obj.tests = [];

            //look for the device from devices and add absolute device settings.
            let device = _devices.find(function (device) {
                return device.trim().toLowerCase().indexOf(retryJSON[l].browser.trim().toLowerCase()) !== -1;
            });
            obj.devices.push(device);

            let test = tests.find(function (test) {
                return test.trim().toLowerCase().indexOf(retryJSON[l].specFile.trim().toLowerCase()) !== -1;
                //test match found. [ For now there is no clue, whether the spec belongs to smoke or regression, because there is no spec path information in retry.js]
            });
            obj.tests.push(test);

            let keys = Object.keys(ShardTests._SPECS_AND_DEVICES);
            //if device already added, do not add it again.
            let alreadyExists = undefined;
            for (let d = 0; d < keys.length; d++) {
                if (JSON.stringify(ShardTests._SPECS_AND_DEVICES[d]) === JSON.stringify(obj)) {
                    alreadyExists = true;
                    break;
                }
            }

            if (!alreadyExists) {
                ShardTests._SPECS_AND_DEVICES[index] = obj;
                index++;
            }
        }
    }

    let txtFile = path.dirname(__dirname) + path.sep + 'config' + path.sep + 'groups_retry_shard.js';
    let stream = fs.createWriteStream(txtFile);
    stream.once('open', (fd) => {
        stream.write("module.exports = " + JSON.stringify(ShardTests._SPECS_AND_DEVICES));
        // Important to close the stream when you're ready
        stream.end();
    });

    return Object.keys(ShardTests._SPECS_AND_DEVICES).length;
};

module.exports = ShardTests;