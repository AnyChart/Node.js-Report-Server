$(document).ready(function() {
  var host = $('#host').val();

  $.ajax({
    url: '/report.js',
    async: false,
    success: function(data) {
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
      $('#content').html(data);
      resultEditor = ace.edit("content");
      // resultEditor.setTheme("ace/theme/monokai");
      resultEditor.getSession().setMode("ace/mode/javascript");

      $.ajax({
           method: 'POST',
           dataType: 'json',
           url: '/pdf-report',
           data: {
             response_type: 'base64',
             content: data
           }
         }).done(function(resData) {
           $('#viewpdf').attr("src", 'data:application/pdf;base64,' + resData.data)
         }).fail(function(e) {
           console.log('fail');
         });
    }
  });

  $('#generate').click(function() {
    $.ajax({
      method: 'POST',
      dataType: 'json',
      url: '/pdf-report',
      data: {
        response_type: 'base64',
        content: resultEditor.getValue()
      }
    }).done(function(resData) {
      $('#viewpdf').attr("src", 'data:application/pdf;base64,' + resData.data)
    }).fail(function(e) {
      console.log(e);
    });
  });


  var offsetContent = $('#content').offset();
  var offsetOffset = $('#viewpdf').offset();
  var docHeight = $(document).height();

  $('#content').height(docHeight - offsetContent.top - 5);
  $('#viewpdf').height(docHeight - offsetOffset.top - 5);
});