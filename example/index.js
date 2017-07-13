var loadedFiles = {};

function parseReport(data) {
  var regex = /chart"*:\s*{\s*\n*\s*"*data"*:\s*"*(.*[^",])"*[,\n]\s*\n*\s*"*dataType"*:\s*"*(.*[^",])"*[,\n]/g;
  var res;
  while(res = regex.exec(data)) {
    var chartData = res[1];
    var dataType = res[2];

    $.ajax({
      url: '/' + chartData,
      async: false,
      dataType: 'text',
      success: function(new_data) {
        var newStr = dataType === 'json' ? new_data : new_data.replace(/\n/g, '');
        var oldStr = dataType === 'json' ? new RegExp('"*' + chartData + '"*') : chartData;
        data = data.replace(oldStr, newStr);
      }
    });
  }

  return data;
}

function generate() {
  var controlID = $('#tabs').find('li.active a').attr('aria-controls');
  var tab = $('#' + controlID);
  var container = $('#' + controlID + ' div:first');
  var id = tab.attr('id');
  var fileName, mode, data_type;
  var url, contentType;
  var file_type = $('#outputType').val();

  switch (id) {
    case 'report':
      fileName = 'report.js';
      mode = 'ace/mode/javascript';
      file_type = 'pdf';
      data_type = 'report';
      break;
    case 'json':
      fileName = 'json.json';
      mode = 'ace/mode/json';
      data_type = 'json';
      break;
    case 'xml':
      fileName = 'xml.xml';
      mode = 'ace/mode/xml';
      data_type = 'xml';
      break;
    case 'js':
      fileName = 'js.js';
      mode = 'ace/mode/javascript';
      data_type = 'javascript';
      break;
    case 'svg':
      fileName = 'svg.svg';
      mode = 'ace/mode/svg';
      data_type = 'svg';
      break;
  }

  switch (file_type) {
    case 'png':
      url = '/raster-image';
      contentType = 'image/png';
      break;
    case 'jpg':
      url = '/raster-image';
      contentType = 'image/jpg';
      break;
    case 'tiff':
      url = '/raster-image';
      contentType = 'image/tiff';
      break;
    case 'pdf':
      url = '/vector-image';
      contentType = 'application/pdf';
      break;
    case 'svg':
      url = '/vector-image';
      contentType = 'image/svf+xm';
      break;
    case 'ps':
      url = '/vector-image';
      contentType = 'application/postscript';
      break;
  }

  if (data_type === 'report') {
    url = '/pdf-report';
  }

  if (!loadedFiles[fileName]) {
    $.ajax({
      url: '/' + fileName,
      dataType: 'text',
      async: false,
      success: function(data) {
        var editor = ace.edit(container.attr('id'));
        var session = editor.getSession();
        session.setMode(mode);
        session.setValue(data);

        loadedFiles[fileName] = {
          editor: editor
        };
        convert(data, data_type, file_type, contentType, url);
      }
    });
  } else {
    var editorSession = loadedFiles[fileName].editor.getSession();
    convert(editorSession.getValue(), data_type, file_type, contentType, url);
  }
}

function convert(data, data_type, file_type, contentType, url) {
  if (data_type === 'report') {
    data = parseReport(data);
  }

  $.ajax({
    method: 'POST',
    dataType: 'json',
    url: url,
    data: {
      data_type: data_type,
      file_type: file_type,
      response_type: 'base64',
      data: data
    }
  }).done(function(resData) {
    console.log(contentType);
    if (contentType === 'application/pdf' || contentType ===  'image/tiff') {
      $('#viewpdf').attr("src", 'data:' + contentType + ';base64,' + resData.data);
      $('#viewpdf').attr("type", contentType);

      $('#viewimage').css('display', 'none');
      $('#viewsvg').css('display', 'none');
      $('#viewpdf').css('display', 'inline-block');
    } else if (contentType === 'image/svf+xm') {
      $('#viewsvg').html(resData.data);

      $('#viewimage').css('display', 'none');
      $('#viewpdf').css('display', 'none');
      $('#viewsvg').css('display', 'inline-block');
    } else {
      $('#viewimage').attr("src", 'data:' + contentType + ';base64,' + resData.data);

      $('#viewimage').css('display', 'inline-block');
      $('#viewpdf').css('display', 'none');
      $('#viewsvg').css('display', 'none');
    }
  }).fail(function(e) {
    console.log(e);
  });
}

$(document).ready(function() {
  generate();

  $('#tabs').find('a').click(function (e) {
    e.preventDefault();
    $(this).tab('show');

    generate();
  });

  $('#generate').click(function() {
    generate();
  });

  $('#outputType').on('change', function() {
    generate();
  });

  var offsetContent = $('#content').offset();
  var offsetOffset = $('#viewpdf').offset();
  var docHeight = $(document).height();

  $('#content, #json_data, #xml_data, #js_data, #svg_data').height(docHeight - offsetContent.top - 5);
  $('#viewpdf').height(docHeight - offsetOffset.top - 5);
  $('#viewsvg').height(docHeight - offsetOffset.top - 5);
});