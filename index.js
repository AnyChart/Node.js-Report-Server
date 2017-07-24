#!/usr/bin/env node

var express = require('express');
var bodyParser = require('body-parser');
var program = require('commander');
var uuidv4 = require('uuid/v4');
var fs = require('fs');
var vm = require('vm2');
var jsdom = require('jsdom').jsdom;
var DOMParser = require('xmldom').DOMParser;
var XMLparser = new DOMParser();
var csv = require('csv');
var xlsx = require('xlsx');
var path = require('path');

program
    .version('0.0.1')
    .option('-p, --port [value]', 'TCP port of server ', 3000)
    .option('-od, --output-dir [value]', 'Output directory', 'shared')
    .option('-as, --allow-scripts-executing [value]', 'Whether allow script execution', false);

program.parse(process.argv);

var rootDoc = jsdom('<body></body>');
var window = rootDoc.defaultView;
var iframeDoc = null;
var iframes = {};
var vectorImageParams = ['background', 'border', 'blur', 'contrast', 'crop', 'frame', 'gamma', 'monochrome', 'negative', 'noise', 'quality'];

console.time('anychart init');
var anychart = require('anychart')(window);
// var anychart = require('../ACDVF/out/anychart-bundle.min.js')(window);
var anychart_nodejs = require('anychart-nodejs')(anychart);
// var anychart_nodejs = require('../AnyChart-NodeJS')(anychart);
console.timeEnd('anychart init');

var pdfMake = require('pdfmake');
var fontDescriptors = {
  Roboto: {
    normal: path.join(__dirname, 'fonts', 'Roboto-Regular.ttf'),
    bold: path.join(__dirname, 'fonts', 'Roboto-Medium.ttf'),
    italics: path.join(__dirname, 'fonts', 'Roboto-Italic.ttf'),
    bolditalics: path.join(__dirname, 'fonts', 'Roboto-Italic.ttf')
  }
};
var printer = new pdfMake(fontDescriptors);

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({parameterLimit: 100000, limit: '50mb', extended: true}));
app.use(express.static(path.join(__dirname, 'example')));

function partial(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = args.slice();
    newArgs.push.apply(newArgs, arguments);
    return fn.apply(this, newArgs);
  };
}

function applyImageParams(params, chartSettings) {
  for (var i = 0, len = vectorImageParams.length; i < len; i++) {
    var paramName = vectorImageParams[i];
    var value = chartSettings[paramName];
    if (value)
      params[paramName] = value
  }
}

function recursiveTraverse(obj, func) {
  if (Object.prototype.toString.call(obj) === '[object Array]') {
    for (var i = 0; i < obj.length; i++) {
      if (i in obj)
        recursiveTraverse(obj[i], func);
    }
  } else if (typeof obj === 'object') {
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (key === 'chart') {
          func(obj, key)
        } else {
          recursiveTraverse(obj[key], func)
        }
      }
    }
  }
}

function createSandbox(containerTd) {
  // console.time('sandbox creating');

  var iframeId = 'iframe_' + uuidv4();
  var iframe = rootDoc.createElement('iframe');
  iframes[iframeId] = iframe;
  iframe.setAttribute('id', iframeId);
  rootDoc.body.appendChild(iframe);
  iframeDoc = iframe.contentDocument;
  var div = iframeDoc.createElement('div');
  div.setAttribute('id', containerTd);
  iframeDoc.documentElement.appendChild(div);
  var window = iframeDoc.defaultView;
  window.isNodeJS = true;
  window.anychart = anychart;
  window.acgraph = anychart.graphics;
  anychart.global(window);

  // console.timeEnd('sandbox creating');

  return iframeId;
}

function clearSandbox(iframeId) {
  // console.time('clear sandbox');
  rootDoc.body.removeChild(rootDoc.getElementById(iframeId));
  // console.timeEnd('clear sandbox');
}

function convertCharts(obj, callback) {
  var chartsToConvert = 0;

  recursiveTraverse(obj, function(o, key) {
    var ch = o[key];
    var data = ch.data;
    var dataType = ch.dataType;
    var containerId = ch.containerId || 'container';

    var chart = getChartData(data, dataType);
    if (chart) {
      var iframeId = createSandbox(containerId);
      if (dataType !== 'svg' && dataType !== 'javascript') {
        chart.container(containerId);
      }

      chartsToConvert++;
      console.log('----> PDF Report. Chart ' + chartsToConvert + ' exporting.', iframeId);
      var imgConvertCallback = partial(function imgConvertCallback(id, chartNum, err, data) {
        clearSandbox(id);
        console.log('<---- PDF Report. Chart ' + chartNum + ' exporting.', id);

        if (data) {
          o.image = 'data:image/png;base64,' + data.toString('base64');
        } else {
          o.image = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
          console.warn('Something went wrong. Image wasn\'t generate');
        }

        delete o[key];
        chartsToConvert--;
        if (chartsToConvert === 0) {
          callback(obj)
        }
      }, iframeId, chartsToConvert);

      var params = {type: 'png', document: iframeDoc, containerId: containerId, iframeId: iframeId};
      applyImageParams(params, ch);
      anychart_nodejs.exportTo(chart, params, imgConvertCallback);
    }
  });

  if (chartsToConvert === 0) {
    callback(obj)
  }
}

