var fs = require('fs');

var PATTERN = /([a-z]+)-([a-z]+)_[0-9]+\.?([a-z]+)?\.png/;
var PATH = './screenshots';
var FAILURES_PATH = './failures';

var files = fs.readdirSync(PATH);

var groups = analyzeFiles(PATH, files, {});

try {
  var failures = fs.readdirSync(FAILURES_PATH);
  groups = analyzeFiles(FAILURES_PATH, failures, groups);
} catch (e) {
  console.warn('Skipping failures', e);
}

var children = Object.keys(groups).map(function (group) {
  var groupData = groups[group];
  var sizeResults = Object.keys(groupData).map(function (size) {
    var sshots = groupData[size];
    var diff = '';
    if (sshots.fail) {
      diff = tag('div', {
        class: 'col-sm-12'
      }, [
        '<p>Failure:</p>',
        screenshot(sshots.fail)
      ]);
    }

    return tag('div', {}, [
      tag('div', {
        class: 'col-sm-12'
      }, [
        tag('h3', {}, [
          size
        ])
      ]),
      tag('div', {
        class: 'col-sm-6'
      }, [
        '<p>Expected</p>',
        screenshot(sshots.normal)
      ]),
      tag('div', {
        class: 'col-sm-6'
      }, [
        '<p>Got</p>',
        sshots.diff ? screenshot(sshots.diff) : 'No tests run'
      ]),
      diff
    ]);
  });

  return tag('div', {
    class: 'row'
  }, [
    tag('div', {
      class: 'col-sm-12'
    }, [
      tag('h2', {}, [
        group
      ])
    ].concat(sizeResults))
  ]);
});

fs.writeFileSync('index.html', tag(
  'html', {}, [
    tag('head', {}, [
      tag('meta', {
        charset: 'utf-8'
      }),
      tag('meta', {
        name: 'viewport',
        content: 'width=device-width'
      }),
      tag('title', {}, [
        'Visual Regression Results'
      ]),
      tag('link', {
        rel: 'stylesheet',
        href: 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css'
      })
    ]),
    tag('body', {}, [
      tag('div', {
        class: 'container'
      }, [
        tag('h1', {}, [
          'Visual Regression Test Results'
        ])
      ].concat(children))
    ])
  ])
);

function analyzeFiles (path, files, start) {
  return files.reduce(function (memo, fileName) {
    var parts = PATTERN.exec(fileName);
    if (!parts) {
      console.warn('Unknown file: ' + fileName);
      return memo;
    }
    var type = parts[1];
    var size = parts[2];
    var version = parts[3] || 'normal';

    memo[type] = memo[type] || {};
    memo[type][size] = memo[type][size] || {};
    memo[type][size][version] = path + '/' + fileName;

    return memo;
  }, start);
}

function screenshot (fileName) {
  return tag('a', {
    href: fileName
  }, [
    tag('img', {
      class: 'img-responsive',
      src: fileName,
      alt: fileName
    })
  ]);
}

function tag (name, args, children) {
  var INDENT = '\n  ';
  var attrs = argsToAttributes(args);
  if (children) {
    return '<' + name + attrs + '>' + INDENT + children.map(function (child) {
      return child.replace(/\n/gm, INDENT);
    }).join(INDENT) + '\n</' + name + '>';
  }
  return '<' + name + attrs + ' />';
}

function argsToAttributes (args) {
  var attrs = Object.keys(args).map(function (key) {
    return key + '="' + args[key] + '"';
  }).join(' ');
  return attrs.length ? ' ' + attrs : '';
}

