#### Data
Формат данных для pdf report - это self executing функция, которая возвращает объект формата [pdfmake](http://pdfmake.org/index.html#/gettingstarted). Ко всем возможностям *pdfmake* добавляется возможность вставлять в PDF документ anychart чарты. Чарт добавляется как поле *chart* которому соответсвует объект определенного формата. Объект, описывающий чарт имеет следующий формат:

| Name  | Possible values | Description |
| ------------- | ------------- | ------------- |
| data  | javascript, JSON, XML, SVG string | Строка, определяющая непосредственно сам чарт. |
| dataType | javascript, JSON, XML, SVG | Опеределяет тип данных в поле data |
| containerId  | any string  | Определяет id контейнера который задан чарту в поле data. Этот id должен соответствовать контейнеру, в который будет отрисован чарт. |

К чарту могут быть применены все свойства, которые можно применить к *image* в pdmake, смотрите пример ниже.

#### Example
Пример данных для pdf report

```
(function() {
  return {
    content: [
      {
        "chart": {
          "data": "chart = anychart.line([1,2,3]); chart.container('custom_container_id').draw();",
          "dataType": "javascript",
          "containerId": "custom_container_id"
        },
        "fit": [500, 500]
      }
    ]
  }
})();
```
Чтобы данные такого формата отправить на сервер, их необходимо превратить в строку. Самое простое - заинлайнить их и преобразовать в строку.

```
var data = "(function(){return {content:[{chart:{data: \"chart = anychart.line([1,2,3]); chart.container('custom_container_id').draw();\", dataType: 'javascript', containerId: 'custom_container_id'},fit: [500, 500]}]}})();"
```
Так же можно подгружать их из файла как текст, брать из html формы или каким-либо другим способом превращать в строку.

Пример ajax запроса на сервер с помощью [jQuery.ajax()](http://api.jquery.com/jquery.ajax/)

```
  $.ajax({
    method: 'POST',
    dataType: 'json',
    url: '/pdf-report',
    data: {
      response_type: 'base64',
      data: data //from above snippet
    }
  }).done(function(resData) {
    //to do something
  }).fail(function(err) {
    //to do something
  });
```