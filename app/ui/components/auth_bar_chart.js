import React, { Component, PropTypes } from 'react';
import * as d3 from 'd3';

export default class AuthBarChart extends Component {
  static propTypes = {
    dashData: PropTypes.object.isRequired,
    authHTTPMethods: PropTypes.array.isRequired
  };

  componentDidMount() {
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    this.width = 680 - margin.left - margin.right;
    this.height = 140 - margin.top - margin.bottom;

    this.BAR_WIDTH = 8;
    this.SMALL_GUTTER_WIDTH = 2;
    const GUTTER_SCALE = 0.2;

    this.groups = ['PUT', 'GET', 'POST', 'DELETE'];
    this.MAX_OFFSET = 10;

    this.actualData = [[], [], [], []];
    this.colours = ['svg-put', 'svg-get', 'svg-post', 'svg-delete'];

    this.svg = d3.select(this.authBarChart).append('svg')
      .attr('width', this.width + margin.left + margin.right)
      .attr('height', this.height + margin.top + margin.bottom)
      .append('svg:g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    this.MAX_BARS = Math.floor((this.width - (this.width / (GUTTER_SCALE * 10))) /
      (this.BAR_WIDTH + this.SMALL_GUTTER_WIDTH));

    this.x0 = d3.scale.ordinal()
      .domain(d3.range(Math.floor(this.MAX_BARS / this.groups.length)).reverse())
      .rangeBands([0, this.width], GUTTER_SCALE);

    this.xAxis = d3.svg.axis()
      .scale(this.x0)
      .orient('bottom')
      .tickFormat(val => (`- ${(val + 1)} m`))
      .outerTickSize(0);

    this.add();
    let tempData = this.props.authHTTPMethods;
    if (this.props.authHTTPMethods.length > 0) {
      if (tempData.length > this.MAX_BARS) {
        tempData = tempData.slice(tempData.length - this.MAX_BARS);
      }
      let i = null;
      for (i of tempData) {
        this.add(i);
      }
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.authHTTPMethods.length !== this.props.authHTTPMethods.length) {
      this.add(nextProps.authHTTPMethods[nextProps.authHTTPMethods.length - 1]);
    }
  }

  add(d) {
    const self = this;
    const data = [];
    if (d !== null) {
      const temp = d3.entries(d);
      temp.forEach((obj) => {
        this.actualData[this.groups.indexOf(obj.key)].splice(0, 0, obj.value);
      });
      if ((this.actualData[0].length * this.groups.length) > this.MAX_BARS) {
        this.groups.forEach((obj, index) => {
          this.actualData[index].pop();
        });
      }
    }
    const MAX_VALUE = d3.max(this.actualData, (val => d3.max(val))) || 0;

    const pushData = (index) => {
      data[index] = [];
      this.actualData[index].forEach((obj, j) => {
        data[index].push(this.actualData[index][j]);
      });
    };

    this.actualData.forEach((obj, index) => {
      pushData(index);
    });

    while ((data[0].length * this.groups.length) < this.MAX_BARS) {
      this.groups.forEach((obj, index) => {
        data[index].push(0);
      });
    }

    const y = d3.scale.linear()
      .domain([0, (MAX_VALUE + this.MAX_OFFSET)])
      .range([this.height, 0]);

    const x1 = d3.scale.ordinal()
      .domain(d3.range(this.groups.length))
      .rangeBands([0, this.x0.rangeBand()]);

    const yAxis = d3.svg.axis()
      .scale(y)
      .orient('left')
      .ticks(5)
      .outerTickSize(0);
    const yAxisRight = d3.svg.axis()
      .scale(y)
      .orient('right')
      .ticks(0)
      .outerTickSize(0);
    this.svg.selectAll('g').remove();
    this.svg.append('g')
      .attr('class', 'y axis')
      .call(yAxis)
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '.71em')
      .style('text-anchor', 'end')
      .text('Count');
    this.svg.append('g')
      .attr('class', 'y axis')
      .attr('transform', `translate(${this.width}, 0)`)
      .call(yAxisRight);
    this.svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', `translate(0, ${this.height})`)
      .call(this.xAxis);
    this.svg.append('g').selectAll('g')
      .data(data)
      .enter()
      .append('g')
      .attr('class', (val, i) => self.colours[i])
      .attr('transform', (val, i) => `translate(${x1(i)}, 0)`)
      .selectAll('rect')
      .data(val => val)
      .enter()
      .append('rect')
      .attr('width', x1.rangeBand() - this.SMALL_GUTTER_WIDTH)
      .attr('height', val => self.height - y(val))
      .attr('x', (val, index) => self.x0(index))
      .attr('y', y);
  }

  render() {
    const { dashData } = this.props;
    return (
      <div className="dash-cnt">
        <div className="sec-1">
          <div className="card bar-chart">
            <h3 className="dash-title">Network Activity - This Session</h3>
            <div className="filters">
              <div className="filters-i checkbox put always-checked">
                <label htmlFor="PUT">PUT</label>
              </div>
              <div className="filters-i checkbox get always-checked">
                <label htmlFor="GET">GET</label>
              </div>
              <div className="filters-i checkbox post always-checked">
                <label htmlFor="POST">POST</label>
              </div>
              <div className="filters-i checkbox delete always-checked">
                <label htmlFor="DELETED">DELETE</label>
              </div>
            </div>
            <span ref={c => { this.authBarChart = c; }}>{' '}</span>
            <div className="bar-chart-count">
              <div className="count">
                <div className="count-val">{ dashData.putsCount }</div>
                <div className="count-title">Total PUTs</div>
              </div>
              <div className="count">
                <div className="count-val">{ dashData.getsCount }</div>
                <div className="count-title">Total GETs</div>
              </div>
              <div className="count">
                <div className="count-val">{ dashData.postsCount }</div>
                <div className="count-title">Total POSTs</div>
              </div>
              <div className="count">
                <div className="count-val">{ dashData.deletesCount }</div>
                <div className="count-title">Total DELETEs</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
