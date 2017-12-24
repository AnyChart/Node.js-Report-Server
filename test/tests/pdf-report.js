var chai = require('chai');
var chaiHttp = require('chai-http');
var app = require('../../index');
const should = chai.should();

chai.use(chaiHttp);

describe('/pdf-report', function() {
  it('base64 report with one chart with custom container id', function(done) {
    this.timeout(3000);

    chai.request(app)
        .post('/pdf-report')
        .send({
          "response_type": "base64",
          "data": "(function() {return {content: [{\"chart\": {\"data\": \"chart = anychart.line([1,2,3]); chart.container('custom_container_id').draw();\",\"dataType\": \"javascript\",\"containerId\": \"custom_container_id\"},\"fit\": [500, 500]}]}})();"
        })
        .end(function(err, res) {
          res.should.to.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('data');
          done();
        });
  });
});