// create pie chart with passed data
chart = anychart.pie3d([
  ['Oil shales', 11],
  ['Heavy oil', 3],
  ['Tar sands', 2],
  ['Proven reserves', 8],
  ['Future additions', 11],
  ['Unrecoverable', 22]
]);

// set chart title text settings
chart.title('Sources of energy (in ZJ)')
//set chart radius
    .radius('43%')
    // create empty area in pie chart
    .innerRadius('30%');

// set container id for the chart
chart.container('container');
// initiate chart drawing
chart.draw();