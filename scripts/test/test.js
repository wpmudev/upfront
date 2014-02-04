var config = require('./config.json'),
  expect = require('chai').expect,
  path = require('path'),
  wrench = require('wrench');

// Synchronize upfront and upfront parlour themes to test installation
wrench.copyDirSyncRecursive(
  path.join(config.devThemesDirectory, 'upfront'),
  path.join(config.testThemesDirectory, 'upfront'),
  {
    forceDelete: true,
    exclude: /(svn|git|node_modules)/
  }
);
wrench.copyDirSyncRecursive(
  path.join(config.devThemesDirectory, config.parlourDirectoryName),
  path.join(config.testThemesDirectory, config.parlourDirectoryName),
  {
    forceDelete: true,
    exclude: /(svn|git|node_modules)/
  }
);

// Use webdriverjs to create a Selenium Client
var client = require('webdriverjs').remote({
  desiredCapabilities: {
    'phantomjs.binary.path': path.join(__dirname, 'node_modules', '.bin', 'phantomjs'),

    // Choose browser by uncommenting.
    // NOTE: only one can be uncommented at a time!

    // browserName: 'phantomjs'
    browserName: 'firefox'

    // For chrome you need ChromeDriver
    // https://code.google.com/p/selenium/wiki/ChromeDriver
    // download here http://chromedriver.storage.googleapis.com/index.html?path=2.8/
    // browserName: 'chrome'

  },
  // webdriverjs has a lot of output which is generally useless
  // However, if anything goes wrong, remove this to see more details
  logLevel: 'silent'
});

// Firefox needs more time to load layout so adjust time to load, define times for your maching in config.json.
var loadLayoutTime = client.options.desiredCapabilities.browserName === 'firefox' ? config.firefoxEditorLoad : config.editorLoad;

// Test Region is used to localize testing.
var testRegion = '.upfront-region-region-16';

