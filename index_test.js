#!/usr/bin/env node
var jsdom = require('jsdom').jsdom;
var opentype = require('opentype.js');
var defaultFontsDir = __dirname + '/node_modules/anychart-nodejs/fonts';
var defaultBounds = {left: 0, top: 0, width: 1024, height: 768};

var rootDoc = jsdom('<body><div id="container"></div></body>');
var window = rootDoc.defaultView;
var anychart = require('../ACDVF/out/anychart-bundle.min.js')(window);
// var anychart_nodejs = require('../AnyChart-NodeJS')(anychart);

window.anychart = anychart;
window.isNodeJS = true;
window.defaultBounds = defaultBounds;

// window.setTimeout = function(code,delay,arguments) {
//   debugger
//   console.log('setTimeout', code, delay, arguments);
// };
//
// window.setInterval = function(code,delay,arguments) {
//   console.log('setInterval', code, delay, arguments);
// };

var fs = require('fs');
var fonts = {};
function anychartify(doc) {
  doc.createElementNS = function(ns, tagName) {
    var elem = doc.createElement(tagName);
    elem.getBBox = function() {
      var text = elem.textContent;
      var fontSize = parseFloat(elem.getAttribute('font-size'));
      var fontFamily = elem.getAttribute('font-family');
      if (fontFamily) fontFamily = fontFamily.toLowerCase();
      var fontWeight = elem.getAttribute('font-weight');
      if (fontWeight) fontWeight = fontWeight.toLowerCase();
      var fontStyle = elem.getAttribute('font-style');
      if (fontStyle) fontStyle = fontStyle.toLowerCase();

      var fontsArr = fontFamily.split(', ');

      var font;
      for (var i = 0, len = fontsArr.length; i < len; i++) {
        var name = fontsArr[i] + (fontWeight == 'normal' || !isNaN(+fontWeight) ? '' : ' ' + fontWeight) + (fontStyle == 'normal' ? '' : ' ' + fontStyle);
        if (font = fonts[name])
          break;
      }

      if (!font)
        font = fonts['verdana'];

      var scale = 1 / font.unitsPerEm * fontSize;

      var top = -font.ascender * scale;
      var height = Math.abs(top) + Math.abs(font.descender * scale);

      var width = 0;

      font.forEachGlyph(text, 0, 0, fontSize, undefined, function(glyph, x, y, fontSize, options) {
        var metrics = glyph.getMetrics();
        metrics.xMin *= scale;
        metrics.xMax *= scale;
        metrics.leftSideBearing *= scale;
        metrics.rightSideBearing *= scale;

        width += Math.abs(metrics.xMax - metrics.xMin) + metrics.leftSideBearing + metrics.rightSideBearing
      });

      return {x: 0, y: 0, width: width, height: height};
    };
    return elem;
  };
}
function loadDefaultFontsSync() {
  var fontFilesList = fs.readdirSync(defaultFontsDir);

  for (var i = 0, len = fontFilesList.length; i < len; i++) {
    var fileName = fontFilesList[i];
    var font = opentype.loadSync(defaultFontsDir + '/' + fileName);
    fonts[font.names.fullName.en.toLowerCase()] = font;
  }

  return fonts;
}

var data = '{"chart":{"enabled":true,"credits":{"text":"AnyChart","url":"https://www.anychart.com/?utm_source=registered","alt":"AnyChart - JavaScript Charts designed to be embedded and integrated","imgAlt":"AnyChart - JavaScript Charts","logoSrc":"https://static.anychart.com/logo.png","enabled":true},"xScale":0,"yScale":1,"series":[{"enabled":true,"seriesType":"line","data":[1,2,3],"xScale":0,"yScale":1}],"type":"cartesian"}}';

loadDefaultFontsSync();
anychartify(rootDoc);
anychart.global(window);

var params = {
  type: 'png',
  dataType: 'json',
  containerId: 'container',
  document: rootDoc
};

var chartCount = 3000;
var cur = 0;


// var inertval = setInterval(function() {
  // var target = anychart.fromJson(data);
  // target.container('container').draw();
  // target.dispose();

//   anychart_nodejs.exportTo(data, params, function(err, data) {
//     if (cur > chartCount) {
//       clearInterval(inertval);
//       console.log('interval cleared');
//     } else {
//       cur++;
//       console.log(cur);
//     }
//   });
// }, 1);
function getData() {
  return [{
    x: 'A',
    name: 'Data Science',
    value: 100,
    stroke: 'none',
    label: {
      fontColor: '#3b8ad8',
      fontSize: 14
    }
  }, {
    x: 'B',
    name: 'Computer Science',
    value: 25
  }, {
    x: 'C',
    name: 'Math and Statistics',
    value: 25
  }, {
    x: 'D',
    name: 'Subject Matter Expertise',
    value: 25
  }, {
    x: ['A', 'B'],
    name: 'Computer Science',
    value: 50
  }, {
    x: ['A', 'C'],
    name: 'Math and Statistics',
    value: 50
  }, {
    x: ['A', 'D'],
    name: 'Subject Matter Expertise',
    value: 50
  },

    {
      x: ['B', 'C'],
      name: 'Machine\nLearning',
      value: 5
    }, {
      x: ['C', 'D'],
      name: 'Traditional\nResearch',
      value: 5
    }, {
      x: ['D', 'B'],
      name: 'Traditional\nSoftware',
      value: 5
    }, {
      x: ['B', 'C', 'D'],
      name: 'Unicorn',
      value: 5
    }];
}

anychart.onDocumentReady(function () {
  var data = getData();

  // create venn diagram
  var chart = anychart.venn(data);

  // set chart stroke
  chart.stroke('2 #fff');

  // set labels settings
  chart.labels().format('{%Name}');

  // set font color for hover intersections labels
  chart.intersections().hoverFill('black 0.25');

  // set intersections labels settings
  chart.intersections().labels()
      .fontWeight('bold')
      .format('{%Name}');

  // set legend settings
  chart.legend()
      .position('right')
      .itemsLayout('vertical')
      .padding({left: 35});

  // set tooltip settings
  chart.tooltip().titleFormat('{%Name}');

  // set container id for the chart
  chart.container('container');
  // initiate chart drawing
  chart.draw();

  console.log(rootDoc.body.innerHTML);
});





// for (var i = 0, len = 5000; i < len; i++) {
//   var target = anychart.fromJson(data);
//   target.container('container').draw();
//   target.dispose();
//
//   console.log(i);
// }
