var React = window.React;
var ReactDOM = window.ReactDOM;
var d3 = window.d3;
var Math = window.Math;
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
  bytesToSize: function(bytes) {
      var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      if (bytes == 0) return '0 ' + sizes[0];
      var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
      if (i == 0) return bytes + ' ' + sizes[i];
      return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
  },
  render: function() {
    return React.DOM.span({className: 'pie-chart-b'}, [
      React.DOM.div({className: 'legends'}, [
        React.DOM.div({className: 'legends-i download'}, [
          React.DOM.div({className: 'legends-i-name'}, 'Download'),
          React.DOM.div({className: 'legends-i-val'}, this.bytesToSize(this.props.download))
        ]),
        React.DOM.div({className: 'legends-i upload'}, [
          React.DOM.div({className: 'legends-i-name'}, 'Upload'),
          React.DOM.div({className: 'legends-i-val'}, this.bytesToSize(this.props.upload))
        ])
      ])
    ]);
  },
  initD3: function() {
    var width = 105;
    var height = 105;
    var radius = Math.min(width, height) / 2;
    this.colours = ["#5592d7", "#f7b558"];
    this.arc = d3.arc()
    .outerRadius(radius)
    .innerRadius(0);
    this.pie = d3.pie()
    .sort(null)
    .value(function(d) { return d; });
    this.svg = d3.select(ReactDOM.findDOMNode(this)).insert("svg:svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(" + height / 2 + "," + height / 2 + ")");
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