describe('Test Upfront', function() {
    before(function(done) {
      client
        .init()
        .windowHandleSize({width: 1440, height: 800}) // This is size for phantomjs
        // Forced wait command. Webdriver has only implicit wait, which is wait for time only if element is not present on page
        // since we need some operations to complete before some tests, this function will try to waitFor for non existing
        // element which will cause it to wait for time that is passed as param.
        .addCommand('wait', function(timeToWaitMs, callback) {
          this.waitFor('#some-element_tHat-will-never-exist', timeToWaitMs, callback);
        })
        // This is needed for dragAndDrop command to work as expected since jquery-ui wont register hover over destination
        // element unless element that is dragged is moved at least for 1px while over destination element.
        .addCommand('uMoveToObject', function (cssSelector, callback) {
          this.element(cssSelector,function(err,result) {
            if(err === null && result.value) {
              this.moveTo(result.value.ELEMENT, 1, 1)
              .moveTo(null, 1, 1, callback);// need to move for one more pixel for jquery-ui
            } else {
              callback(err, result);
            }
          });
        })
        // Making dragAndDrop use adjusted uMoveToObject instead moveToObject so that jquery-ui registers move and inserting
        // wait so that app registers drag and drop gesture. Use uDragAndDrop instead dragAndDrop.
        .addCommand('uDragAndDrop', function(cssSelectorItem, cssSelectorDropDestination, callback) {
          this.moveToObject(cssSelectorItem)
              .buttonDown()
              .uMoveToObject(cssSelectorDropDestination)
              // .wait(100) // needed for app to register drag and drop// maybe not...
              .buttonUp(callback);
        })
        .url(config.wpAdminurl) // You have to be logged in to use Upfront
        .setValue('#user_login', config.wpUsername)
        .setValue('#user_pass', config.wpPassword)
        .submitForm('#loginform')
        .url(config.wpSiteroot + '/?dev=true', done);
    });

    describe('Upfront editor', function() {
      it('should load by click', function(done) {
        client
          .click('.upfront-edit_layout')
          .wait(loadLayoutTime) // this is actual editor load, so give it time
          .isVisible('#sidebar-ui-wrapper', function(error, visible) {
            expect(error).to.equal(null);
            expect(visible).to.equal(true);
            done();
          });
      });

      // First create empty region above all regions in which we are going to put elements. This is crucial for
      // operating on elements since only the first element from selector will be used for testing.
      it('should enter edit background mode', function(done) {
        client
          .moveToObject('.upfront-region-container') // this gives hover effect so use it when you need to show commands before clicking on them
          .click('.upfront-region-edit-trigger')
          .isVisible('.upfront-icon-region-bg-setting', function(error, visible) {
            expect(error).to.equal(null);
            expect(visible).to.equal(true);
            done();
          });
      });

      it('should create new region above', function(done) {
        client
          .click('.upfront-icon-region-add-top')
          // .click('.upfront-region-finish-edit') // this does not work, don't know why :/
          .click('#parlor-slider-about-wrapper') // to finish region edit
          .isVisible(testRegion, function(error, visible) {
            expect(error).to.equal(null);
            expect(visible).to.equal(true);
            done();
          });
      });
    });

    describe('Text element', function() {
      it('should be in draggable elements', function(done) {
        client
          .isVisible('.upfront-icon-element-text', function(error, visible) {
            expect(error).to.equal(null);
            expect(visible).to.equal(true);
            done();
          });
      });

      it('should drag and drop on region', function(done) {
        client
          .wait(1) // add this for phantomjs to work, it seems it's too fast for it's own good
          .uDragAndDrop('.upfront-icon-element-text', testRegion, function(error, result) {
            expect(error).to.equal(null);
          })
          .isVisible(testRegion + ' .upfront-plain_txt', function(error, visible) {
            expect(error).to.equal(null);
            expect(visible).to.equal(true);
            done();
          });
      });

      it('should have default text', function(done) {
        client
          .getText(testRegion + ' .upfront-plain_txt', function(error, text) {
            expect(error).to.equal(null);
            expect(text).to.have.string('My awesome stub content goes here');
            done();
          });
      });

      it('should be editable', function(done) {
        client
          .doubleClick('.upfront-plain_txt p')
          .clearElement('.upfront-plain_txt p')
          .doubleClick('.upfront-plain_txt p')
          .keys('New Text!')
          .click('#parlor-slider-about-wrapper') // to loose focus from element and close redactor
          .getText(testRegion + ' .upfront-plain_txt', function(error, text) {
            expect(error).to.equal(null);
            expect(text).to.equals('New Text!');
            done();
          });
      });

      it('should be able to contain images', function(done) {
        client
          .doubleClick('.upfront-plain_txt p')
          .uMoveToObject('.upfront-plain_txt p') // Gotta hover for phantomjs to show image attachment bits
          .wait(1) // For Firefox
          .click('.upfront-image-attachment-bits')
          .waitFor('.upfront-media_collection', 500) // allow gallery to load up to 500ms
          .click('.upfront-media_collection .upfront-media_item .thumbnail') // select first image
          .click('.use') // click "OK" button
          .click('#parlor-slider-about-wrapper') // to loose focus from element and close redactor
          .isVisible('.upfront-plain_txt .upfront-inserted_image-wrapper', function(error, visible) {
            expect(error).to.equal(null);
            done();
          });
      });

      it('should be deletable', function(done) {
        client
          .moveToObject(testRegion + ' .upfront-plain_txt') // hover element to cause delete button to show
          .click(testRegion + ' .upfront-entity-delete_trigger')
          .isVisible(testRegion + ' .upfront-plain_txt', function(error, visible) {
            if (client.options.desiredCapabilities.browserName === 'phantomjs') {
              expect(error.type).to.equal('UnknownError'); // there is no method to check if element exists on page so...
            } else {
              expect(error.type).to.equal('NoSuchElement'); // there is no method to check if element exists on page so...
            }
            done();
          });
      });
    });

    describe('Image element', function() {
      it('should be in draggable elements', function(done) {
        client
          .isVisible('.upfront-icon-element-image', function(error, result) {
            expect(error).to.equal(null);
            expect(result).to.equal(true);
            done();
          });
      });

      it('should drag and drop on region', function(done) {
        client
          .uDragAndDrop('.upfront-icon-element-image', testRegion)
          .isVisible(testRegion + ' .upfront-image', function(error, visible) {
            expect(error).to.equal(null);
            expect(visible).to.equal(true);
            done();
          });
      });

      it('should be deletable', function(done) {
        client
          .moveToObject(testRegion + ' .upfront-image') // hover element to cause delete button to show
          .click(testRegion + ' .upfront-entity-delete_trigger')
          .isVisible(testRegion + ' .upfront-image', function(error, visible) {
            if (client.options.desiredCapabilities.browserName === 'phantomjs') {
              expect(error.type).to.equal('UnknownError'); // there is no method to check if element exists on page so...
            } else {
              expect(error.type).to.equal('NoSuchElement'); // there is no method to check if element exists on page so...
            }
            done();
          });
      });
    });

    describe('Gallery element', function() {
      it('should be in draggable elements', function(done) {
        client
          .isVisible('.upfront-icon-element-image', function(error, result) {
            expect(error).to.equal(null);
            expect(result).to.equal(true);
            done();
          });
      });

      it('should drag and drop into region', function(done) {
        client
          .uDragAndDrop('.upfront-icon-element-gallery', testRegion)
          .isVisible(testRegion + ' .upfront-gallery', function(error, visible) {
            expect(error).to.equal(null);
            expect(visible).to.equal(true);
            done();
          });
      });

      it('should do something');
    });

    after(function(done) {
      client.end();
      done();
    });
});
