var React = window.React;
var ReactDOM = window.ReactDOM;
var d3 = window.d3;
var UnauthGETChart = React.createClass({
  propTypes: {
    data: React.PropTypes.array
  },
  componentDidMount: function () {
    var margin = {
      top: 12,
      left: 12,
      right: 35,
      bottom: 25
    };
    var padding = 24;
    var containerWidth = 670;
    var containerHeight = 140;
    this.BAR_WIDTH = 16;
    this.GUTTER_WIDTH = 2;
    this.OFFSET_TO_MAX_VALUE = 5;
    this.BAR_POSITION_OFFSET = (this.BAR_WIDTH - this.GUTTER_WIDTH) / 2;
    this.container = d3.select(ReactDOM.findDOMNode(this)).insert("svg:svg")
    .attr('width', containerWidth)
    .attr('height', containerHeight)
    .style('background-color', '#eaeaea')
    .append("svg:g");
    this.container = this.container.append('g')
    .attr('transform', 'translate(' + (padding + margin.left) + ',' + margin.top + ')');
    this.height = containerHeight - margin.top - margin.bottom;
    this.width = containerWidth - margin.right - margin.left;
    this.MAX_BARS = Math.floor(this.width / this.BAR_WIDTH);
    this.data = [ 0, 0 ];
    this.actualDataSize = 0;
    this.add();

    var tempData = this.props.data;
    if (this.props.data.length > 0) {
      var tempData = this.props.data;
      if (tempData.length > this.MAX_BARS) {
        tempData = tempData.slice(tempData.length - this.MAX_BARS);
      }
      for (var i in tempData) {
          this.add(tempData[i]);
      }
    }
  },
  componentWillReceiveProps: function (nextProps) {
      this.add(nextProps.data[nextProps.data.length - 1]);
  },
  render: function() {
    return React.DOM.span({id: 'barChart'});
  },
  add: function(entry) {
    var self = this;
    if (entry !== undefined) {
      this.data.splice(1, 0, entry);
      if (this.actualDataSize < this.MAX_BARS) {
        this.actualDataSize++;
      }
    }
    if (this.data.length > this.MAX_BARS) {
      this.data.splice(this.data.length - 2, 1);
    } else {
      while (this.data.length <= this.MAX_BARS) {
        this.data.splice(this.data.length - 1, 0, 0);
      }
    }
    var xRange = this.data.map(function(d, i) {
      return self.width - ((self.data.length - i) * self.BAR_WIDTH);
    });
    var xScale = d3.scaleOrdinal().range(xRange);
    var yScale = d3.scaleLinear().range([ this.height, 0 ]);
    xScale.domain(this.data.map(function(d, i) { return self.data.length - i - 1; }));
    yScale.domain([ 0, d3.max(this.data, function(d) {return d + self.OFFSET_TO_MAX_VALUE;}) ]);
    this.container.selectAll('g').remove();
    var groups = this.container.selectAll("g")
                  .data(this.data)
                  .enter().append("g")
                  .attr("transform", function(d, i) {
                    return "translate(" + (xScale(i) - self.BAR_POSITION_OFFSET) + ", 0)";
                  });
    groups.append('rect')
            .attr("y", function(d) { return yScale(d); })
            .attr("height", function(d) { return self.height - yScale(d); })
            .attr("width", this.BAR_WIDTH - this.GUTTER_WIDTH)
            .attr('class', 'svg-get');
    var xAxis = d3.axisBottom().scale(xScale).tickValues(xScale.domain().filter(function(d) {
        return (self.actualDataSize === d) || (self.actualDataSize >= d) && !(d % 4);
      })).tickFormat(function(d) { return d === 0 ? '' : '-' + d + 'm'});
    var yAxisLeft = d3.axisLeft().scale(yScale);
    var yAxisRight = d3.axisRight().scale(yScale).tickValues('');
    this.container.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + this.height + ")")
        .call(xAxis);
    this.container.append("g")
      .attr("class", "y axis")
      .call(yAxisLeft);
    this.container.append("g")
      .attr("class", "y axis")
      .attr("transform", 'translate(' + (this.width - this.BAR_WIDTH - this.GUTTER_WIDTH) + ',' + 0 + ")")
      .call(yAxisRight);
  }
});
window.safeLauncher.value('UnauthGETChart', UnauthGETChart);
