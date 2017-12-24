var chai = require('chai');
var chaiHttp = require('chai-http');
var app = require('../../index');
const should = chai.should();

chai.use(chaiHttp);

describe('/data-file', function() {
  it('csv data to xlsx file', function(done) {
    chai.request(app)
        .post('/data-file')
        .send({
          "file_name": "anychart.xlsx",
          "data": "x,value\n0,10\n1,20\n2,8\n3,5\n4,12\n5,9",
          "response_type": "file"
        })
        .end(function(err, res) {
          res.should.to.have.status(200);
          res.should.to.have.header('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          res.should.to.have.header('content-disposition', 'attachment; filename=anychart.xlsx');
          done();
        });
  });

  it('csv data to csv file', function(done) {
    chai.request(app)
        .post('/data-file')
        .send({
          "file_name": "anychart.csv",
          "file_type": "csv",
          "data": "x,value\n0,10\n1,20\n2,8\n3,5\n4,12\n5,9",
          "response_type": "file"
        })
        .end(function(err, res) {
          res.should.to.have.status(200);
          res.should.to.have.header('content-type', 'text/csv');
          res.should.to.have.header('content-disposition', 'attachment; filename=anychart.csv');
          done();
        });
  });
});