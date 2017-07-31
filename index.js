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
var winston = require('winston');
var winstonDRF = require('winston-daily-rotate-file');

program
    .version('1.0.0')
    .option('-p, --port [value]', 'TCP port of server ', 3000)
    .option('-o, --output-dir [value]', 'Output directory', 'shared')
    .option('-d, --disable-scripts-executing [value]', 'Whether script execution disabled', false)
    .option('--log-level [value]', 'Level of logging. Possible values: error, warn, info, verbose, debug, silly', 'info')
    .option('--disable-playground [value]', 'Disable playground app.', false);

program.parse(process.argv);

function tsFormat() {return (new Date()).toLocaleTimeString()}


var logLevel = program.logLevel;
var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      timestamp: tsFormat,
      level: logLevel,
      colorize: true
    }),
    new (winstonDRF)({
      name: 'all',
      timestamp: tsFormat,
      datePattern: 'yyyy-MM-dd',
      prepend: true,
      filename: path.join(__dirname, 'logs', '-all.log'),
      level: logLevel
    }),
    new (winstonDRF)({
      name: 'error-file',
      timestamp: tsFormat,
      datePattern: 'yyyy-MM-dd',
      prepend: true,
      filename: path.join(__dirname, 'logs', '-error.log'),
      level: 'error'
    })
  ]
});
logger.cli();
winston.addColors({error: 'red', warn: 'yellow', info: 'blue', verbose: 'grey', debug: 'black', silly: 'white'});
logger.verbose('log level:', logLevel);

var blankImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
var rootDoc = jsdom('<body></body>');
var window = rootDoc.defaultView;
var iframeDoc = null;
var iframes = {};
var allowableImageParams = ['aspect-ratio', 'height', 'width', 'background', 'border', 'blur', 'contrast', 'crop', 'frame', 'gamma', 'monochrome', 'negative', 'noise', 'quality'];

// console.time('anychart init');
var anychart = require('anychart')(window);
// var anychart = require('../ACDVF/out/anychart-bundle.min.js')(window);
// var anychart_nodejs = require('anychart-nodejs')(anychart);
var anychart_nodejs = require('../AnyChart-NodeJS')(anychart);
// console.timeEnd('anychart init');

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

function partial(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = args.slice();
    newArgs.push.apply(newArgs, arguments);
    return fn.apply(this, newArgs);
  };
}

function applyImageParams(params, chartSettings) {
  for (var i = 0, len = allowableImageParams.length; i < len; i++) {
    var paramName = allowableImageParams[i];
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
          func(obj)
        } else {
          recursiveTraverse(obj[key], func)
        }
      }
    }
  }
}

function createSandbox(containerTd) {
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

  return iframeId;
}

function clearSandbox(iframeId) {
  // console.time('clear sandbox');
  rootDoc.body.removeChild(rootDoc.getElementById(iframeId));
  // console.timeEnd('clear sandbox');
}

function convertCharts(obj, callback) {
  var charts = [];

  recursiveTraverse(obj, function(config) {
    charts.push(config)
  });
  var chartsToConvert = charts.length;

  var handler = function(config, index) {
    var key = 'chart';
    var chartConfig = config[key];
    var data = chartConfig.data;
    var dataType = chartConfig.dataType;
    var containerId = chartConfig.containerId || 'container';

    var chart = getChartData(data, dataType);
    if (chart) {
      var iframeId = createSandbox(containerId);
      if (dataType !== 'svg' && dataType !== 'javascript') {
        chart.container(containerId);
      }

      logger.info('----> PDF Report. Chart ' + index + ' exporting.');
      var imgConvertCallback = partial(function imgConvertCallback(id, chartNum, err, data) {
        clearSandbox(id);
        logger.info('<---- PDF Report. Chart ' + chartNum + ' exporting.');
        if (data) {
          config.image = 'data:image/png;base64,' + data.toString('base64');
        } else {
          config.image = blankImage;
          logger.warn('Image wasn\'t generated. Chart was replaced with blank Image. Error: ', err);
        }

        delete config[key];
        chartsToConvert--;
        if (chartsToConvert === 0) {
          callback(obj)
        }
      }, iframeId, index);

      var params = {type: 'png', document: iframeDoc, containerId: containerId, iframeId: iframeId};
      applyImageParams(params, chartConfig);
      anychart_nodejs.exportTo(chart, params, imgConvertCallback);
    } else {
      config.image = blankImage;
      delete config[key];
      logger.warn('Chart data not found. Chart was replaced with blank Image');
    }
  };
  
  for (var i = 0, len = charts.length; i < len; i ++) {
    handler(charts[i], i);
  }

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
    case 'json':
      contentType = 'application/json';
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
      if (!program.disableScriptsExecuting) {
        chart = data;
      } else {
        logger.warn('Script executing disabled.');
      }
      break;
  }

  return chart;
}

