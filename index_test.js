#!/usr/bin/env node
var jsdom = require('jsdom').jsdom;

var rootDoc = jsdom('<body><div id="container"></div></body>');
var window = rootDoc.defaultView;
var anychart = require('../ACDVF/out/anychart-base.min.js')(window);
var anychart_nodejs = require('../AnyChart-NodeJS')(anychart);

var data = '{"chart":{"enabled":true,"credits":{"text":"AnyChart","url":"https://www.anychart.com/?utm_source=registered","alt":"AnyChart - JavaScript Charts designed to be embedded and integrated","imgAlt":"AnyChart - JavaScript Charts","logoSrc":"https://static.anychart.com/logo.png","enabled":true},"xScale":0,"yScale":1,"series":[{"enabled":true,"seriesType":"line","data":[1,2,3],"xScale":0,"yScale":1}],"type":"cartesian"}}';

var params = {
  type: 'png',
  dataType: 'json',
  containerId: 'container',
  document: rootDoc
};

var chartCount = 1000;
var cur = 0;

// var inertval = setInterval(function() {
  anychart_nodejs.exportTo(data, params, function(err, data) {
    if (cur > chartCount) {
      // clearInterval(inertval);
      console.log('interval cleared');
    } else {
      cur++;
      console.log(cur, err, data);
    }
  });
// }, 1);
                                                         