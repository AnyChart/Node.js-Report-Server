#!/usr/bin/env node
var gc = require("js-gc");
var jsdom = require('jsdom').jsdom;
// var opentype = require('opentype.js');
// var cp = require('child_process');
// var defaultFontsDir = __dirname + '/node_modules/anychart-nodejs/fonts';
// var defaultBounds = {left: 0, top: 0, width: 1024, height: 768};

// var sizeof = require('object-sizeof');
// var vm = require('vm2');


var rootDoc = jsdom('<body><div id="container"></div></body>');
var window = rootDoc.defaultView;
var anychart = require('../ACDVF/out/anychart-bundle.min.js')(window);
// var anychart_nodejs = require('../AnyChart-NodeJS')(anychart);

var fs = require('fs');
var fonts = {};
function anychartify(doc) {
  doc.createElementNS = function(ns, tagName) {
    var elem = doc.createElement(tagName);
    elem.getBBox = function() {
      // var text = elem.textContent;
      // var fontSize = parseFloat(elem.getAttribute('font-size'));
      // var fontFamily = elem.getAttribute('font-family');
      // if (fontFamily) fontFamily = fontFamily.toLowerCase();
      // var fontWeight = elem.getAttribute('font-weight');
      // if (fontWeight) fontWeight = fontWeight.toLowerCase();
      // var fontStyle = elem.getAttribute('font-style');
      // if (fontStyle) fontStyle = fontStyle.toLowerCase();
      //
      // var fontsArr = fontFamily.split(', ');
      //
      // var font;
      // for (var i = 0, len = fontsArr.length; i < len; i++) {
      //   var name = fontsArr[i] + (fontWeight == 'normal' || !isNaN(+fontWeight) ? '' : ' ' + fontWeight) + (fontStyle == 'normal' ? '' : ' ' + fontStyle);
      //   if (font = fonts[name])
      //     break;
      // }
      //
      // if (!font)
      //   font = fonts['verdana'];
      //
      // var scale = 1 / font.unitsPerEm * fontSize;
      //
      // var top = -font.ascender * scale;
      // var height = Math.abs(top) + Math.abs(font.descender * scale);
      //
      // var width = 0;

      // font.forEachGlyph(text, 0, 0, fontSize, undefined, function(glyph, x, y, fontSize, options) {
      //   var metrics = glyph.getMetrics();
      //   metrics.xMin *= scale;
      //   metrics.xMax *= scale;
      //   metrics.leftSideBearing *= scale;
      //   metrics.rightSideBearing *= scale;
      //
      //   width += Math.abs(metrics.xMax - metrics.xMin) + metrics.leftSideBearing + metrics.rightSideBearing
      // });

      return {x: 0, y: 0, width: 10, height: 10};
    };
    return elem;
  };
}
// function loadDefaultFontsSync() {
//   var fontFilesList = fs.readdirSync(defaultFontsDir);
//
//   for (var i = 0, len = fontFilesList.length; i < len; i++) {
//     var fileName = fontFilesList[i];
//     var font = opentype.loadSync(defaultFontsDir + '/' + fileName);
//     fonts[font.names.fullName.en.toLowerCase()] = font;
//   }
//
//   return fonts;
// }

var data = '{"chart":{"enabled":true,"credits":{"text":"AnyChart","url":"https://www.anychart.com/?utm_source=registered","alt":"AnyChart - JavaScript Charts designed to be embedded and integrated","imgAlt":"AnyChart - JavaScript Charts","logoSrc":"https://static.anychart.com/logo.png","enabled":true},"xScale":0,"yScale":1,"series":[{"enabled":true,"seriesType":"line","data":[1,2,3],"xScale":0,"yScale":1}],"type":"cartesian"}}';

// loadDefaultFontsSync();
anychartify(rootDoc);
anychart.global(window);

// var params = {
//   type: 'png',
//   dataType: 'json',
//   containerId: 'container',
//   document: rootDoc
// };

var chartCount = 3000;
var cur = 0;


// var inertval = setInterval(function() {
  // var chartRenderer = cp.fork('./renderChart.js', []);
  // chartRenderer.send({data: data});

  // var rootDoc = jsdom('<body><div id="container"></div></body>');
  // var window = rootDoc.defaultView;
  // window.anychart = anychart;
  // window.acgraph = anychart.graphics;
  // window.isNodeJS = true;
  // window.defaultBounds = defaultBounds;
  // anychart.global(window);
  // anychartify(rootDoc);
  //
  // var script = new vm.VM({
  //   timeout: 5000,
  //   sandbox: {anychart: anychart, data: data}
  // });
  // script.run('  var target = anychart.fromJson(data);\n' +
  //     '  target.container(\'container\').draw();\n' +
  //     '  target.dispose();');


for (var i = 0, len = 5000; i < len; i++) {
  var target = anychart.fromJson(data);
  target.container('container').draw();
  target.dispose();
  gc();


  for (var j = 0; j < 5000; j++) {
    window.clearInterval(j);
    window.clearTimeout(j);
    clearInterval(j);
    clearTimeout(j);
  }

  console.log(i);
}

  // chartRenderer.on('message', function(m) {
  //   chartRenderer.kill();
  //   if (cur > chartCount) {
  //     clearInterval(inertval);
  //     console.log('interval cleared');
  //   } else {
  //     cur++;
  //     console.log(cur);
  //   }
  // });
// }, 1);



setInterval(function() {

}, 2000);
                                                         