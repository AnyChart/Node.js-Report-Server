[<img src="https://cdn.anychart.com/images/logo-transparent-segoe.png" width="234px" alt="AnyChart - Robust JavaScript/HTML5 Chart library for any project">](https://anychart.com)

# AnyChart Export Server 

## Installation and running

### Installation
- Ставим через npm
- Ставим через git
- Ставим зависимости: rsvf-convert, imagemagic

### Running
- Запускаем через консоль

#### Options

| Name  | Type | Description |
| ------------- | ------------- | ------------- |
| port  | number  | todo desc |
| output-dir  | string | то куда будем сохранять все файлы |
| allow-scripts-executing  | boolean | можно ли запускать скрипты |

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
| file_name  | string  | todo desc |
| data | JSON | http://pdfmake.org/index.html#/gettingstarted |
| data_type  | string  | script, svg, json, xml |
| response_type  | string  | file, base64string or url |


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

