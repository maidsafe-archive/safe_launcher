var React = window.React;
var ReactDOM = window.ReactDOM;
var d3 = window.d3;
var GroupBarChart = React.createClass({
  propTypes: {
    jsonData: React.PropTypes.object
  },
  componentDidMount: function () {
      this.initD3();
  },
  componentWillReceiveProps: function (nextProps) {
      this.add(nextProps.jsonData);
  },
  render: function() {
    return React.DOM.span(null, null);
  },
  initD3: function() {
    var margin = {
      top: 30,
      left: 50,
      right: 30,
      bottom: 30
    };
    var containerWidth = 650;
    var containerHeight = 140;
    this.BAR_WIDTH = 10;
    this.SMALL_GUTTER_WIDTH = 2;
    this.GUTTER_WIDTH = 8;
    this.OFFSET_TO_MAX_VALUE = 5;
    this.container = d3.select(ReactDOM.findDOMNode(this)).insert("svg:svg")
    .attr('width', containerWidth)
    .attr('height', containerHeight)
    .style('background-color', '#eaeaea')
    .append("svg:g");

    this.height = containerHeight - margin.top - margin.bottom;
    this.width = containerWidth - margin.right - margin.left;
    this.data = [{}, {}];
    this.actualDataSize = 0;
    this.filters = [];
    this.maxValue = 0;
    this.add(this.props.jsonData);
  },
  add: function(entry) {
    var self = this;
    var GROUPS = ['GETs', 'POSTs', 'PUTs', 'DELETEs'];
    var MAX_BARS = Math.floor(this.width / ((this.BAR_WIDTH * GROUPS.length) + this.GUTTER_WIDTH));
    var BAR_POSITION_OFFSET = (this.BAR_WIDTH * GROUPS.length) / 2;
    if (entry) {
      this.data.splice(1, 0, entry);
    }
    if (this.actualDataSize < MAX_BARS) {
      this.actualDataSize++;
    }
    if (this.data.length > MAX_BARS) {
      this.data.splice(this.data.length - 1, 1);
    } else {
      while (this.data.length <= MAX_BARS) {
        this.data.splice(this.data.length - 1, 0, {});
      }
    }
    var tempMax = d3.max(d3.entries(entry).map(function(d) {return d.value}));
    this.maxValue = tempMax > this.maxValue ? tempMax : this.maxValue;
    var xRange = this.data.map(function(d, i) {
      return (self.data.length === i) ? self.width : (self.width - ((self.data.length - (i + 1)) * ((self.BAR_WIDTH * GROUPS.length) + self.GUTTER_WIDTH)));
    });
    var xScale = d3.scaleOrdinal().range(xRange);
    var yScale = d3.scaleLinear().range([ self.height, 0 ]);
    xScale.domain(this.data.map(function(d, i) { return self.data.length - i - 1; }));
    yScale.domain([ 0, this.maxValue + this.OFFSET_TO_MAX_VALUE ]);
    this.container.selectAll('g').remove();
    var groups = this.container.selectAll("g")
                          .data(this.data)
                          .enter().append("g")
                          .attr("transform", function(d, i) {
                            return "translate(" + xScale(i) + ", 0)";
                          });
    var index = -1;
    GROUPS.forEach(function(key) {
      index++;
      groups.data(self.data).append('rect')
      .attr("y", function(d) {
        if (!d.hasOwnProperty(key)) {
          return 0;
        }
        return yScale(d[key]);
      })
      .attr("height", function(d) {
        if (!d.hasOwnProperty(key)) {
          return 0;
        }
        return self.height - yScale(d[key]);
      })
      .attr("width", function(d) {
          if (!d.hasOwnProperty(key)) {
            return 0;
          }
          return self.BAR_WIDTH - self.SMALL_GUTTER_WIDTH;
      })
      .attr('transform', 'translate(' + (index * self.BAR_WIDTH) + ', ' + 0 + ')')
    });
    var xAxis = d3.axisBottom().scale(xScale)
    .tickFormat(function(d) {
      return d === 0 ? '' : '-' + d + 'm';
    });
    var yAxisLeft = d3.axisLeft().scale(yScale);
    var yAxisRight = d3.axisRight().scale(yScale).tickValues('');
    this.container.append("g")
      .attr("class", "x-axis")
      .attr("transform", 'translate(0,' + this.height + ")")
      .call(xAxis);
    d3.selectAll('.x-axis .tick line').remove();
    d3.selectAll('.x-axis .tick text')
      .attr("transform", 'translate(' + BAR_POSITION_OFFSET + ',' + 0 + ")");
    this.container.append("g")
            .attr("class", "y axis")
            .call(yAxisLeft);
    this.container.append("g")
            .attr("class", "y axis")
            .attr("transform", 'translate(' + (this.width) + ',' + 0 + ")")
            .call(yAxisRight);
  }
});
window.safeLauncher.value('GroupBarChart', GroupBarChart);
