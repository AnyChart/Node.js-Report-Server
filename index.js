#!/usr/bin/env node

var express = require('express');
var bodyParser = require('body-parser');
var program = require('commander');
var uuidv4 = require('uuid/v4');
var fs = require('fs');
var vm = require('vm2');
var jsdom = require('jsdom').jsdom;
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
    .option('--log-file [value]', 'Path to log file. File will created and will rotate by daily.', null)
    .option('--disable-playground [value]', 'Disable playground app.', false);

program.parse(process.argv);

var blankImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
var allowableImageParams = ['aspect-ratio', 'height', 'width', 'background', 'border', 'blur', 'contrast', 'crop', 'frame', 'gamma', 'monochrome', 'negative', 'noise', 'quality'];

//region --- Configure logs
function tsFormat() {return (new Date()).toLocaleTimeString()}
var logTransports = [];
var logLevel = program.logLevel;
var loggingToFile = !!program.logFile;
if (program.logFile) {
  if (!path.isAbsolute(program.logFile)) {
    program.logFile  = path.join(__dirname, program.logFile);
  }

  var logDirName = path.dirname(program.logFile);
  var logFileName = path.basename(program.logFile);
  fs.access(logDirName, fs.constants.F_OK | fs.constants.R_OK | fs.constants.W_OK, function(err) {
    if (err) {
      if (err.code === 'ENOENT') {
        fs.mkdirSync(logDirName);
      } else {
        loggingToFile = false;
      }
    }
  });

  if (loggingToFile) {
    logTransports.push(new (winstonDRF)({
      timestamp: tsFormat,
      datePattern: 'yyyy-MM-dd',
      prepend: true,
      filename: path.join(logDirName, '-' + logFileName),
      level: logLevel
    }))
  }
}
if (!loggingToFile) {
  logTransports.push(new (winston.transports.Console)({
    timestamp: tsFormat,
    level: logLevel,
    colorize: true
  }));
}
var logger = new (winston.Logger)({
  transports: logTransports
});
logger.cli();
winston.addColors({error: 'red', warn: 'yellow', info: 'blue', verbose: 'grey', debug: 'black', silly: 'white'});
logger.verbose('log level:', logLevel);


//endregion
//region --- Script exec sandbox configure
var rootDoc = jsdom('<body><div id="container"></div></body>');
var window = rootDoc.defaultView;
var iframeDoc = null;
var iframes = {};


//endregion
//region --- AnyChart configure
// var anychart = require('anychart')(window);
var anychart = require('../ACDVF/out/anychart-bundle.min.js')(window);

// var anychart_nodejs = require('anychart-nodejs')(anychart);
var anychart_nodejs = require('../AnyChart-NodeJS')(anychart);


//endregion
//region --- Pdfmake configure
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


//endregion
//region --- Express server configure
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({parameterLimit: 100000, limit: '50mb', extended: true}));


//endregion

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
  iframeDoc.body.appendChild(div);

  return iframeId;
}

