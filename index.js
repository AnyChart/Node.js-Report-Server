var express = require('express');
var bodyParser = require('body-parser');
var program = require('commander');
var uuidv1 = require('uuid/v1');
var fs = require('fs');
var jsdom = require('jsdom').jsdom;
var DOMParser = require('xmldom').DOMParser;
var XMLparser = new DOMParser();
var vm = require('vm');
var csv = require('csv');
var xlsx = require('xlsx');

program
    .version('0.0.1')
    .option('-p, --port [value]', 'TCP port of server ', 3000)
    .option('-od, --output-dir [value]', 'Output directory', 'shared')
    .option('-as, --allow-scripts-executing [value]', 'Whether allow script execution', false);

program.parse(process.argv);

var d = jsdom('<body><iframe><div id="container"></div></iframe></body>');
var window = d.defaultView;

console.time('anychart init');
// var anychart = require('anychart')(window);
var anychart = require('../ACDVF/out/anychart-bundle.min.js')(window);
// var anychart_nodejs = require('anychart-nodejs')(anychart);
var anychart_nodejs = require('../AnyChart-NodeJS')(anychart);
console.timeEnd('anychart init');

var pdfMake = require('pdfmake');
var fontDescriptors = {
  Roboto: {
    normal: './fonts/Roboto-Regular.ttf',
    bold: './fonts/Roboto-Medium.ttf',
    italics: './fonts/Roboto-Italic.ttf',
    bolditalics: './fonts/Roboto-Italic.ttf'
  }
};
var printer = new pdfMake(fontDescriptors);

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({parameterLimit: 100000, limit: '50mb', extended: true}));
app.use(express.static('example'));

function recursiveTraverse(obj, func) {
  if (obj instanceof Array) {
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

function convertCharts(obj, callback) {
  var chartsToConvert = 0;

  recursiveTraverse(obj, function(o, key) {
    var ch = o[key];
    var data = ch.data;
    var dataType = ch.dataType;

    var chart = getChartData(data, dataType);
    if (chart) {
      chartsToConvert++;
      console.log('+++ ', chartsToConvert);
      anychart_nodejs.exportTo(chart, 'png', function(err, data) {
        console.log('--- ', chartsToConvert);
        o.image = 'data:image/png;base64,' + data.toString('base64');
        delete o[key];
        chartsToConvert--;
        d.getElementById('container').innerHTML = '';
        if (chartsToConvert === 0) {
          callback(obj)
        }
      });
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
        try {
          // var context = vm.createContext();
          // var script = new vm.Script(req.body.data);
          // chart = script.runInContext(context);
          chart = data;
        } catch (e) {
          console.log(e.message);
        }
      }
      break;
  }
  if (chart && type !== 'svg' && type !== 'javascript')
    chart.container('container');

  return chart;
}

function sendResult(req, res, data, fileType) {
  var autoFileName = 'anychart_' + uuidv1() + '.' + fileType;
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
          console.log(err.message);
          return;
        }
      }

      fs.writeFile(path, data, function(err) {
        if (err) {
          console.log(err.message);
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

  var chart = getChartData(data, dataType);
  if (chart) {
    anychart_nodejs.exportTo(chart, fileType, function(err, data) {
      sendResult(req, res, data, fileType);
      d.getElementById('container').innerHTML = '';
    });
  } else {
    res.send('');
  }
}

app.post('/pdf-report', function (req, res) {
  req.body.file_type = 'pdf';
  var context = vm.createContext();
  var script = new vm.Script(req.body.data);
  var data = script.runInContext(context);
  var fileType = 'pdf';

  convertCharts(data, function(dd) {
    var pdfDoc = printer.createPdfKitDocument(dd);
    var chunks = [];

    pdfDoc.on('data', function(chunk) {
      chunks.push(chunk);
    });
    pdfDoc.on('end', function() {
      sendResult(req, res, Buffer.concat(chunks), fileType);
    });
    pdfDoc.on('error', function(err) {
      console.log(err.message)
    });
    pdfDoc.end();
  });
});

app.post('/vector-image', function (req, res) {
  generateOutput(req, res);
});

app.post('/raster-image', function (req, res) {
  generateOutput(req, res);
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