function sendResult(req, res, data, fileType) {
  var autoFileName = 'anychart_' + uuidv4() + '.' + fileType;
  var responseType = (req.body.response_type || 'file').toLowerCase();
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

    res.set('Content-Type', getContentType('json'));
    res.send(JSON.stringify(result));
  } else if (responseType === 'url') {
    var path = program.outputDir + '/' + autoFileName;
    fs.access(program.outputDir, fs.constants.F_OK | fs.constants.R_OK | fs.constants.W_OK, function(err) {
      if (err) {
        if (err.code === 'ENOENT') {
          fs.mkdirSync(program.outputDir);
          logger.info('Directory ' + program.outputDir + ' was created.');
        } else {
          logger.error(err.message);
          return;
        }
      }

      fs.writeFile(path, data, function(err) {
        if (err) {
          logger.error(err.message);
        } else {
          logger.info('Written to file ' + path);

          res.set('Content-Type', getContentType('json'));
          res.send(JSON.stringify({'url': path}));
        }
      });
    });
  }
}

function generateOutput(req, res) {
  var dataType = req.body.data_type && req.body.data_type.toLowerCase();
  var fileType = (req.body.file_type || 'png').toLowerCase();
  var data = req.body.data;
  var containerId = req.body.containerId || 'container';

  var chart = getChartData(data, dataType);
  if (chart) {
    var iframeId = createSandbox(containerId);
    if (dataType !== 'svg' && dataType !== 'javascript') {
      chart.container(containerId);
    }

    logger.info('----> Input. Convert %s to %s. Image.', dataType.toUpperCase(), fileType.toUpperCase());
    var imgConvertCallback = partial(function imgConvertCallback(id, fileType, dataType, err, data) {
      if (err)
        logger.error('Error. Output. Convert %s to %s. Error: %s', dataType.toUpperCase(), fileType.toUpperCase(), err.message.trim());
      else
        logger.info('<---- Output. Convert %s to %s. Image.', dataType.toUpperCase(), fileType.toUpperCase());

      if (!data || err) {
        res.status(500).send({error: err ? err.message : 'Image generation error'});
      } else {
        sendResult(req, res, data, fileType);
      }
      clearSandbox(iframeId);
    }, iframeId, fileType, dataType);

    var params = {type: fileType, document: iframeDoc, containerId: containerId, iframeId: iframeId};
    
    applyImageParams(params, req.body);
    anychart_nodejs.exportTo(chart, params, imgConvertCallback);
  } else {
    res.status(500).send({error: 'Chart data not found'});
  }
}

app.post('/pdf-report', function (req, res) {
  try {
    var script = new vm.VM();
    var data = script.run(req.body.data);
  } catch (e) {
    logger.error(e.message);
    res.status(500).send({error: e.message});
    return;
  }

  convertCharts(data, function(dd) {
    try {
      var pdfDoc = printer.createPdfKitDocument(dd);
      var chunks = [];

      pdfDoc.on('data', function(chunk) {
        chunks.push(chunk);
      });
      pdfDoc.on('end', function() {
        sendResult(req, res, Buffer.concat(chunks), 'pdf');
      });
      pdfDoc.on('error', function(e) {
        logger.error(e)
      });
      pdfDoc.end();
    } catch (e) {
      logger.error(e);
    }
  });
});

app.post('/vector-image', function (req, res) {
  try {
    if (!req.body.file_type)
      req.body.file_type = 'pdf';

    generateOutput(req, res);
  } catch (e) {
    logger.error(e.message);
  }
});

app.post('/raster-image', function (req, res) {
  try {
    generateOutput(req, res);
  } catch (e) {
    logger.error(e.message);
  }
});

app.post('/data-file', function (req, res) {
  try {
    var data = req.body.data;
    var fileType = (req.body.file_type || 'xlsx').toLowerCase();

    if (fileType === 'xlsx') {
      csv.parse(data, function(err, data) {
        var ws = xlsx.utils.aoa_to_sheet(data);
        var wb = xlsx.utils.book_new();
        wb.SheetNames.push('Sheet 1');
        wb.Sheets['Sheet 1'] = ws;
        data = xlsx.write(wb, {'type': 'buffer'});
        sendResult(req, res, data, fileType)
      })
    } else if (fileType === 'csv') {
      sendResult(req, res, data, fileType)
    }
  } catch (e) {
    logger.error(e.message);
  }
});

if (!program.disablePlayground) {
  app.use(express.static(path.join(__dirname, 'playground')));
  app.get('/playground', function(req, res) {
    res.sendFile(path.join(__dirname + '/playground/template.html'));
  });
}

app.get('/status', function (req, res) {
  res.send('ok');
});

app.listen(program.port, function () {
  logger.info('Export server listening on port ' + program.port + '!')
});

module.exports = app;


