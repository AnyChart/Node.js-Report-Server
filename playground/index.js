var loadedFiles = {};
var pathToConfigs = 'configs/';

var img500;
$.get('500.img', function(data) {
  img500 = data;
});

function parseReport(data) {
  var regex = /chart"*:\s*{\s*\n*\s*"*data"*:\s*"*(.*[^",])"*[,\n]\s*\n*\s*"*dataType"*:\s*"*(.*[^",])"*[,\n]/g;
  var res;
  while(res = regex.exec(data)) {
    var chartData = res[1];
    var dataType = res[2];

    $.ajax({
      url: pathToConfigs + chartData,
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

function getParams() {
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

  return {
    mode: mode,
    container: container,
    fileName: pathToConfigs + fileName,
    data_type: data_type,
    file_type: file_type,
    contentType: contentType,
    url: url
  }
}

function generate() {
  var params = getParams();
  var mode = params.mode;
  var container = params.container;
  var fileName = params.fileName;
  var data_type = params.data_type;
  var file_type = params.file_type;
  var contentType = params.contentType;
  var url = params.url;
  var responseType = 'base64';

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
        convert(data, data_type, file_type, contentType, responseType, url);
      }
    });
  } else {
    var editorSession = loadedFiles[fileName].editor.getSession();
    convert(editorSession.getValue(), data_type, file_type, contentType, responseType, url);
  }
}

function generateAvailableOutputTypes() {
  var params = getParams();
  var data_type = params.data_type;

  var types;
  switch (data_type) {
    case 'report':
      types = ['pdf'];
      break;
    case 'json':
    case 'xml':
    case 'javascript':
    case 'svg':
      types = ['png', 'jpg', 'tiff', 'pdf', 'svg', 'ps'];
      break;
  }
  var outputTypeControl = $('#outputType');
  var value = outputTypeControl.val();
  outputTypeControl.html('');
  $(types).each(function(index, elem) {
    var option = $('<option>' + elem + '</option>');
    option.attr('value', elem);
    outputTypeControl.append(option);
  });
  if (outputTypeControl.find('option[value=' + value + ']').length !== 0)
    outputTypeControl.val(value)
}

function saveFile() {
  var params = getParams();
  var data_type = params.data_type;
  var file_type = params.file_type;
  var fileName = params.fileName;
  var responseType = params.responseType;
  var url = params.url;
  var editorSession = loadedFiles[fileName].editor.getSession();

  var data = editorSession.getValue();
  if (data_type === 'report') {
    data = parseReport(data);
  }

  var form = $('<form></form>');
  form.attr({
    method: 'post',
    action: url
  });
  var dataTypeInput = $('<input/>');
  dataTypeInput.appendTo(form);
  dataTypeInput.attr({
    type: 'hidden',
    name: 'data_type',
    value: data_type
  });
  var fileTypeInput = $('<input/>');
  fileTypeInput.appendTo(form);
  fileTypeInput.attr({
    type: 'hidden',
    name: 'file_type',
    value: file_type
  });
  var responseTypeInput = $('<input/>');
  responseTypeInput.appendTo(form);
  responseTypeInput.attr({
    type: 'hidden',
    name: 'response_type',
    value: responseType
  });
  var dataInput = $('<input/>');
  dataInput.appendTo(form);
  dataInput.attr({
    type: 'hidden',
    name: 'data',
    value: data
  });
  form.appendTo('body');
  form.submit();
  form.remove();
}

function showContent(contentType, resData) {
  if (contentType === 'application/pdf' || contentType === 'image/tiff') {
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
}

function convert(data, data_type, file_type, contentType, responseType, url) {
  if (data_type === 'report') {
    data = parseReport(data);
  }

  if (file_type === 'ps') {
    file_type = 'png';
  }

  $.ajax({
    method: 'POST',
    dataType: 'json',
    url: url,
    data: {
      data_type: data_type,
      file_type: file_type,
      response_type: responseType,
      data: data,
      resources: [
          // 'https://code.jquery.com/jquery-latest.min.js',
          'https://cdn.anychart.com/geodata/1.2.0/countries/canada/canada.js',
          // 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css',
          'https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.3.15/proj4.js',
        // "https://cdn.anychart.com/fonts/interdex/interdex.css"
      ]
    }
  }).done(function(resData) {
    showContent(contentType, resData);
  }).fail(function(e) {
    $('#viewimage').attr("src", img500);
    $('#viewimage').css('display', 'inline-block');
    $('#viewpdf').css('display', 'none');
    $('#viewsvg').css('display', 'none');
    console.log(e.responseJSON.error);
  });
}

function resize() {
  var offsetContent = $('#tab-panes').offset();
  var offsetOffset = $('#viewpdf').offset();
  var docHeight = $(window).height();

  $('#content, #json_data, #xml_data, #js_data, #svg_data').height(docHeight - offsetContent.top - 5);
  $('#tab-panes').height(docHeight - offsetContent.top - 5);
  $('#viewpdf').height(docHeight - offsetOffset.top - 5);
  $('#viewsvg').height(docHeight - offsetOffset.top - 5);
}

$(document).ready(function() {
  generateAvailableOutputTypes();
  generate();

  $('#tabs').find('a').click(function (e) {
    e.preventDefault();
    $(this).tab('show');

    generateAvailableOutputTypes();
    generate();
  });

  $('#save').click(function() {
    saveFile();
  });

  $('#refresh').click(function() {
    generate();
  });

  $('#outputType').on('change', function() {
    generate();
  });

  $(window).resize(function() {
    resize();
  });

  resize();
});