function getContentType(type) {
  var contentType;
  switch (type) {
    case 'png':
      contentType = 'image/png';
      break;
    case 'jpg':
      contentType = 'image/jpg';
      break;
    case 'tiff':
      contentType = 'image/tiff';
      break;
    case 'svg':
      contentType = 'image/svf+xm;';
      break;
    case 'pdf':
      contentType = 'application/pdf';
      break;
    case 'ps':
      contentType = 'application/postscript';
      break;
    case 'xlsx':
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      break;
    case 'csv':
      contentType = 'text/csv';
      break;
    default:
      contentType = 'text/plain'
  }
  return contentType;
}

function getChartData(data, type) {
  var chart = null;
  switch (type) {
    case 'json':
      chart = anychart.fromJson(data);
      break;
    case 'xml':
      chart = anychart.fromXml(XMLparser.parseFromString(data));
      break;
    case 'svg':
      chart = data;
      break;
    case 'javascript':
      if (program.allowScriptsExecuting) {
        chart = data;
      }
      break;
  }

  return chart;
}

function sendResult(req, res, data, fileType) {
  var autoFileName = 'anychart_' + uuidv4() + '.' + fileType;
  var responseType = req.body.response_type.toLowerCase() || 'file';
  var fileName = responseType === 'file' ? req.body.file_name || autoFileName : autoFileName;

  if (responseType === 'file') {
    res.writeHead(200, {
      'Content-Type': getContentType(fileType),
      'Content-Length': data.length,
      'Content-Disposition': 'attachment; filename=' + fileName
    });

    res.end(data);
  } else if (responseType === 'base64') {
    var base64Data = data.toString('base64');
    var result = {data: base64Data};

    res.send(JSON.stringify(result));
  } else if (responseType === 'url') {
    var path = program.outputDir + '/' + autoFileName;
    fs.access(program.outputDir, fs.constants.F_OK | fs.constants.R_OK | fs.constants.W_OK, function(err) {
      if (err) {
        if (err.code === 'ENOENT') {
          fs.mkdirSync(program.outputDir);
          console.log('Directory ' + program.outputDir + ' was created.');
        } else {
          console.warn(err.message);
          return;
        }
      }

      fs.writeFile(path, data, function(err) {
        if (err) {
          console.warn(err.message);
        } else {
          console.log('Written to file ' + path);
          res.send(JSON.stringify({'url': path}));
        }
      });
    });
  }
}

function generateOutput(req, res) {
  var dataType = req.body.data_type.toLowerCase();
  var fileType = req.body.file_type.toLowerCase() || 'png';
  var data = req.body.data;
  var containerId = req.body.containerId || 'container';

  var chart = getChartData(data, dataType);
  if (chart) {
    var iframeId = createSandbox(containerId);
    if (dataType !== 'svg' && dataType !== 'javascript') {
      chart.container(containerId);
    }

    console.log('----> Input. Convert ' + dataType.toUpperCase() + ' to ' + fileType.toUpperCase() + '. Image.', iframeId);
    var imgConvertCallback = partial(function imgConvertCallback(id, fileType, dataType, err, data) {
      console.log('<---- Output. Convert ' + dataType.toUpperCase() + ' to ' + fileType.toUpperCase() + '. Image.', id);
      if (err)
        console.warn('Error. Output. Convert ' + dataType.toUpperCase() + ' to ' + fileType.toUpperCase() + '.', err.message.trim(), id);

      if (!data || err) {
        res.writeHead(500);
        res.send();
      } else {
        sendResult(req, res, data, fileType);
      }
      clearSandbox(iframeId);
    }, iframeId, fileType, dataType);

    var params = {type: fileType, document: iframeDoc, containerId: containerId, iframeId: iframeId};
    applyImageParams(params, req.body);
    anychart_nodejs.exportTo(chart, params, imgConvertCallback);
  } else {
    res.send('');
  }
}

app.post('/pdf-report', function (req, res) {
  req.body.file_type = 'pdf';
  var script = new vm.VM();
  var data = script.run(req.body.data);
  var fileType = 'pdf';

  convertCharts(data, function(dd) {
    try {
      var pdfDoc = printer.createPdfKitDocument(dd);
      var chunks = [];

      pdfDoc.on('data', function(chunk) {
        chunks.push(chunk);
      });
      pdfDoc.on('end', function() {
        sendResult(req, res, Buffer.concat(chunks), fileType);
      });
      pdfDoc.on('error', function(e) {
        console.warn(e.message)
      });
      pdfDoc.end();
    } catch (e) {
      sendResult(req, res, '', fileType);
    }
  });
});

app.post('/vector-image', function (req, res) {
  try {
    generateOutput(req, res);
  } catch (e) {
    console.warn(e.message);
  }
});

app.post('/raster-image', function (req, res) {
  try {
    generateOutput(req, res);
  } catch (e) {
    console.warn(e.message);
  }
});

app.post('/data-file', function (req, res) {
  var data = req.body.data;
  var fileType = req.body.file_type.toLowerCase() || 'xlsx';

  var outputData;
  if (fileType === 'xlsx') {
    csv.parse(data, function(err, data) {
      outputData = xlsx.utils.aoa_to_sheet(data);
    })
  } else if (fileType === 'csv') {
    outputData = data;
  }

  sendResult(req, res, outputData, fileType)
});

app.get('/status', function (req, res) {
  res.send('ok');
});

app.listen(program.port, function () {
  console.log('Export server listening on port ' + program.port + '!')
});

module.exports = app;


