/* globals casper */
// Based on https://github.com/Huddle/PhantomCSS/blob/master/demo/testsuite.js
var phantomcss = require('phantomcss');
var fs = require('fs');
var port = casper.cli.options.PORT || 8080;
var url = 'http://localhost:' + port;
function timeout (val) {
  return val * 2.5;
}

function pathJoin (/* args */) {
  return [].slice.call(arguments).join('/');
}

casper.test.begin('UIComponents visual regresion testing', function (test) {
  phantomcss.init({
    rebase: casper.cli.get('rebase'),
    casper: casper,
    screenshotRoot: pathJoin(fs.workingDirectory, 'screenshots'),
    libraryRoot: pathJoin(fs.workingDirectory, 'node_modules', 'phantomcss'),
    failedComparisonsRoot: pathJoin(fs.workingDirectory, 'failures')
  });

  casper.on('remote.message', function (msg) {
    this.echo(msg);
  });

  casper.on('error', function (err) {
    this.die('PhantomJS has errored: ' + err);
  });

  casper.on('resource.error', function (err) {
    casper.log('Resource load error: ' + err, 'warning');
  });

  casper.start();

  [
    {
      url: url + '/page1.html',
      name: 'page1'
    },
    {
      url: url + '/page2.html',
      name: 'page2',
      click: '.my-div a'
    }
  ].map(function (address) {

    console.log('Opening', address.name);

    casper.thenOpen(address.url);

    casper.then(function () {
      casper.viewport(1280, 768);
      casper.wait(timeout(3000));
    });

    if (address.click) {
      casper.thenClick(address.click, function () {
        casper.wait(timeout(1000));
      });
    }

    if (address.actions) {
      processActions(address.actions);
    }

    doScreenshots('large', address.name);

    casper.then(function () {
      casper.viewport(480, 640);
    });

    doScreenshots('small', address.name);

    casper.then(function () {
      casper.viewport(800, 480);
    });

    doScreenshots('medium', address.name);

  });

  casper.then(function compareScreenshots () {
    phantomcss.compareAll();
  });

  casper.run(function () {
    console.log('The End');
    casper.test.done();
  });

  function processActions (actions) {
    function doAction (type, action) {
      if (type === 'click') {
        casper.thenClick(action.selector, function () {
          casper.wait(timeout(1500));
        });
        return;
      }

      if (type === 'fill') {
        casper.then(function () {
          this.fillSelectors(action.form, action.inputs);
          casper.wait(timeout(1500));
        });
        return;
      }
      throw new Error('Unknown action: ' + type);
    }
    actions.map(function (action) {
      var type = action.action;
      doAction(type, action);
    });
  }

  function doScreenshots (mode, name) {
    casper.then(function () {
      var selector = 'body';
      phantomcss.screenshot(selector, ['ss', name, mode].join('-'));
    });
  }

});
