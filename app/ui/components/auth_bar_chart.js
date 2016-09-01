import React, { Component, PropTypes } from 'react';
import * as d3 from "d3";

export default class AuthBarChart extends Component {
  constructor() {
    super()
  }

  componentDidMount() {
    var margin = { top: 20, right: 30, bottom: 30, left: 40 };
    this.width = 680 - margin.left - margin.right;
    this.height = 140 - margin.top - margin.bottom;

    this.BAR_WIDTH = 8;
    this.SMALL_GUTTER_WIDTH = 2;
    var GUTTER_SCALE = 0.2;

    this.groups = [ 'PUT', 'GET', 'POST', 'DELETE' ];
    this.MAX_OFFSET = 10;

    this.actualData = [ [], [], [], [] ];
    this.colours = [ 'svg-put', 'svg-get', 'svg-post', 'svg-delete' ];

    this.svg = d3.select(this.refs.authBarChart).append('svg')
        .attr('width', this.width + margin.left + margin.right)
        .attr('height', this.height + margin.top + margin.bottom)
        .append('svg:g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    this.MAX_BARS = Math.floor((this.width - (this.width / (GUTTER_SCALE * 10))) /
      (this.BAR_WIDTH + this.SMALL_GUTTER_WIDTH));

    this.x0 = d3.scale.ordinal()
        .domain(d3.range(Math.floor(this.MAX_BARS / this.groups.length)).reverse())
        .rangeBands([ 0, this.width ], GUTTER_SCALE);

    this.xAxis = d3.svg.axis()
                    .scale(this.x0)
                    .orient('bottom')
                    .tickFormat(function(d) {
                      return '-' + (d + 1) + 'm';
                    }).outerTickSize(0);

    this.add();
    var tempData = this.props.authHTTPMethods;
    if (this.props.authHTTPMethods.length > 0) {
      if (tempData.length > this.MAX_BARS) {
        tempData = tempData.slice(tempData.length - this.MAX_BARS);
      }
      for (var i in tempData) {
        this.add(tempData[i]);
      }
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.authHTTPMethods.length !== this.props.authHTTPMethods.length) {
      this.add(nextProps.authHTTPMethods[nextProps.authHTTPMethods.length - 1]);
    }
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
            <span ref="authBarChart"></span>
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
    )
  }

  add(d) {
    var self = this;
    var data = [];
    var i = null;
    if (d !== null) {
      var temp = d3.entries(d);
      for (i in temp) {
        this.actualData[this.groups.indexOf(temp[i].key)].splice(0, 0, temp[i].value);
      }
      if ((this.actualData[0].length * this.groups.length) > this.MAX_BARS) {
        for (i in this.groups) {
          this.actualData[i].pop();
        }
      }
    }
    var MAX_VALUE = d3.max(this.actualData, function(d) {
      return d3.max(d);
    }) || 0;
    for (i in this.actualData) {
      data[i] = [];
      for (var j in this.actualData[i]) {
        data[i].push(this.actualData[i][j]);
      }
    }
    while ((data[0].length * this.groups.length) < this.MAX_BARS) {
      for (i in this.groups) {
        data[i].push(0);
      }
    }

    var y = d3.scale.linear()
        .domain([ 0, (MAX_VALUE + this.MAX_OFFSET) ])
        .range([ this.height, 0 ]);

    var x1 = d3.scale.ordinal()
        .domain(d3.range(this.groups.length))
        .rangeBands([ 0, this.x0.rangeBand() ]);

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient('left').ticks(5).outerTickSize(0);
    var yAxisRight = d3.svg.axis()
                          .scale(y)
                          .orient('right').ticks(0).outerTickSize(0);
    this.svg.selectAll('g').remove();
    this.svg.append('g')
        .attr('class', 'y axis')
        .call(yAxis)
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 6)
        .attr('dy', '.71em')
        .style('text-anchor', 'end').text('Count');
    this.svg.append('g')
        .attr('class', 'y axis')
        .attr('transform', 'translate(' + this.width + ', 0)')
        .call(yAxisRight);
    this.svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + this.height + ')')
        .call(this.xAxis);
    this.svg.append('g').selectAll('g')
        .data(data)
        .enter().append('g')
        .attr('class', function(d, i) {
          return self.colours[i];
        })
        .attr('transform', function(d, i) {
          return 'translate(' + x1(i) + ',0)';
        })
        .selectAll('rect')
        .data(function(d) {
          return d;
        })
        .enter().append('rect')
        .attr('width', x1.rangeBand() - this.SMALL_GUTTER_WIDTH)
        .attr('height', function(d) {
          return self.height - y(d);
        })
        .attr('x', function(d, i) {
          return self.x0(i);
        })
        .attr('y', y);
  }
}
