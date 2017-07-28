anychart.onDocumentReady(function () {
  var data = getData();

  // create venn diagram
  chart = anychart.venn(data);

  // set chart stroke
  chart.stroke('2 #fff');

  // set labels settings
  chart.labels().format('{%Name}');

  // set font color for hover intersections labels
  chart.intersections().hoverFill('black 0.25');

  // set intersections labels settings
  chart.intersections().labels()
      .fontWeight('bold')
      .format('{%Name}');

  // set legend settings
  chart.legend()
      .position('right')
      .itemsLayout('vertical')
      .padding({left: 35});

  // set tooltip settings
  chart.tooltip().titleFormat('{%Name}');

  // set container id for the chart
  chart.container('container');
  // initiate chart drawing
  chart.draw();
});

function getData() {
  return [{
    x: 'A',
    name: 'Data Science',
    value: 100,
    stroke: 'none',
    label: {
      fontColor: '#3b8ad8',
      fontSize: 14
    }
  }, {
    x: 'B',
    name: 'Computer Science',
    value: 25
  }, {
    x: 'C',
    name: 'Math and Statistics',
    value: 25
  }, {
    x: 'D',
    name: 'Subject Matter Expertise',
    value: 25
  }, {
    x: ['A', 'B'],
    name: 'Computer Science',
    value: 50
  }, {
    x: ['A', 'C'],
    name: 'Math and Statistics',
    value: 50
  }, {
    x: ['A', 'D'],
    name: 'Subject Matter Expertise',
    value: 50
  },

    {
      x: ['B', 'C'],
      name: 'Machine\nLearning',
      value: 5
    }, {
      x: ['C', 'D'],
      name: 'Traditional\nResearch',
      value: 5
    }, {
      x: ['D', 'B'],
      name: 'Traditional\nSoftware',
      value: 5
    }, {
      x: ['B', 'C', 'D'],
      name: 'Unicorn',
      value: 5
    }];
}