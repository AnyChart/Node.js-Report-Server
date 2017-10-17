[<img src="https://cdn.anychart.com/images/logo-transparent-segoe.png" width="234px" alt="AnyChart - Robust JavaScript/HTML5 Chart library for any project">](https://anychart.com)

# AnyChart Node.js Report Server 
AnyChart Node.js Report Server is a lightweight web server that provides API for generating [vector graphics (PDF, SVG, or PS)](https://github.com/AnyChart/Node.js-Report-Server#generate-vector-image---pdfsvgps), [bitmap images (PNG, JPG, or TIFF)](https://github.com/AnyChart/Node.js-Report-Server#generate-raster-image---pngjpgtiff), [PDF reports](https://github.com/AnyChart/Node.js-Report-Server#generate-pdf-report), and [data in CSV and XLSX (Excel)](https://github.com/AnyChart/Node.js-Report-Server#export-as-data-file---csvxlsx-excel). It uses the JavaScript code as well as JSON and XML configurations as input data. The server is very easy to install and customize, you can run it on any major platform: Linux, Windows, and macOS. It is ideal for creating report systems that send charts via email or social network sharing tools.

## Installation

### Prerequisite

1. Make sure you have nodejs is installed. Navigate to  [https://nodejs.org/en/download/](https://nodejs.org/en/download/) to get it.

2. [ImageMagick](https://www.imagemagick.org/script/index.php) and [librsvg](https://github.com/GNOME/librsvg) are required. 

Install ImageMagick and librsvg on Linux:

```
apt-get install imagemagick librsvg2-dev
```

Install ImageMagick and librsvg on Mac OS X

```
brew install imagemagick librsvg
```

Install ImageMagick and librsvg on Windows

- [imagemagick](https://www.imagemagick.org/script/download.php)<br>
- [GTK+ bundle](http://win32builder.gnome.org/gtk+-bundle_3.6.4-20131201_win64.zip)<br>
- [RSVG lib](https://downloads.sourceforge.net/project/tumagcc/converters/rsvg-convert.exe?r=https%3A%2F%2Fsourceforge.net%2Fprojects%2Ftumagcc%2Ffiles%2Frsvg-convert.exe%2Fdownload&ts=1500995628&use_mirror=netix)

### AnyChart Report Server

Installl AnyChart Node.js Report Server using npm package manager:

```
npm install anychart-export-server -g
```
Or clone git repository:

```
git clone git@github.com:AnyChart/node-export-server.git
npm install
npm link
```

## Running

To run the server:

```
> anychart-export-server [arguments]
1:32:48 PM - info:    Export server listening on port 3000!
```

### Options

| Name  | Type | Description |
| ------------- | ------------- | ------------- |
| port  | number  | TCP port |
| output-dir  | string | Output folder. |
| disable-scripts-executing | boolean | Disable or enable scripts. |
| log-level | string | Log level: error, warn, info, verbose, debug, silly |
| log-file | string | Path to log file, by default log goes only to a console output. |
| disable-playground | boolean | Turns on and off playground app that is accessible in /playground ) |

## Tutorials

*coming soon*

*Contributions are welcomed!*

- Running AnyChart Export Server on Digital Ocean 
- Running AnyChart Export Server on AWS S2
- Running AnyChart Export Server on Microsoft Asure

## Server API

### Generate PDF report
Generate PDF reports with anychart charts, text, columns, tables, and images.

```
POST /pdf-report
```

#### Input
| Name  | Type | Description |
| ------------- | ------------- | ------------- |
| file_name  | string  | File name. Used when *response_type* set to *file*. |
| data | javascript string | Input data.  [Data format description](https://github.com/AnyChart/node-export-server/blob/master/pdf-report-data-format.md). |
| response_type  | string  | Output data format. Possible values: *file*, *base64* or *url*. Default: *file* |
| resources  | Array.<string>  | External resources to be included in the process of image generation, see [External Resources](#user-content-external-resources). |

#### Example
```
{
	"response_type": "base64",
	"data": "(function() {return {content: [{\"chart\": {\"data\": \"chart = anychart.line([1,2,3]); chart.container('custom_container_id').draw();\",\"dataType\": \"javascript\",\"containerId\": \"custom_container_id\"},\"fit\": [500, 500]}]}})();"
}
```

#### Curl
```
curl -H "Content-Type: application/json" -X POST -d '{"response_type":"base64","data":"(function() {return {content: [{\"chart\": {\"data\": \"chart = anychart.line([1,2,3]); chart.container('custom_container_id').draw();\",\"dataType\": \"javascript\",\"containerId\": \"custom_container_id\"},\"fit\": [500, 500]}]}})();"}' http://localhost:3000/pdf-report
```

#### Response
```
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
```
```
{"data":"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Zy/aOrsP3gJ4/nK9PdlX+33u4aOzF68cfmX9PwAAHDV3p2eupaZq4zdvd1pi8Wwutz9brlTi3/SPTdz69cHC6Z6Bmdn5w6+s/wcAgKOm2vzvf+ansrfXGotntrb3ZyuVSvUPvvgqmegdrP5cebz2qXVmP7K6uvrxkwAAwMfW19f/786/JjV15+qNm7VxsVg61p4ol8v7sw8Wl9qTfUHw77Hf9NzD070Dh1951vv/EFnyC9ElvxBRDQvv/fRs/+Xh2nhj81XX2fMHZ8cnb49cn6iNd/P51lg8nw8OubL9B6JLfiG65BciqmHhzWxtHz+V3HydKRZLI2Op0fHJ2vMLv61kc7mZ2flTXX3Z3O6e87/QTOQXokt+IaIaGd7p9NyJjq6Tid4z5y7mg/dv7x9rT6w9e/GuXB65PtHW2Z3oHezuv/zk6fPDL2v/geiSX4gu+YWIanB4g0Lh4LHfD5RKpf+Y/RT7D0SX/EJ0yS9E1GcQ3s/gJUDTkl+ILvmFiBJeAAAAAAAAAAAAAAAAAAAAAAAAAACAZrP5OnPjh58uXLn683S6UqmEXQ5Qt9HxyT83/g67CqA+639tDI+lBoZGptNz2dxu2OUAzaJQKJ7uHbh+81Z1F7o0PDrx492wKwLqsLT6pNr8t8Tia89ehF0LUId8EMQ6u6uX3er1t5ri/svDYVcENIvF5dWewaHauNo/tHV2uwUAEXL73i/jk7e/7Pha/w/R8vuTp30XvquNd7LZ1lg8t+sWANAId6dnrqWmauM3b3daYvFsLhduSUC9Os58q/+HaAmCwk72/QV3YWkl2Xc+3HqA5lFt/vc/81PZ22uNxTNb2+GWBNRL/w/RNb+41Bbvnn+0HHYhQLNITd25euNmbVwslo61J8rlcrglAfXS/0MUld69G/p+rLOn//nL9bBrAZrI/fTs/pmjjc1XXWfdf4To0f9D5JTL5UvD10bHJ6v/BYRdC9BcMlvbx08lN19nisXSyFiquhGFXRFQN/0/RM7K4z+SfeeDoFC9/tYevn0DaJjp9NyJjq6Tid4z5y7mgyDscoC66f8hcqbu3GuJxQ8+nL8DGikoFGw7AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHBk/QOsQzpcCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDkKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMzYwIDAwMDAwIG4gCjAwMDAwMDAzMTEgMDAwMDAgbiAKMDAwMDAwMTUxMiAwMDAwMCBuIAowMDAwMDAwNDE3IDAwMDAwIG4gCjAwMDAwMDAxMjUgMDAwMDAgbiAKMDAwMDAwMDAxNSAwMDAwMCBuIAowMDAwMDAwMjE3IDAwMDAwIG4gCjAwMDAwMDA1NDIgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA5Ci9Sb290IDIgMCBSCi9JbmZvIDcgMCBSCj4+CnN0YXJ0eHJlZgoxNjIwNgolJUVPRgo="}
```

### Generate vector image - PDF/SVG/PS

Generate vector images. PDF and PS files allow quality scaling and copying texts.

```
POST /vector-image
```

#### Input
| Name  | Type | Description |
| ------------- | ------------- | ------------- |
| data  | string | **required** Input data. JavaScript, SVG, JSON or XML. |
| data_type  | string  | **required** Type of input data: *javascript*, *svg*, *json*, *xml* |
| file_name  | string  | File name, if *response_type* set to *file* |
| file_type  | string  | Output file type. Possible values: *PDF*, *SVG* or *PS*. Defauilt: *PDF*  |
| response_type  | string  | Output data format. Possible values: *file*, *base64* or *url*. Default: *file* |
| resources  | Array.<string>  | External resources to be included in process of image generation, see [External Resources](#user-content-external-resources) for details. |
| width  | number | Output image width |
| height  | number  | Output image height |
| aspect-ratio  | boolean  | Whether to preserve the aspect ratio (default: false) |
| background  | string  | Set the background color (black, white, #abccee, #aaa and etc. default: none) |

#### Example
```
{
  "background": "#f00",
  "aspect-ratio": true,
  "width": 200,
  "height": 1000,
  "data_type": "javascript",
  "file_type": "pdf",
  "response_type": "base64",
  "data": "var chart = anychart.pie(); chart.data([10, 20, 8, 5, 12, 9]); chart.container('container'); chart.draw();"
}
```

#### Curl
```
curl -H "Content-Type: application/json" -X POST -d '{"response_type":"base64","background": "#f00","aspect-ratio":true,"width":200,"height":1000,"data_type":"javascript","file_type":"pdf","data":"var chart=anychart.pie();chart.data([10, 20, 8, 5, 12, 9]);chart.container('container');chart.draw();"}' http://localhost:3000/vector-image
```

#### Response
```
HTTP/1.1 200 OK
Content-Type:application/json; charset=utf-8
```
```
{"data":"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ZXIgKGNhaXJvIDEuMTQuMTAgKGh0dHA6Ly9jYWlyb2dyYXBoaWNzLm9yZykpCj4+CmVuZG9iagoxMyAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZwogICAvUGFnZXMgMSAwIFIKPj4KZW5kb2JqCnhyZWYKMCAxNAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDcwNjEgMDAwMDAgbiAKMDAwMDAwMDc3OCAwMDAwMCBuIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDA3NTYgMDAwMDAgbiAKMDAwMDAwNjc3OCAwMDAwMCBuIAowMDAwMDAwODg3IDAwMDAwIG4gCjAwMDAwMDExMDEgMDAwMDAgbiAKMDAwMDAwNjExNCAwMDAwMCBuIAowMDAwMDA2MTM3IDAwMDAwIG4gCjAwMDAwMDY0ODggMDAwMDAgbiAKMDAwMDAwNjUxMSAwMDAwMCBuIAowMDAwMDA3MTI2IDAwMDAwIG4gCjAwMDAwMDcyNTYgMDAwMDAgbiAKdHJhaWxlcgo8PCAvU2l6ZSAxNAogICAvUm9vdCAxMyAwIFIKICAgL0luZm8gMTIgMCBSCj4+CnN0YXJ0eHJlZgo3MzA5CiUlRU9GCg=="}
```

### Generate raster image - PNG/JPG/TIFF

Generate raster images from charts. 

```
POST /raster-image
```

#### Input
| Name  | Type | Description |
| ------------- | ------------- | ------------- |
| data  | string | **required** Input data. JavaScript, SVG, JSON or XML string. |
| data_type  | string  | **required** Type of input data. Possible values: *javascript*, *svg*, *json* or *xml*|
| file_name  | string  | File name. Needed when  *response_type* is set to *file* |
| file_type  | string  | Output file type. Possible values: *PNG*, *JPG* or *TIFF*. Default: *PNG* |
| response_type  | string  |  Output data format. Possible values: *file*, *base64* or *url*. Default: *file*|
| resources  | Array.<string>  | External resources to be included in process of image generation, see [External Resources](#user-content-external-resources) for details. |
| background  | ???  | Background color |
| border  | Array\.\<number\>  | Surround the image with a border of color [width, height]  |
| blur  | Array\.\<number\>  | Accepts a radius and optional sigma (standard deviation). [radius [, sigma]] |
| contrast  | number | Increases or reduces the image contrast. Accepts a multiplier. [+-]multiplier |
| crop  | Array\.\<number\> | Crops the image to the given width and height at the given x and y position. [width, height, x, y] |
| frame  | Array\.\<number\>  | Surround the image with an ornamental border. [width, height, outer bevel width, inner bevel width] |
| gamma  | number  | Level of gamma correction. Reasonable values extend from 0.8 to 2.3. |
| monochrome  | -  | Transforms the image to black and white. |
| negative  | -  | Replaces every pixel with its complementary color. |
| noize  | string, number  | Add or reduce noise in the image. Radius or Type. To add noise pass one of the following: *uniform*, *gaussian*, *multiplicative*, *impulse*, *laplacian*, *poisson*. Otherwise the argument will be interpreted as a radius which adjusts the weight of the effect. |
| quality  | number  | Adjusts the jpeg, png, tiff compression level. Value ranges from 0 to 100 (best). |


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
curl -H "Content-Type: application/json" -X POST -d '{"file_name": "anychart.png","data": "var chart = anychart.pie(); chart.data([10, 20, 8, 5, 12, 9]); chart.container('container'); chart.draw();","data_type": "javascript","response_type": "file"}' http://localhost:3000/raster-image
```

#### Response
```
HTTP/1.1 200 OK
Content-Disposition:attachment; filename=anychart.png
Content-Type: image/png
```

### Export as data file - CSV/XLSX (Excel)
Export chart data as CSV or XLSX file.

```
POST /data-file
```

#### Input
| Name  | Type | Description |
| ------------- | ------------- | ------------- |
| file_name  | string  | File name. Works when *response_type* is set to *file* |
| file_type  | string  | Output file type. Possible values: *CSV* or *XLSX*. Default: *XLSX* |
| data  | string | Input data. CSV string. |
| response_type  | string  | Output data format. Possible values: *file*, *url*. Default: *file* |

#### Example
```
{
  "file_name": "anychart.xlsx",
  "data": "x,value\n0,10\n1,20\n2,8\n3,5\n4,12\n5,9",
  "response_type": "file"
}
```

#### Curl
```
curl -H "Content-Type: application/json" -X POST -d '{"file_name": "anychart.xlsx","data": "x,value\n0,10\n1,20\n2,8\n3,5\n4,12\n5,9","response_type": "file"}' http://localhost:3000/data-file -o anychart.xlsx
```

#### Response
```
HTTP/1.1 200 OK
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename=anychart.xlsx
```

### Get server status

*coming soon*

## External resources
*coming soon*

External resources are required when:

- You need external data files
- You need to add geo data
- You need image for hatch fill or image fill


## Security recommendations
*coming soon*

 - allow access origin
 - https
 - authorization
 
## System recommendations 
*coming soon*

- supervisor
- performance
- logging
 
## CJK and Custom fonts 
*coming soon*

## Troubleshooting
*coming soon*

- check image magic and librsvg are installed
- curl /status
- check fonts are installed

## Tests
*coming soon*

- how to run
- how to add new


## License
[© AnyChart.com - JavaScript charts](http://www.anychart.com). AnyChart Export Server released under the [Apache 2.0 License](https://github.com/AnyChart/node-export-server/blob/master/LICENSE).

