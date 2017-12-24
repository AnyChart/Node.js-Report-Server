var chai = require('chai');
var chaiHttp = require('chai-http');
var app = require('../../index');
var crypto = require('crypto');
const should = chai.should();

chai.use(chaiHttp);

describe('/vector-image', function() {
  it('javascript -> pdf(base64)', function(done) {
    this.timeout(3000);

    chai.request(app)
        .post('/vector-image')
        .send({
          "background": "#f00",
          "aspect-ratio": true,
          "width": 200,
          "height": 1000,
          "data_type": "javascript",
          "file_type": "pdf",
          "response_type": "base64",
          "data": "var chart = anychart.pie(); chart.data([10, 20, 8, 5, 12, 9]); chart.container('container'); chart.draw();"
        })
        .end(function(err, res) {
          res.should.to.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('data');
          done();
        });
  });

  it('xml -> ps image(file)', function(done) {
    this.timeout(3000);

    chai.request(app)
        .post('/raster-image')
        .send({
          "file_name": "chart.ps",
          "data_type": "xml",
          "file_type": "ps",
          "response_type": "file",
          "data": '<anychart xmlns="http://anychart.com/schemas/7.14.3/xml-schema.xsd"><chart enabled="true" type="venn"><title enabled="true" text="Cooking Bacon by Venn Diagram"><padding left="0" top="0" bottom="35" right="0"/></title><credits text="AnyChart" url="https://www.anychart.com/?utm_source=registered" alt="AnyChart - JavaScript Charts designed to be embedded and integrated" img_alt="AnyChart - JavaScript Charts" logo_src="https://static.anychart.com/logo.png" enabled="false"/><select_marquee_fill color="#d3d3d3" opacity="0.4"/><legend enabled="true"><padding left="0" top="35" bottom="0" right="0"/></legend><stroke color="#fff" thickness="2"/><data><point x="A" value="100" name="Salt" fill="#c6c6c6 0.75"><label font_color="#60727b"/></point><point x="B" value="100" name="Meat" fill="#e24b26 0.75"><label font_color="#ffdb69"/></point><point x="C" value="100" name="Fat" fill="#ffdb69 0.75"><label font_color="#60727b"/></point><point x="D" value="100" name="Smoke" fill="#60727b 0.75"><label font_color="#ffdb69"/></point><point value="35" name="Corned Beef"><x><![CDATA[A&B]]></x></point><point value="35" name="Pork Belly"><x><![CDATA[B&C]]></x></point><point value="35" name="Cuban Cigar"><x><![CDATA[C&D]]></x></point><point value="35" name="Smoked Salt"><x><![CDATA[A&D]]></x></point><point value="35" name="Bacon!"><x><![CDATA[A&B&C&D]]></x><label font_size="14"/></point></data><labels enabled="true" font_size="14"/><intersections><labels font_color="#fff" font_weight="bold" format="{%Name}"/><tooltip z_index="0"/></intersections></chart></anychart>'
        })
        .end(function(err, res) {
          res.should.to.have.status(200);
          res.should.to.have.header('content-type', 'application/postscript');
          res.should.to.have.header('content-disposition', 'attachment; filename=chart.ps');
          done();
        });
  });

  it('javascript -> pdf(base64) [+external]', function(done) {
    this.timeout(10000);

    chai.request(app)
        .post('/vector-image')
        .send({
          "resources": [
            "https://cdn.anychart.com/geodata/1.2.0/countries/canada/canada.js",
            "https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.3.15/proj4.js"
          ],
          "data_type": "javascript",
          "file_type": "pdf",
          "response_type": "base64",
          "data": "var data = [];anychart.maps['canada'].features.filter(function (item) {data.push({id: item.properties.id, name: item.properties.name});});map = anychart.map().crs('august').geoData('anychart.maps.canada');map.scale().xTicks({interval: 15}).yTicks({interval: 5}).precision(1).minimumX(-145).maximumX(-45).minimumY(40).maximumY(84);map.axes().enabled(true).drawFirstLabel(false).drawLastLabel(false);map.choropleth(data);map.container('container').draw();"
        })
        .end(function(err, res) {
          res.should.to.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('data');

          var trueHash = "d94f86c6d48d58d01db8441feeccdf7d";
          var md5sum = crypto.createHash('md5');
          md5sum.update(res.body.data);
          var hashOfOutputImage = md5sum.digest('hex');

          hashOfOutputImage.should.be.equal(trueHash);
          done();
        });
  });
});