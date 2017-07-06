var express = require('express');
var bodyParser = require('body-parser');
var program = require('commander');
var uuidv1 = require('uuid/v1');
var fs = require('fs');
var jsdom = require('jsdom').jsdom;

program
    .version('0.0.1')
    .option('-p, --port [value]', 'TCP port of server ', 3000)
    .option('-od, --output-dir [value]', 'Output directory', 'shared')
    .option('-as, --allow-scripts-executing [value]', 'Whether allow script execution', false);

program.parse(process.argv);

var d = jsdom('<body><div id="container"></div></body>');
var window = d.defaultView;

var anychart = require('anychart')(window);
// var anychart_nodejs = require('anychart-nodejs')(anychart);
var anychart_nodejs = require('../AnyChart-NodeJS')(anychart);
var indexTemplate = fs.readFileSync('./template.html', 'utf-8');
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

app.get('/', function (req, res) {
  res.send(indexTemplate)
});

app.post('/pdf-report', function (req, res) {
  var responseType = req.body.response_type.toLowerCase() || 'file';
  var autoFileName = 'anychart_' + uuidv1() + '.pdf';
  var fileName = responseType === 'file' ? req.body.file_name || autoFileName : autoFileName;

  // var data = JSON.parse(req.body.content);
  eval(req.body.content);

  convertCharts(data, function(dd) {
    var pdfDoc = printer.createPdfKitDocument(dd);
    var chunks = [];

    pdfDoc.on('data', function(chunk) {
      chunks.push(chunk);
    });
    pdfDoc.on('end', function() {
      console.log('end');
      var result = Buffer.concat(chunks);

      res.writeHead(200, {
        'Content-Type': getContentType('pdf'),
        'Content-Length': result.length,
        'Content-Disposition': 'attachment; filename=' + fileName
      });

      res.end(result);
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

function recursiveTraverse(obj, func) {
  if (obj instanceof Array) {
    for (var i = 0; i < obj.length; i++) {
      if (i in obj)
        recursiveTraverse(obj[i], func);
    }
  } else if (obj instanceof Object) {
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
      chart = anychart.fromXml(data);
      break;
    case 'svg':
      chart = data;
      break;
    case 'javascript':
      if (program.allowScriptsExecuting) {
        try {
          chart = eval(data);
        } catch (e) {
          console.log(e.message);
        }
      }
      break;
  }
  if (chart && type !== 'svg')
    chart.container('container');

  return chart;
}

function generateOutput(req, res) {
  var dataType = req.body.data_type.toLowerCase();
  var fileType = req.body.file_type.toLowerCase() || 'png';
  var responseType = req.body.response_type.toLowerCase() || 'file';
  var autoFileName = 'anychart_' + uuidv1() + '.' + fileType;
  var fileName = responseType === 'file' ? req.body.file_name || autoFileName : autoFileName;
  var data = req.body.data;

  var chart = getChartData(data, dataType);
  if (chart) {
    anychart_nodejs.exportTo(chart, fileType, function(err, data) {
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
    });
  } else {
    res.send('');
  }
}


app.get('/status', function (req, res) {
  res.send('ok');
});

app.listen(program.port, function () {
  console.log('Export server listening on port ' + program.port + '!')
});


module.exports = app;


