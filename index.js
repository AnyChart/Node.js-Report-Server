var express = require('express');
var bodyParser = require('body-parser');
var program = require('commander');

program
    .version('0.0.1')
    .option('-p, --port [value]', 'TCP port of server ', '3000');

program.parse(process.argv);


var app = express();
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

app.get('/status', function (req, res) {
  res.send('ok');
});

app.listen(program.port, function () {
  console.log('Export server listening on port ' + program.port + '!')
});


module.exports = app;


