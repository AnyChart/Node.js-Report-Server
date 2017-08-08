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
  // try {
  //   generateOutput(req, res);
  // } catch (e) {
  //   logger.error('Raster image generation failed. Request body: %s.', req.body, e);
  // }

  var data = '{"chart":{"enabled":true,"padding":{"left":35,"top":35,"bottom":35,"right":35},"credits":{"text":"AnyChart","url":"https://www.anychart.com/?utm_source=registered","alt":"AnyChart - JavaScript Charts designed to be embedded and integrated","imgAlt":"AnyChart - JavaScript Charts","logoSrc":"https://static.anychart.com/logo.png","enabled":false},"selectMarqueeFill":{"color":"#d3d3d3","opacity":0.4},"xScale":0,"yScale":1,"series":[{"enabled":true,"seriesType":"marker","tooltip":{"enabled":false},"labels":{"enabled":true,"fontFamily":"Arial","fontColor":"#546e7a","format":"{%Name}","position":"right","anchor":"leftCenter","offsetX":5,"offsetY":0},"data":[{"x":65,"y":60,"name":"Tableau","logo":"tableau.png","description_short":"Data visualization company","website":"tableau.com","description":"Tableau Software is an American computer software company headquartered in Seattle, Washington. It produces a family of interactive data visualization products focused on business intelligence.","stock_price_today":55.71,"stock_price_change":-0.31,"stock_price_change_percent":-0.55,"founded":"January 2003","founders":"Pat Hanrahan, Christian Chabot, Chris Stolte","CEO":"Adam Selipsky","CFO":"Tom Walker","headquarters":"Seattle, Washington, United States","stock_price_key_data":"DATA.US"},{"x":68,"y":57,"name":"Qlik","logo":"qlik.png","description_short":"Software company","website":"qlik.com","description":"Qlik is a software company based in Radnor, Pennsylvania, United States. Qlik is the provider of QlikView and Qlik Sense, business intelligence & visualization software.","stock_price_today":null,"stock_price_change":null,"founded":"1993","founders":"Björn Berg, Staffan Gestrelius","CEO":"Lars Björk","CFO":"Tim MacCarrick","headquarters":"Radnor, Pennsylvania, United States","stock_price_key_data":"QLIK.US"},{"x":78,"y":55,"name":"Microsoft","logo":"microsoft.png","description_short":"Technology company","website":"microsoft.com","description":"Microsoft Corporation (commonly referred to as Microsoft or MS) is an American multinational technology company headquartered in Redmond, Washington, that develops, manufactures, licenses, supports and sells computer software, consumer electronics and personal computers and services.","stock_price_today":57.24,"stock_price_change":-0.18,"stock_price_change_percent":-0.31,"founded":"April 4, 1975","founders":"Bill Gates, Paul Allen","CEO":"Satya Nadella","CFO":"Amy Hood","headquarters":"Redmond, Washington, United States","stock_price_key_data":"MSFT.US"},{"x":65.5,"y":48,"name":"Alteryx","logo":"alteryx.png","description_short":"Computer software company","website":"alteryx.com","description":"Alteryx is an American computer software company based out of Irvine, California, with a development center in Broomfield, Colorado. The company\'s products are used for data blending and advanced data analytics.","stock_price_today":null,"stock_price_change":null,"founded":"2010","founders":"Dean Stoecker, Olivia Duane Adams, Ned Harding","CEO":"Dean Stoecker ","CFO":"Kevin Rubin","headquarters":"\tIrvine, California, U.S.","stock_price_data":null},{"x":63,"y":47,"name":"SAS","label":{"anchor":"right"},"logo":"sas.jpeg","description_short":"Software company","website":"www.sas.com","description":"SAS Institute is an American multinational developer of analytics software based in Cary, North Carolina. SAS develops and markets a suite of analytics software, which helps access, manage, analyze and report on data to aid in decision-making.","stock_price_today":null,"stock_price_change":null,"founded":"July 1, 1976","founders":"James Goodnight, Anthony James Barr, John Sall","CEO":"James Goodnight","CFO":null,"CTO":"Oliver Schabenberger","headquarters":"Cary, North Carolina, United States","stock_price_key_data":"SAS.ST"},{"x":64,"y":43,"name":"SAP","logo":"sap.jpeg","description_short":"Software company","website":"go.sap.com","description":"SAP SE is a German multinational software corporation that makes enterprise software to manage business operations and customer relations. SAP is headquartered in Walldorf, Baden-Württemberg, Germany, with regional offices in 130 countries.","stock_price_today":81.28,"stock_price_change":-0.19,"stock_price_change_percent":-0.23,"founded":"April 1, 1972","founders":"Dietmar Hopp, Hans-Werner Hector, Hasso Plattner, Klaus Tschira, Claus Wellenreuther","CEO":"Bill McDermott","CFO":"Luka Mucic","headquarters":"Walldorf, Germany","stock_price_key_data":"SAP.US"},{"y":28,"name":"IBM","label":{"anchor":"bottom","offsetX":0},"logo":"ibm.png","description_short":"Computer hardware company","website":"ibm.com","description":"International Business Machines Corporation is an American multinational technology company headquartered in Armonk, New York, United States, with operations in over 170 countries.","stock_price_today":157.08,"stock_price_change":0.62,"stock_price_change_percent":0.4,"founded":"June 16, 1911","founders":"Charles Ranlett Flint","CEO":"Ginni Rometty","CFO":null,"headquarters":"Armonk, North Castle, New York, United States","stock_price_key_data":"IBM.US"},{"x":51,"y":21,"name":"TIBCO Software","logo":"tibco.png","description_short":"Software company","website":"tibco.com","description":"TIBCO Software Inc. is an American company that provides integration, analytics and events processing software for companies to use on-premises or as part of cloud computing environments.","stock_price_today":null,"stock_price_change":null,"founded":"1997","founders":"Dale Skeen, Vivek Ranadivé","CEO":"Murray D. Rode","CFO":"Tom Berquist","headquarters":"Palo Alto, California, United States","stock_price_data":null},{"x":53.2,"y":25.8,"name":"Pentaho","label":{"anchor":"right"},"logo":"pentaho.png","description_short":null,"website":"pentaho.com","description":"Pentaho is a company that offers Pentaho Business Analytics, a suite of open source Business Intelligence products which provide data integration, OLAP services, reporting, dashboarding, data mining and ETL capabilities.","stock_price_today":null,"stock_price_change":null,"founded":"2004","founders":"Richard Daley","CEO":"Quentin Gallivan ","CTO":"James Dixon","CFO":null,"headquarters":"Orlando, Florida, United States","stock_price_data":null},{"x":47,"y":48,"name":"Birst","label":{"anchor":"right"},"logo":"birst.jpeg","description_short":"Cloud BI and analytics","website":"www.birst.com","description":"Birst is a global leader in cloud BI and analytics. The company helps organizations make thousands of decisions better, every day, for every person. Birst’s patented two-tier data architecture and comprehensive BI platform sits on top of all of your data, to unify, refine and embed data consistently into every individual decision—up and down the org chart. ","stock_price_today":null,"stock_price_change":null,"founded":"2004","founders":"Brad Peters, Paul Staelin","CEO":"Jay Larson","CFO":"Sam Wolff","headquarters":"San Francisco, CA","stock_price_data":null},{"x":37,"y":43,"name":"Domo","label":{"anchor":"right"},"logo":"domo.png","description_short":"Business Intelligence: Dashboards, Reporting and Analytics","website":"www.domo.com","description":"Domo, Inc. is an American computer software company based in American Fork, Utah, USA. It specializes in business intelligence tools and data visualization.","stock_price_today":null,"stock_price_change":null,"founded":"2010","founders":"Josh James","CEO":"Josh James","CFO":null,"headquarters":"American Fork, Utah, US","stock_price_data":null},{"y":27.5,"name":"Board International","label":{"anchor":"leftTop","offsetX":-10,"offsetY":3},"logo":"boardInternational.png","description_short":"Business intelligence company","website":"board.com","description":"BOARD International S.A. is a Business Intelligence and Corporate Performance Management software vendor known for its BOARD toolkit. The company is headquartered in Lugano, Switzerland, where it was founded in 1994.","stock_price_today":null,"stock_price_change":null,"founded":"1994","founders":null,"CEO":null,"CFO":null,"headquarters":"Lugano, Switzerland","stock_price_data":null},{"x":35,"y":26.5,"name":"Sisense","label":{"anchor":"rightBottom"},"logo":"sisense.png","description_short":"Software company","website":"sisense.com","description":"Sisense is a business analytics software company with offices in New York City and Tel Aviv. Its business intelligence product includes both a back-end powered by in-chip technology that enables non-technical users to join and analyze large data sets from multiple sources, and a front-end for creating visualizations, like dashboards and reports, on any device, including mobile.","stock_price_today":null,"stock_price_change":null,"founded":"2004","founders":"Elad Israeli, Eldad Farkash, Aviad Harell, Guy Boyangu, Adi Azaria","CEO":"Amir Orad","CFO":null,"headquarters":null,"stock_price_data":null},{"x":30,"y":16,"name":"Yellowfin","label":{"anchor":"right"},"logo":"yellowfin.png","description_short":"Business intelligence company","website":"yellowfinbi.com","description":"Yellowfin is a business intelligence, dashboard, reporting and data analysis software vendor. Yellowfin’s software allows reporting from data stored in relational databases, multi-dimensional cubes or in-memory analytical databases.","stock_price_today":null,"stock_price_change":null,"founded":"2003","founders":"Glen Rabie and Justin Hewitt","CEO":null,"CFO":null,"headquarters":"Melbourne, Victoria, Australia, Tokyo, Idaho, Boston, London, New Hampshire","stock_price_data":null}],"xScale":0,"yScale":1}],"isVertical":false,"quarters":{"rightTop":{"enabled":true,"title":{"enabled":true,"fontColor":"#ff8f00","text":"LEADERS","padding":{"left":10,"top":10,"bottom":10,"right":10}}},"leftTop":{"enabled":true,"title":{"enabled":true,"fontColor":"#ff8f00","text":"CHALLENGERS","padding":{"left":10,"top":10,"bottom":10,"right":10}}},"leftBottom":{"enabled":true,"title":{"enabled":true,"fontColor":"#ff8f00","text":"NICHE PLAYERS","padding":{"left":10,"top":10,"bottom":10,"right":10}},"labels":[{"enabled":true,"zIndex":20,"useHtml":true,"background":{"zIndex":0,"enabled":false,"disablePointerEvents":false},"padding":{},"anchor":"leftCenter","offsetX":-20,"text":"Power to Perform &#8594;","rotation":-90,"position":"leftBottom"},{"enabled":true,"zIndex":20,"useHtml":true,"background":{"zIndex":0,"enabled":false,"disablePointerEvents":false},"padding":{},"anchor":"leftCenter","offsetY":20,"text":"Entirety of Representation &#8594;","position":"leftBottom"}]},"rightBottom":{"enabled":true,"title":{"enabled":true,"fontColor":"#ff8f00","text":"VISIONARIES","padding":{"left":10,"top":10,"bottom":10,"right":10}}}},"type":"quadrant"}}';
  var params = {
    type: 'png',
    dataType: 'json',
    containerId: 'container'
  };

  anychart_nodejs.exportTo(data, params, function(err, data) {
    console.log(err, data);

    var base64Data = data.toString('base64');
    var result = {data: base64Data};

    res.set('Content-Type', getContentType('json'));
    res.send(JSON.stringify(result));
  });
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


