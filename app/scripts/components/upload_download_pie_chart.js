var React = window.React;
var ReactDOM = window.ReactDOM;
var d3 = window.d3;
var UploadDownloadPieChart = React.createClass({
  propTypes: {
    upload: React.PropTypes.number,
    download: React.PropTypes.number
  },
  componentDidMount: function () {
      this.initD3();
  },
  componentWillReceiveProps: function (nextProps) {
      this.update([nextProps.download, nextProps.upload]);
  },
  render: function() {
    return React.DOM.span(null, null);
  },
  initD3: function() {
    var width = 340;
    var height = 200;
    var radius = Math.min(width, height) / 2;
    this.colours = ["#98abc5", "#8a89a6"];
    this.arc = d3.arc()
    .outerRadius(radius - 10)
    .innerRadius(0);
    this.pie = d3.pie()
    .sort(null)
    .value(function(d) { return d; });
    this.svg = d3.select(ReactDOM.findDOMNode(this)).insert("svg:svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
    this.update([this.props.download, this.props.upload]);
  },
  update: function(data) {
    var self = this;
    this.svg.selectAll(".arc").remove();
    var g = this.svg.selectAll(".arc")
               .data(this.pie(data))
               .enter().append("g")
               .attr("class", "arc");

    g.append("path")
        .attr("d", this.arc)
        .style("fill", function(d, i) { return self.colours[i]; });
  }
});

window.safeLauncher.value('UploadDownloadPieChart', UploadDownloadPieChart);
