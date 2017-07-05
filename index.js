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

var app = express();
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

app.get('/', function (req, res) {
  res.send(indexTemplate)
});


app.post('/raster-image', function (req, res) {
  var dataType = req.body.data_type.toLowerCase();
  var fileType = req.body.file_type.toLowerCase() || 'png';
  var responseType = req.body.response_type.toLowerCase() || 'file';
  var autoFileName = 'anychart_' + uuidv1() + '.' + fileType;
  var fileName = responseType === 'file' ? req.body.file_name || autoFileName : autoFileName;
  var data = req.body.data;

  var chart = null;


  switch (dataType) {
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

  if (chart) {
    if (dataType !== 'svg')
      chart.container('container');

    anychart_nodejs.exportTo(chart, fileType, function(err, data) {
      if (responseType === 'file') {
        var contentType;
        switch (fileType) {
          case 'png':
            contentType = 'image/png';
            break;
          case 'jpg':
            contentType = 'image/jpg';
            break;
          case 'svg':
            contentType = 'image/svf+xm;';
            break;
          case 'pdf':
            contentType = 'application/pdf';
            break;
        }

        res.writeHead(200, {
          'Content-Type': contentType,
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
});

app.get('/status', function (req, res) {
  res.send('ok');
});

app.listen(program.port, function () {
  console.log('Export server listening on port ' + program.port + '!')
});


module.exports = app;