function clearSandbox(iframeId) {
  var iFrame = rootDoc.getElementById(iframeId);
  iframeDoc = iFrame.contentDocument;
  iframeDoc.body.innerHTML = '';
  iFrame.contentDocument = null;
  rootDoc.body.removeChild(iFrame);
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

    if (dataType === 'javascript' && program.disableScriptsExecuting) {
      logger.warn('Script executing disabled.');
      data = null;
    }

    if (data) {
      var iframeId = createSandbox(containerId);
      logger.info('----> PDF Report. Chart ' + index + ' exporting.');
      var imgConvertCallback = partial(function imgConvertCallback(id, dataType, chartNum, userData, err, data) {
        clearSandbox(id);
        logger.info('<---- PDF Report. Chart ' + chartNum + ' exporting.');
        if (data) {
          config.image = 'data:image/png;base64,' + data.toString('base64');
        } else {
          config.image = blankImage;
          logger.error('PDF Report. Convert %s to %s. Data: %s. Container id: %s. Chart was replaced with blank Image.',
              dataType.toUpperCase(), 'PDF', userData, containerId, err);
        }

        delete config[key];
        chartsToConvert--;
        if (chartsToConvert === 0) {
          callback(obj)
        }
      }, iframeId, dataType, index, data);

      var params = {type: 'png', dataType: dataType, document: iframeDoc, containerId: containerId, iframeId: iframeId};
      applyImageParams(params, chartConfig);
      anychart_nodejs.exportTo(data, params, imgConvertCallback);
    } else {
      config.image = blankImage;
      delete config[key];
      logger.error('Chart data not found. Chart was replaced with blank Image. Convert %s to %s. Data: %s. Container id: %s.',
          dataType.toUpperCase(), 'PDF', data, containerId);
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
      contentType = 'image/svf+xml';
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
          logger.error(err);
          return;
        }
      }

      fs.writeFile(path, data, function(err) {
        if (err) {
          logger.error(err);
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
  var resources = req.body.resources || [];

  if (dataType === 'javascript' && program.disableScriptsExecuting) {
    logger.warn('Script executing disabled.');
    data = null;
  }

  if (data) {
    // var iframeId = createSandbox(containerId);
    logger.info('----> Input. Convert %s to %s. Image.', dataType.toUpperCase(), fileType.toUpperCase());
    // var imgConvertCallback = partial(function imgConvertCallback(id, fileType, dataType, userData, err, data) {
    //   if (err)
    //     logger.error('Convert %s to %s. Data: %s. Container id: %s.',
    //         dataType.toUpperCase(), fileType.toUpperCase(), userData, containerId, err);
    //   else
    //     logger.info('<---- Output. Convert %s to %s. Image.', dataType.toUpperCase(), fileType.toUpperCase());
    //
    //   if (!data || err) {
    //     res.status(500).send({error: err ? err.message : 'Image generation error'});
    //   } else {
    //     sendResult(req, res, data, fileType);
    //   }
    //   clearSandbox(iframeId);
    // }, iframeId, fileType, dataType, data);

    var params = {
      type: fileType,
      dataType: dataType,
      // document: iframeDoc,
      containerId: containerId,
      // iframeId: iframeId,
      resources: resources
    };

    anychart_nodejs.exportTo(data, params, function(err, data) {
      sendResult(req, res, data, 'png');
    });
  } else {
    logger.error('Chart data not found. Convert %s to %s. Data: %s. Container id: %s.',
        dataType.toUpperCase(), fileType.toUpperCase(), data, containerId, err);
    res.status(500).send({error: 'Chart data not found'});
  }
}

app.post('/pdf-report', function (req, res) {
  if (!program.disableScriptsExecuting) {
    try {
      var script = new vm.VM();
      var data = script.run(req.body.data);
      script = null;
    } catch (e) {
      logger.error('PDF config evaluating failed. DataL %s', req.body.data, e);
      res.status(500).send({error: e.message});
      return;
    }
  } else {
    logger.warn('Script executing disabled.');
    res.status(500).send({error: 'Script executing disabled.'});
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
        pdfDoc = null;
      });
      pdfDoc.on('error', function(e) {
        logger.error('PDF generation error. Data: %s', req.body.data, e)
      });
      pdfDoc.end();
    } catch (e) {
      logger.error('PDF generation error. Data: %s', req.body.data, e);
    }
  });
});

app.post('/vector-image', function (req, res) {
  try {
    if (!req.body.file_type)
      req.body.file_type = 'pdf';

    generateOutput(req, res);
  } catch (e) {
    logger.error('Vector image generation failed. Request body: %s.', req.body, e);
  }
});

app.post('/raster-image', function (req, res) {
  try {
    generateOutput(req, res);
  } catch (e) {
    logger.error('Raster image generation failed. Request body: %s.', req.body, e);
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
    logger.error('Data file generation failed. Request body: %s.', req.body, e);
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


