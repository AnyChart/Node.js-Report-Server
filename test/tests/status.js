var chai = require('chai');
var chaiHttp = require('chai-http');
var app = require('../../index');
const should = chai.should();

chai.use(chaiHttp);

describe('/status', function() {
  it('should return \'ok\'', function(done) {
    chai.request(app)
        .get('/status')
        .end(function(err, res) {
          res.text.should.equal('ok');
          done();
        });
  });
});