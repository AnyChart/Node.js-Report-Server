[<img src="https://cdn.anychart.com/images/logo-transparent-segoe.png" width="234px" alt="AnyChart - Robust JavaScript/HTML5 Chart library for any project">](https://anychart.com)

# AnyChart Export Server 

## Installation and running

### Installation
Первым делом необходимо убедиться, что уставновлен nodejs. Перейдите на [nodejs](https://nodejs.org/en/download/) чтобы загрузить и установить его.

Установить можно через npm package manager:

```
npm install anychart-export-server -g
```
Или склонировав git репозиторий:

```
git clone git@github.com:AnyChart/node-export-server.git
npm install
npm link
```

Для работы сервера необходимо установить пакеты для работы с изображениями - ImageMagick и librsvg. Выберите способ установки относительно вашей платформы:

Ububntu

```
apt-get install imagemagick librsvg2-dev
```

Mac OS X

```
brew install imagemagick librsvg
```

Windows

- [imagemagick](https://www.imagemagick.org/script/download.php)<br>
- [GTK+ bundle](http://win32builder.gnome.org/gtk+-bundle_3.6.4-20131201_win64.zip)<br>
- [RSVG lib](https://downloads.sourceforge.net/project/tumagcc/converters/rsvg-convert.exe?r=https%3A%2F%2Fsourceforge.net%2Fprojects%2Ftumagcc%2Ffiles%2Frsvg-convert.exe%2Fdownload&ts=1500995628&use_mirror=netix)


### Running

```
> anychart-export-server [arguments]
1:32:48 PM - info:    Export server listening on port 3000!
```

#### Options

| Name  | Type | Description |
| ------------- | ------------- | ------------- |
| port  | number  | TCP port |
| output-dir  | string | то куда будем сохранять все файлы |
| disable-scripts-executing | boolean | можно ли запускать скрипты |
| log-level | string | Уровень логирования, допустимые значения: error, warn, info, verbose, debug, silly |
| disable-playground | boolean | Выключение приложения playground (который находится по роуту /playground ) |

### Tutorials
- Running AnyChart Export Server on Digital Ocean
- Running AnyChart Export Server on AWS S2
- Running AnyChart Export Server on Microsoft Asure

## Server API

### Generate PDF report
todo: description
```
POST /pdf-report
```

#### Input
| Name  | Type | Description |
| ------------- | ------------- | ------------- |
| file_name  | string  | Имя файла. Используется, если *response_type* задан как *file* |
| data | javascript string | Формат данных описан ниже |
| response_type  | string  | Тип данных, который отдаст сервер: *file*, *base64* or *url* |

#####Data
Формат данных - это self executing функция, которая возвращает объект формата [pdfmake](http://pdfmake.org/index.html#/gettingstarted). Ко всем возможностям *pdfmake* добавляется возможность вставлять в PDF документ anychart чарты. Чарт добавляется как поле *chart* которому соответсвует объект определенного формата. Объект, описывающий чарт имеет следующий формат:

| Name  | Possible values | Description |
| ------------- | ------------- | ------------- |
| data  | javascript, JSON, XML, SVG string | Строка, определяющая непосредственно сам чарт. |
| dataType | javascript, JSON, XML, SVG | Опеределяет тип данных в поле data |
| containerId  | any string  | Определяет id контейнера который задан чарту в поле data. Этот id должен соответствовать контейнеру, в который будет отрисован чарт. |
К чарту могут быть применены все свойства, которые можно применить к *image* в pdmake, смотрите пример ниже.

#### Examples
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
Чтобы данные такого формата отправить на сервер, их необходимо преврить в строку. Самое простое - заинлайнить их и превратить в строку

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

#### Curl
```
todo
```

#### Response
```
todo
```
```
todo
```

### Generate vector image - PDF/SVG/PS
todo: description
```
POST /vector-image
```

#### Input
| Name  | Type | Description |
| ------------- | ------------- | ------------- |
| file_name  | string  | todo desc |
| file_type  | string  | PDF/SVG/PS |
| data  | string | JavaScript string, SVG string, JSON string or XML string |
| data_type  | string  | script, svg, json, xml |
| response_type  | string  | file, base64string or url |
| width  | ???  | ??? |
| height  | ???  | ??? |
| aspect-ratio  | ???  | ??? |
| background  | ???  | ??? |

#### Example
```
todo
```

#### Curl
```
todo
```

#### Response
```
todo
```
```
todo
```

### Generate raster image - PNG/JPG/TIFF
todo: description
```
POST /raster-image
```

#### Input
| Name  | Type | Description |
| ------------- | ------------- | ------------- |
| data  | string | **required** JavaScript, SVG, JSON or XML |
| data_type  | string  | **required** script, svg, json, xml |
| file_name  | string  | todo desc |
| file_type  | string  | PNG/JPG/TIFF |
| response_type  | string  | file, base64string or url |
| background  | ???  | ??? |
| border  | ???  | ??? |
| blur  | ???  | ??? |
| contrast  | ???  | ??? |
| crop  | ???  | ??? |
| frame  | ???  | ??? |
| gamma  | ???  | ??? |
| monochrome  | ???  | ??? |
| negative  | ???  | ??? |
| noize  | ???  | ??? |
| quality  | ???  | ??? |


#### Example
```
{
  "file_name": "anychart.png",
  "data": "var chart = anychart.pie(); chart.data([10, 20, 8, 5, 12, 9]); chart.container('container'); chart.draw();",
  "data_type": "script",
  "response_type": "file"
}
```

#### Curl
```
todo
```

#### Response
```
HTTP/1.1 200 OK
Content-Type: image/png
todo
```
```
todo
```

### Export as data file - CSV/XLSX (Excel)
todo: description
```
POST /data-file
```

#### Input
| Name  | Type | Description |
| ------------- | ------------- | ------------- |
| file_name  | string  | todo desc |
| file_type  | string  | CSV/XLSX |
| data  | string | CSV string |
| response_type  | string  | file, url |

#### Example
```
todo
```

#### Curl
```
todo
```

#### Response
```
todo
```
```
todo
```



### Get server status

## Security recommendations
 - allow access origin
 - https
 - авторизация
 
## System recommendations 
- рассказываем про аналог супервизора
- рассказываем про рекомендованную мощность
- рассказываем про логирование
 
## CJK and Custom fonts 
Рассказываем как сетапить фонты

## Troubleshooting
Рассказываем что делать в проблемных случаях
- как проверить что image magic или кто у нас там второй установлен
- как провер курлом или чем нибудь еще что /status доступен
- как понять что нужно ставить доп шрифты

## Tests
Рассказываем как у нас устроены тесты
- как запустить
- как добавить свой


## License
[© AnyChart.com - JavaScript charts](http://www.anychart.com). AnyChart Export Server released under the [Apache 2.0 License](https://github.com/AnyChart/node-export-server/blob/master/LICENSE).

