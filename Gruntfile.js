module.exports = function (grunt) {
    process.setMaxListeners(0);
    let os = require('os');
    let env = grunt.option('env');
    let run = grunt.option('run');
    let product = grunt.option('product');
    let type = grunt.option('type');
    let appli_enabled = grunt.option('applienabled');
    let parallel = grunt.option('parallel');
    let exeEnv = grunt.option('exeEnv');
    let data = grunt.option('data');
    let retry = grunt.option('retry');
    let suitetype = grunt.option('suitetype');
    let commonUtils = require('./lib/commonUtils.js');
    let commons = require('./config/commons.js');
    let ilist = commons.ilist.recipients.toString();
    let path = require("path");
    let pac, generatedtunnelName;
    let nodemailer = require('nodemailer');
    env !== "prod" ? pac = commons.proxies[env].proxyUrl : pac = "";
    let buildNumber = process.env.BUILD_NUMBER;
    if (!buildNumber) {
        generatedtunnelName = "localtunnel";
        buildNumber = "00";
    } else {
        generatedtunnelName = "" + env + "" + suitetype + "" + buildNumber;
    }
    let sauceconnect_vv = (process.env.SAUCECONNECT_VERY_VERBOSE !== undefined);
    let groups = require('./config/groups');
    let portfinder = require('portfinder');
    let SpecsAndDevicesGenerator = require('./lib/shard_tests');
    let spec_group = process.env.SPEC_GROUP;
    let specs_and_devices = spec_group === undefined ? groups.configure[type] : JSON.parse(spec_group.trim());
    commons.maxParalleltests = (process.env.maxParalleltests !== undefined) ? process.env.maxParalleltests : commons.maxParalleltests;
    let shards_count = SpecsAndDevicesGenerator.SHARD(commons.maxParalleltests, specs_and_devices.specs, specs_and_devices.devices);
    let transporter = nodemailer.createTransport({
        type: 'SMTP',
        service: "Gmail",
        auth: {
            user: '@gmail.com',
            pass: 'P1234567p'
        }
    });
    let mailOptions = {
        from: '" " <@gmail.com>', //sender address
        to: ilist
    };

    let webdriverManagerUpdate = ""; //"update --versions.chrome 75.0.3770.8";

    grunt.loadNpmTasks('grunt-shell-spawn');
    grunt.loadNpmTasks('grunt-contrib-clean');
    require('load-grunt-tasks')(grunt);

    let config = {
        mkdir: {
            all: {
                options: {
                    mode: '0700',
                    create: ['results']
                },
            },
        },
        protractor_webdriver: {
            alive: {
                options: {
                    keepAlive: true
                }
            },
            dead: {}
        },
        protractor: {
            options: {
                keepAlive: true,
                configFile: "config/conf.js",
            }
        },
        shell: {
            checkProcess: {
                command: 'ps aux | grep -v grep | grep "bin/sc"',
                options: {
                    stderr: true,
                    callback: startDynamicTunnel
                }
            },
            protractor: {
                options: {
                    stdout: true
                },
                command: path.resolve('node_modules/protractor/bin/webdriver-manager') + webdriverManagerUpdate
            },
            webdriver_shutdown: {
                options: {
                    stdout: true
                },
                command: 'kill $(ps -ef | grep webdriver | grep -v grep | awk \'{ print $2 }\')'
            },
            checkProcess_kill: {
                options: {
                    stdout: true
                },
                command: 'kill $(ps aux | grep -v grep | grep "bin/sc" |  awk \'{ print $2 }\')'
            },
            chromeversion: {
                command: "/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --version",
                options: {
                    async: false,
                    callback: function (exitCode, stdOutStr, stdErrStr, done) {
                        let cv = String(stdOutStr).match(/[\d+\\.]+/)[0];
                        console.log('--> Chrome version found on system : ', cv);
                        console.log('--> WebDriver manager updates the chrome version driver to : ', cv);
                        webdriverManagerUpdate = " update --versions.chrome " + cv;
                        grunt.task.run('register_shell_protractor:' + webdriverManagerUpdate);
                        done();
                    }
                }
            }
        },
        concurrent: {
            init: {
                tasks: [],
                options: {
                    limit: 10,
                    logConcurrentOutput: true
                }
            },
            retry: {
                tasks: [],
                options: {
                    limit: 10,
                    logConcurrentOutput: true
                }
            }
        },
        babel: {
            options: {
                sourceMap: true
            },
            dist: {
                files: [{
                    expand: true,
                    cwd: 'src/',
                    src: ['**/*.js'],
                    dest: 'dist/',
                    ext: '.js'
                }]
            }
        },
        clean: {
            folder: ['dist', 'results', 'retry_testdata'],
            files: ['*.xml', "*.html", "retry.js", "ptor-final*.json"]
        }
    };

    for (let sc = 0; sc < shards_count; sc++) {
        config.protractor["init_" + sc] = {
            options: {
                args: {
                    params: {
                        env: env,
                        run: run,
                        type: type,
                        product: product,
                        parallel: parallel,
                        exeEnv: exeEnv,
                        data: data,
                        tunnel: generatedtunnelName,
                        shard_index: sc,
                        applienabled: appli_enabled
                    },
                    verbose: true,
                }
            }
        };
    }

    for (let sc = 0; sc < commons.maxParalleltests; sc++) {
        config.protractor["retry_" + sc] = {
            options: {
                args: {
                    params: {
                        env: env,
                        run: "retry",
                        type: type,
                        product: product,
                        parallel: parallel,
                        exeEnv: exeEnv,
                        data: data,
                        tunnel: generatedtunnelName,
                        shard_index: sc,
                        applienabled: appli_enabled
                    },
                    verbose: true,
                }
            }
        };
    }

    grunt.config.init(config);

    function startDynamicTunnel(err, stdout, stderr, cb) {
        if (err) {
            let ports = [];
            portfinder.getPortPromise({
                port: 29999,
                stopPort: 30099
            }).then(function (port) {
                ports.push(port);
                return portfinder.getPortPromise({
                    port: 4445,
                    stopPort: 4545
                });
            }).then(function (port) {
                ports.push(port);
                console.log(' --- available port for scproxy : ', ports[0]);
                console.log(' --- available port for seport : ', ports[1]);
                grunt.config.set('scproxy', ports[0]);
                grunt.config.set('seport', ports[1]);
                cb();
            });
        } else {
            let ports = [];
            portfinder.getPortPromise({
                port: 29999,
                stopPort: 30099
            }).then(function (port) {
                ports.push(port);
                return portfinder.getPortPromise({
                    port: 4445,
                    stopPort: 4545
                });
            }).then(function (port) {
                ports.push(port);
                console.log(' --- available port for scproxy : ', ports[0]);
                console.log(' --- available port for seport : ', ports[1]);
                grunt.config.set('scproxy', ports[0]);
                grunt.config.set('seport', ports[1]);
                cb();
            });
        }
    }

    function startDynamicTunnel2(err, stdout, stderr, cb) {
        if (err) {
            grunt.config.set('scproxy', 29999);
            grunt.config.set('seport', 4446);
            cb();
        } else {
            let pid = Math.floor(Math.random() * 20) + 29999;
            let selid = Math.floor(Math.random() * 20) + 4446;
            grunt.config.set('scproxy', pid);
            grunt.config.set('seport', selid);
            cb();
        }
    }

    grunt.task.registerTask('register_shell_protractor', function (webdriverManagerUpdate) {
        grunt.config('shell.protractor', {
            options: {
                stdout: true
            },
            command: (path.resolve('node_modules/protractor/bin/webdriver-manager') + webdriverManagerUpdate)
        });
    });

    grunt.registerTask('exe', function () {

        // ------- Cleanup Workspace --------//
        grunt.task.run('clean');

        // ------ Create Output directory --------//
        grunt.task.run('mkdir');
        grunt.task.run('babel');

        // ------ Start Sauce Tunnel  --------//
        if (exeEnv === "sauce") {
            if (os.platform().trim().toLowerCase() === "darwin") {
                console.log('--> Killing sauce connect only for mac os.');
                grunt.task.run('shell:checkProcess_kill');
            }
            grunt.task.run('shell:checkProcess');
        }
        if (exeEnv === "local") {
            grunt.task.run('shell:chromeversion');
            grunt.task.run('shell:webdriver_shutdown');
            grunt.task.run('shell:protractor');
            grunt.task.run('protractor_webdriver:alive');
        }
        // ------ Start Tests --------//
        let cnt = 0;
        let shard_tasks = [];

        for (let sc = 0; sc < shards_count; sc++) {
            shard_tasks.push('protractor:init_' + cnt);
            cnt++;
        }

        grunt.config('concurrent.init.tasks', shard_tasks);
        grunt.task.run('concurrent:init');

        grunt.registerTask('retry', function () {
            // ------ Verify Retry is needed --------//
            let retryTheme = commonUtils.checkRetry();
            if ((retryTheme.length > 0) && (retry === "yes")) {
                //Read the retry.js
                let retryJSON = [];
                try {
                    retryJSON = JSON.parse(require('fs').readFileSync('retry.js').toString());
                } catch (e) {
                    retryJSON = [];
                }

                if (retryJSON.length !== 0) {
                    let shards_count = SpecsAndDevicesGenerator.SHARD_RETRY(commons.maxParalleltests, specs_and_devices.specs, specs_and_devices.devices, retryJSON);
                    let cnt = 0;
                    let retrytasks = [];

                    for (let sc = 0; sc < shards_count; sc++) {
                        retrytasks.push('protractor:retry_' + cnt);
                        cnt++;
                    }
                    // ------ Start Retry Tests --------//
                    grunt.config('concurrent.retry.tasks', retrytasks);
                    grunt.task.run('concurrent:retry');
                }
            }
        });
        grunt.task.run('retry');

        grunt.registerTask('sendemail', function () {
            let emailSubject = 'Automation Report:' + ' [UD - ' + suitetype.toUpperCase() + ' : ' + env.toUpperCase() + ']' + ' [Build#:' + buildNumber + ']';

            let phase = '';
            if (process.env.phaseurl !== undefined && process.env.phaseurl.trim() !== '') {
                let phaseurls = process.env.phaseurl.trim().split(',');
                phase = phaseurls[0].trim().match(/(phase=.*)/)[0].replace('phase=', '');
                emailSubject = 'Automation Report:' + ' [UD - ' + suitetype.toUpperCase() + ' : ' + phase.toUpperCase() + ']' + ' [Build#:' + buildNumber + ']';
            }

            console.log("Generated Email Subject : " + emailSubject);

            // ------ Stop Tunnel --------//
            if (exeEnv === "sauce") {
            }
            // ------ Send Mail --------//
            mailOptions.subject = emailSubject;

            let isRetryReportExists = require("fs").existsSync('report-final.html');
            if (isRetryReportExists) {
                mailOptions.html = require("fs").readFileSync('report-final.html').toString()
                    + "<br>"
                    + "<br>"
                    + "<p> This Test Automation is triggered by System User : <b>" + require("os").userInfo().username + "</b></p>";
                //mailOptions.html = {path: 'report-retry.html'};
            } else {
                mailOptions.html = require("fs").readFileSync('report.html').toString()
                    + "<br>"
                    + "<br>"
                    + "<p> This Test Automation is triggered by System User : <b>" + require("os").userInfo().username + "</b></p>";
                //mailOptions.html = {path: 'report.html'};
            }

            let done = this.async();
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    return console.log(error);
                }
                console.log('Message sent: %s', info.messageId);
            });
            setTimeout(function () {
                done();
            }, 15000);
        });
        grunt.task.run('sendemail');
    });
};