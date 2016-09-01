import React, { Component, PropTypes } from 'react';
import { bytesToSize } from '../utils/app_utils';

export default class UploadDownloadChart extends Component {
  constructor() {
    super()
  }

  componentDidMount() {
    this.initD3();
  }

  componentWillReceiveProps(nextProps) {
    this.update([ nextProps.download, nextProps.upload ]);
  }

  render() {
    const { dashData } = this.props;
    this.dataAvailable = ((this.props.download !== 0) || (this.props.upload !== 0));

    return (
      <div className="sec-2">
        <div className="card pie-chart">
          <h3 className="dash-title">Download vs Upload - This Session</h3>
          <span className="pie-chart-b">
            <div className="legends">
              <div className="legends-i download">
                <div className="legends-i-name">Total Data Downloaded:</div>
                <div className="legends-i-val">{ (this.dataAvailable ? bytesToSize(this.props.download) : 'No data yet.') }</div>
              </div>
              <div className="legends-i upload">
                <div className="legends-i-name">Total Data Upload:</div>
                <div className="legends-i-val">{ (this.dataAvailable ? bytesToSize(this.props.upload) : 'No data yet.') }</div>
              </div>
              <span ref="uploadDownloadChart"></span>
            </div>
          </span>
        </div>
      </div>
    )
  }

  initD3() {
    var width = 100;
    var height = 100;
    var padding = 10;
    var radius = Math.min(width, height) / 2;
    this.colours = [ '#5592d7', '#f7b558' ];
    this.arc = d3.svg.arc()
    .outerRadius(radius - (padding / 2))
    .innerRadius(0);
    this.pie = d3.layout.pie()
    .sort(null)
    .value(function(d) {
      return d;
    });
    this.svg = d3.select(this.refs.uploadDownloadChart).insert('svg:svg')
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', 'translate(' + height / 2 + ',' + height / 2 + ')');
    this.update([ this.props.download, this.props.upload ]);
  }

  update(data) {
    if (!this.dataAvailable) {
      return this.defaultView();
    }
    var self = this;
    this.svg.selectAll('.arc').remove();
    var g = this.svg.selectAll('.arc')
               .data(this.pie(data))
               .enter().append('g')
               .attr('class', 'arc');

    g.append('path')
        .attr('d', this.arc)
        .style('fill', function(d, i) {
          return self.colours[i];
        });
  }

  defaultView() {
    var defaultColor = '#d6d6d6';
    var strokeColor = '#212121';
    var strokeWidth = 2;
    this.svg.selectAll('.arc').remove();
    var g = this.svg.selectAll('.arc')
               .data(this.pie([ 1 ]))
               .enter().append('g')
               .attr('class', 'arc');
    g.append('path')
       .attr('d', this.arc)
       .style('fill', defaultColor)
       .style('stroke', strokeColor)
       .style('stroke-width', strokeWidth);
  }
}
