Getting started :
--------------------------------

npm install

```

Configuration files
-------------------------------
```
1.commons.js
  * Sauce details
  * email receipients 
  * proxy pacs

2.groups.js
  * Test case info
  * Browser-Version-Device [To run locally, only pass "Browser-Version"]

Make sure, you have updated "package.json" file to point where to execute the tests (eg: exeEnv=local/sauce)
```

Running the tests:
-------------------
```
Sauce : npm run smoke-prod_sauce
Local : npm run smoke-prod_local

For running locally, start webdriver by issuing command "webdriver-manager start" in daemon mode.
```



Test cases (Specs)
--------------------------
```
protractor-boilerplate/specs 
Sample :  protractor-boilerplate/specs/home.js
   
```

Locator maps
----------------------------
```
protractor-boilerplate/locators 
Sample :  protractor-boilerplate/locators/home.js
   
```

Page Objects
----------------------------
```
protractor-boilerplate/pages
Sample :  protractor-boilerplate/pages/home.page.js
``` 
   
Current browser/device support
--------------------------------
```
Internet Explorer
Firefox
Chrome
Safari
Opera
iPhone
iPad
Samsung Galaxy Nexus
Samsung Galaxy Tab
```
Framework Details
----------------------------

In this framework, test cases are designed using page objects and it serves as an interface to a page or module of your AUT.
Page objects are designed at module level, hence it can be reused for end to end automation. As some of our themes are not responsive, we have to supply different locators for desktop/tablet/mobile. Locator information and test data are stored in json format. It is structured in module and device type combination.
 
##Automation Structure


##Test Execution
This framework uses grunt to execute the tests. Grunt is a javascript task runner, built on top of Node.js. This framework dynamically generate protractor grunt tasks based on the configuration. Protractor needs two files to run, a configuration file and a test or spec file.


###protractor config:
This configuration file is the starting point for protractor tests. It tells protractor about the Selenium Server, which tests to run, device configs and test framework to use.

###groups config:
This config contains test case group and browser/device mapping.

###Commons config
This file contains common configurations like proxy pac, sauce info, email ilist etc.

###Library
Lib contains common Utilities which inlcude capability builder and retry logics.



## Features
 - Page Objects
 - Locators Map
 - Multi browser/device support
 - Parallel execution
 - Retry flaky tests
 - Runtime Sauce tunnel
 - Grouping of testcases
 - Multi browser/device html report


