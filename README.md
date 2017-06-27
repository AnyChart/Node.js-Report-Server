# AnyChart Export Server 

## API

### Create PDF report

### Export as PDF file

### Export as PNG image
Create PNG image from SVG or JavaScript input.
```
POST /png
```

#### Input
| Name  | Type | Description |
| ------------- | ------------- | ------------- |
| file_name  | string  | todo desc |
| data  | string | todo desc |
| data_type  | string  | script, svg, json, xml |
| response_type  | string  | file, base64string or url |

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


### Export as JPG image

### Export as CSV file

### Export as XLSX (Excel) file



