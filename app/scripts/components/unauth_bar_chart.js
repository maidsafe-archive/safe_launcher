var React = window.React;
var ReactDOM = window.ReactDOM;
var d3 = require('d3');
var UnauthGETChart = React.createClass({
  propTypes: {
    data: React.PropTypes.array
  },
  componentDidMount: function () {
    var margin = {
      top: 20,
      right: 20,
      bottom: 30,
      left: 40
    };
    this.width = 670 - margin.left - margin.right;
    this.height = 140 - margin.top - margin.bottom;

    var BAR_WIDTH = 10;
    var GUTTER_SCALE = 0.2;
    this.actualData = [];
    this.MAX_BARS = Math.floor((this.width - (this.width / (GUTTER_SCALE * 10))) / BAR_WIDTH) + 1;
    this.svg = d3.select(ReactDOM.findDOMNode(this))
                .append("svg")
                .attr("width", this.width + margin.left + margin.right)
                .attr("height", this.height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");;
    this.x = d3.scale.ordinal().rangeRoundBands([0, this.width], GUTTER_SCALE);
    this.y = d3.scale.linear().range([this.height, 0]);
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
    return React.DOM.span({id: 'barChart', className: 'bar-chart-b'});
  },
  add: function(d) {
    var self = this;
    var data = [];
      if (d != null) {
        self.actualData.splice(0, 0, d);
        if (self.actualData.length > self.MAX_BARS) {
          self.actualData.pop();
        }
      }
      for (var i in self.actualData) {
        data.push(self.actualData[i]);
      }
      while (data.length < self.MAX_BARS) {
        data.push(0);
      }

      this.x.domain(d3.range(self.MAX_BARS).reverse());
      this.y.domain([0, (d3.max(data, function(d) { return d; }) + 10) ]);

      var xAxis = d3.svg.axis()
          .scale(self.x)
          .orient("bottom")
          .tickFormat(function(d) { return '-' + (d+1) + 'm'})
          .tickValues(self.x.domain().filter(function(d) {
            return d !== 0 && !((d + 1)% 4);
          }))
          .outerTickSize(0);
      var yAxis = d3.svg.axis()
          .scale(self.y)
          .orient("left")
          .ticks(5)
          .outerTickSize(0);
      var yAxisRight = d3.svg.axis()
          .scale(self.y)
          .orient("right")
          .ticks(0)
          .outerTickSize(0);

      self.svg.selectAll('g').remove();
      self.svg.selectAll('rect').remove();

      self.svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + self.height + ")")
          .call(xAxis);

      self.svg.append("g")
          .attr("class", "y axis")
          .call(yAxis)
          .append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", ".71em")
          .style("text-anchor", "end").text('Count');

      self.svg.append("g")
          .attr("class", "y axis")
          .attr("transform", "translate(" + self.width + "," + 0 + ")")
          .call(yAxisRight);


      self.svg.select('.x.axis').transition().duration(300).call(xAxis);

      self.svg.select(".y.axis").transition().duration(300).call(yAxis)

      var bars = self.svg.selectAll(".bar").data(data);

      bars.exit()
        .transition()
        .duration(0)
        .attr("y", self.y(0))
        .attr("height", self.height - self.y(0))
        .style('fill-opacity', 1e-6)
        .remove();

      bars.enter().append("rect")
        .attr("class", "svg-get")
        .attr("y", self.y(0))
        .attr("height", self.height - self.y(0));

      bars.transition().duration(0)
          .attr("x", function(d,i) { return self.x(i); })
          .attr("width", self.x.rangeBand())
          .attr("y", self.y)
          .attr("height", function(d, i) {
            return self.height - self.y(d);
          });
  }
});
window.safeLauncher.value('UnauthGETChart', UnauthGETChart);
