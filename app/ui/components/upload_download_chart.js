import React, { Component, PropTypes } from 'react';
import * as d3 from 'd3';
import { bytesToSize } from '../utils/app_utils';

export default class UploadDownloadChart extends Component {
  static propTypes = {
    download: PropTypes.number.isRequired,
    upload: PropTypes.number.isRequired
  };

  componentDidMount() {
    this.initD3();
  }

  componentWillReceiveProps(nextProps) {
    this.update([nextProps.download, nextProps.upload]);
  }

  initD3() {
    const width = 100;
    const height = 100;
    const padding = 10;
    const radius = Math.min(width, height) / 2;
    this.colours = ['#5592d7', '#f7b558'];
    this.arc = d3.svg.arc()
    .outerRadius(radius - (padding / 2))
    .innerRadius(0);
    this.pie = d3.layout.pie()
    .sort(null)
    .value(d => d);
    this.svg = d3.select(this.uploadDownloadChart).insert('svg:svg')
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', `translate(${height / 2}, ${height / 2})`);
    this.update([this.props.download, this.props.upload]);
  }

  update(data) {
    if (!this.dataAvailable) {
      return this.defaultView();
    }
    const self = this;
    this.svg.selectAll('.arc').remove();
    const g = this.svg.selectAll('.arc')
               .data(this.pie(data))
               .enter().append('g')
               .attr('class', 'arc');

    g.append('path')
        .attr('d', this.arc)
        .style('fill', (d, i) => self.colours[i]);
  }

  defaultView() {
    const defaultColor = '#d6d6d6';
    const strokeColor = '#212121';
    const strokeWidth = 2;
    this.svg.selectAll('.arc').remove();

    const g = this.svg.selectAll('.arc')
               .data(this.pie([1]))
               .enter().append('g')
               .attr('class', 'arc');
    g.append('path')
       .attr('d', this.arc)
       .style('fill', defaultColor)
       .style('stroke', strokeColor)
       .style('stroke-width', strokeWidth);
  }

  render() {
    const { download, upload } = this.props;
    this.dataAvailable = ((download !== 0) || (upload !== 0));

    return (
      <div className="sec-2">
        <div className="card pie-chart">
          <h3 className="dash-title">Download vs Upload - This Session</h3>
          <span className="pie-chart-b">
            <div className="legends">
              <div className="legends-i download">
                <div className="legends-i-name">Total Data Downloaded:</div>
                <div className="legends-i-val">
                  {(this.dataAvailable ? bytesToSize(download) : 'No data yet.')}
                </div>
              </div>
              <div className="legends-i upload">
                <div className="legends-i-name">Total Data Upload:</div>
                <div className="legends-i-val">
                  {(this.dataAvailable ? bytesToSize(upload) : 'No data yet.')}
                </div>
              </div>
              <span ref={c => { this.uploadDownloadChart = c; }}>{' '}</span>
            </div>
          </span>
        </div>
      </div>
    );
  }
}
