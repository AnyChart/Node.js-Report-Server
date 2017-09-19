var jsdom = require('jsdom').jsdom;
var opentype = require('opentype.js');
var defaultFontsDir = __dirname + '/node_modules/anychart-nodejs/fonts';
var defaultBounds = {left: 0, top: 0, width: 1024, height: 768};

var rootDoc = jsdom('<body><div id="container"></div></body>');
var window = rootDoc.defaultView;
// var anychart = require('../ACDVF/out/anychart-bundle.min.js')(window);
window.defaultBounds = defaultBounds;
// var anychart_nodejs = require('../AnyChart-NodeJS')(anychart);

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

      return {x: 0, y: top, width: width, height: height};
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

loadDefaultFontsSync();
anychartify(rootDoc);
// anychart.global(window);

process.on('message', function(m) {
  var data = m.data;

  console.log('!!!');

  // var target = anychart.fromJson(data);
  // target.container('container').draw();
  // target.dispose();

  // anychart_nodejs.exportTo(data, params, function(err, data) {
  //   if (cur > chartCount) {
  //     clearInterval(inertval);
  //     console.log('interval cleared');
  //   } else {
  //     cur++;
  //     console.log(cur, err, data);
  //   }
  // });
  process.send({status: 'ok'});
});