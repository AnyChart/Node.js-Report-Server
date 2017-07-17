(function() {
  return {
    "pageMargins": [30, 70, 30, 20],
    "header": {
      "margin": [10, 10, 15, 0],
      "columns": [
        {
          "margin": 0,
          "image": "data:image/png;base64,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UK5vQ72gwaB4g8GqNc3o4W0GDQPEHg1Rru9HC2gwaB4g8H6j9RXN6ODtokeIPB+hkSRB9qvGMYxWL7H8DXd6He2iB4g8H6PaFPM2/AVzeh3tokeIPB+j2h+uCu70O9tEjxB4P0e0P1w17ejhbQYNA8wc/oekK95r3UyN6ONtBg0DxDkPVBzPQIEh5fZZ8s+WfLPlLo0HuTnB2qeYct7qYG9DvbRA8QeWUOScGnjd4OyFLzDlvdTE3od7aJHiDyg5JwaeF3g7IUvMOW91MTeh2tokeIPLKHJODTwu8Hap5hy3upib0OdtEDxBxZQ5JwaeF3g7IUvMOW91MDehztBg0DxB5Qck4NPC7wdqnmHLe6mBvQ520QPEHFlDknBp4XeDshS9w5b3UwN6HO2iB4g4sock4NPC7wdkKXmHLe6mhvQ720QPEHFByTg08LvB+QpeYct7qYG9DnbRA8QeWUAQHchFE7pppStZMen3LtOEsmaAnUAAAAM1MngIqBgfRZss+WbLNlnyn+Bmfh3oc7aJHiDyzSdfycraIHiDyzXO9tEBQfkXlHIeogP8Q1u+CHZoNAMwuxCObEhOf8LuJn29qfw9jyFPVgwAHXl17PQQ3Z2EPtQJaH+OLcIhASI7qdAd1JZ/2DLVUpSlOUpTlKUpSlKUpSlKUlQ176lOl2eBAY0hdQOn+aOayPeOyHQkPTsiCO4IUwui6KYXRTCmFMKYU1NTC6LouimF0XRTCmF0XRTC6LpD1JoBNGPEAkdT/UCiASAHjSED3AK7+f6Cx1Y+sZWHrGVjKxlYysZWMrGVjKxlYysZWMrGVjKxlYysfWMrGVjKx9dOTFNq/wDTj//aAAwDAQACAAMAAAAQ88888888888888888888888888888888888888888888888888888888888888888888888888888888zy26y3/y7/6yz9y088888884KnDiDARDDjDDDCE9z8888888vkV8888888888888tv8APPPPPPLk1PPPPPPPPMPPPPKa/PPPPPPPg1PPPPPPPPDzzzPKa/PPPPPPPo1PPPPPPPPP8s6/Ka/PPPPPPPg1PPPPOPsutb/f/Ka/PPPPPPPq1PPPPPUc9fH7f/KYvPPPPPPPh1PPPPPYwAPG+U/Ka/PPPPPPOl1Od9tvYwBIwgmPL6/PPPPPPKlV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",
          "width": 50,
          "height": 50
        },
        {
          "text": "AnyChart",
          "margin": [0, 17, 0, 0],
          "fontWeight": "bold"
        },
        {
          "width": "*",
          "alignment": "right",
          "text": "PDF Report sample",
          "margin": [0, 17, 0, 0]
        }
      ]
    },
    "content": [
      {
        "alignment": "center",
        "chart": {
          "data": "chart1.js",
          "dataType": "javascript"
        },
        "fit": [500, 500]
      },
      {
        "columns": [
          {
            "style": "tables",
            "table": {
              "headerRows": 1,
              "widths": [65, "*", "*", "*", "*"],
              "body": [
                [
                  {"text": "Earnings History", "style": 'tableHeader'},
                  {"text": "Mar 31, 17", "style": 'tableHeader'},
                  {"text": "Dec 31, 16", "style": 'tableHeader'},
                  {"text": "Sep 30, 16", "style": 'tableHeader'},
                  {"text": "Jun 30, 16", "style": 'tableHeader'}
                ],
                [{"text": "EPS Actual", "alignment": "left"}, "2.10", "3.33", "1.67", "1.42"],
                [{"text": "EPS Estimate", "alignment": "left"}, "2.02", "3.21", "1.65", "1.38"],
                [{"text": "Difference", "alignment": "left"}, "0.08", "0.15", "0.01", "0.04"],
                [{"text": "Surprise, %", "alignment": "left"}, "4.0%", "4.7%", "0.6%", "2.9%"]
              ]
            },
            "layout": {
              "hLineWidth": function(i, node) {
                return (i === 0 || i === node['table']['body']['length']) ? 1 : 0;
              },
              "vLineWidth": function(i, node) {
                return 0;
              },
              "fillColor": function(i, node) {
                return i === 0 ? '#7FDBFF' : null;
              }
            }
          },
          {
            "style": "tables",
            "table": {
              "headerRows": 1,
              "widths": [65, "*", "*", "*", "*"],
              "body": [
                [
                  {"text": "Earnings History", "style": 'tableHeader'},
                  {"text": "Mar 31, 17", "style": 'tableHeader'},
                  {"text": "Dec 31, 16", "style": 'tableHeader'},
                  {"text": "Sep 30, 16", "style": 'tableHeader'},
                  {"text": "Jun 30, 16", "style": 'tableHeader'}
                ],
                [{"text": "Average Estimate", "alignment": "left"}, "1.57", "1.89", "8.94", "10.53"],
                [{"text": "High Estimate", "alignment": "left"}, "1.68", "2.18", "9.60", "12.49"],
                [{"text": "Low Estimate", "alignment": "left"}, "1.50", "1.61", "8.64", "9.16"],
                [{"text": "Year Ago EPS", "alignment": "left"}, "1.42", "1.67", "8.31", "8.94"]
              ]
            },
            "layout": {
              "hLineWidth": function(i, node) {
                return (i === 0 || i === node['table']['body']['length']) ? 1 : 0;
              },
              "vLineWidth": function(i, node) {
                return 0;
              },
              "fillColor": function(i, node) {
                return i === 0 ? '#7FDBFF' : null;
              }
            }
          }
        ],
        "columnGap": 10,
        "margin": [0, 20, 0, 10]
      },
      {
        "text": "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Accusantium, alias animi aperiam architecto autem consequatur dicta dignissimos exercitationem, laboriosam laborum natus necessitatibus neque obcaecati quaerat reiciendis, sequi tempora velit voluptatum. Architecto cumque dolorem ducimus harum iusto magnam omnis, sit voluptate. Ab adipisci at earum error est explicabo incidunt iste modi, neque optio, provident sint tenetur!",
        "color": "gray",
        "italics": true,
        "alignment": "justify",
        "margin": [0, 10, 0, 10]
      },
      {
        "columns": [
          {
            "chart": {
              "data": "chart2.json",
              "dataType": "json"
            },
            "fit": [250, 300]
          },
          {
            "chart": {
              "data": "chart2.json",
              "dataType": "json"
            },
            "fit": [250, 300]
          }
        ],
        "columnGap": 10
      }
    ],
    "footer": {
      "style": "footer",
      "columns": [
        {
          "text": "Created by node-export-server (https://github.com/AnyChart/node-export-server)",
          "alignment": "left",
          "width": "auto"
        },
        {"text": "© 2017 AnyChart All rights reserved.", "alignment": "right", "width": "*"}
      ]
    },
    "styles": {
      "footer": {
        "margin": [10, 0, 10, 10],
        "color": "gray",
        "fontSize": 9
      },
      "tables": {
        "fontSize": 7,
        "alignment": "right"
      },
      "tableHeader": {
        "alignment": "left",
        "bold": true,
        "fontSize": 7.5
      }
    }
  }
})();