import React, { Component, PropTypes } from 'react';
import * as d3 from 'd3';

export default class UnAuthBarChart extends Component {
  static propTypes = {
    dashData: PropTypes.object.isRequired,
    unAuthGET: PropTypes.array.isRequired
  };

  componentDidMount() {
    const margin = {
      top: 20,
      right: 20,
      bottom: 30,
      left: 40
    };
    this.width = 670 - margin.left - margin.right;
    this.height = 140 - margin.top - margin.bottom;

    const BAR_WIDTH = 10;
    const GUTTER_SCALE = 0.2;
    this.actualData = [];
    this.MAX_BARS = Math.floor((this.width - (this.width / (GUTTER_SCALE * 10))) / BAR_WIDTH) + 1;
    this.svg = d3.select(this.unAuthBarChart)
                .append('svg')
                .attr('width', this.width + margin.left + margin.right)
                .attr('height', this.height + margin.top + margin.bottom)
                .append('g')
                .attr('transform', `translate(${margin.left}, ${margin.top})`);
    this.x = d3.scale.ordinal().rangeRoundBands([0, this.width], GUTTER_SCALE);
    this.y = d3.scale.linear().range([this.height, 0]);
    this.add(0);

    let tempData = this.props.unAuthGET;
    if (tempData.length > 0) {
      if (tempData.length > this.MAX_BARS) {
        tempData = tempData.slice(tempData.length - this.MAX_BARS);
      }
      let i = null;
      for (i of tempData) {
        this.add(tempData[i]);
      }
    }
  }

  componentWillReceiveProps(nextProps) {
    this.add(nextProps.unAuthGET[nextProps.unAuthGET.length - 1]);
  }

  add(d) {
    const self = this;
    const data = [];
    if (d !== null) {
      self.actualData.splice(0, 0, d);
      if (self.actualData.length > self.MAX_BARS) {
        self.actualData.pop();
      }
    }

    let i = null;
    for (i of self.actualData) {
      data.push(self.actualData[i]);
    }

    while (data.length < self.MAX_BARS) {
      data.push(0);
    }

    this.x.domain(d3.range(self.MAX_BARS).reverse());
    this.y.domain([0, (d3.max(data, (maxVal) => maxVal) + 10)]);

    const xAxis = d3.svg.axis()
        .scale(self.x)
        .orient('bottom')
        .tickFormat(val => (`- ${(val + 1)} m`))
        .tickValues(self.x.domain().filter(val => ((val !== 0) && (((val + 1) % 4) === 0))))
        .outerTickSize(0);
    const yAxis = d3.svg.axis()
        .scale(self.y)
        .orient('left')
        .ticks(5)
        .outerTickSize(0);
    const yAxisRight = d3.svg.axis()
        .scale(self.y)
        .orient('right')
        .ticks(0)
        .outerTickSize(0);

    self.svg.selectAll('g').remove();
    self.svg.selectAll('rect').remove();

    self.svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', `translate(0, ${self.height})`)
        .call(xAxis);

    self.svg.append('g')
        .attr('class', 'y axis')
        .call(yAxis)
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 6)
        .attr('dy', '.71em')
        .style('text-anchor', 'end')
        .text('Count');

    self.svg.append('g')
        .attr('class', 'y axis')
        .attr('transform', `translate(${self.width}, 0)`)
        .call(yAxisRight);

    self.svg.select('.x.axis').transition().duration(300).call(xAxis);

    self.svg.select('.y.axis').transition().duration(300).call(yAxis);

    const bars = self.svg.selectAll('.bar').data(data);

    bars.exit()
      .transition()
      .duration(0)
      .attr('y', self.y(0))
      .attr('height', self.height - self.y(0))
      .style('fill-opacity', 1e-6)
      .remove();

    bars.enter().append('rect')
      .attr('class', 'svg-get')
      .attr('y', self.y(0))
      .attr('height', self.height - self.y(0));

    bars.transition().duration(0)
        .attr('x', (val, index) => self.x(index))
        .attr('width', self.x.rangeBand())
        .attr('y', self.y)
        .attr('height', (val) => (self.height - self.y(val)));
  }

  render() {
    const { dashData } = this.props;

    return (
      <div className="dash-cnt">
        <div className="sec-1">
          <div className="card bar-chart">
            <h3 className="dash-title">Network Activity - This Session</h3>
            <div className="filters">
              <div className="filters-i checkbox get always-checked">
                <label htmlFor="GET">GET</label>
              </div>
            </div>
            <span ref={c => { this.unAuthBarChart = c; }}>{' '}</span>
            <div className="bar-chart-count">
              <div className="count">
                <div className="count-val">{ dashData.getsCount }</div>
                <div className="count-title">Total GETs</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
