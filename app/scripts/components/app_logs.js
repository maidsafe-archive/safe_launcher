/*global window:false */
var React = window.React;
var AppLogs = React.createClass({
  propTypes: {
    list: React.PropTypes.object,
    filter: React.PropTypes.array
  },
  render: function() {
    var rows = [];
    var row = null;
    var STATUS_CLASS = {
      'IN_PROGRESS': 'in-progress',
      'SUCCESS': 'completed',
      'FAILURE': 'error'
    };
    var STATUS_CODE = {
      0: 'IN_PROGRESS',
      1: 'SUCCESS',
      '-1': 'FAILURE'
    };
    var tableHead = React.DOM.thead(null,
      React.DOM.tr(null,
        React.DOM.th(null, 'App Name'),
        React.DOM.th(null, 'Request'),
        React.DOM.th(null, 'Status'),
        React.DOM.th(null, 'Time Sent')
      )
    );
    var list = null;
    if (!this.props.list || Object.keys(this.props.list).length === 0) {
      return React.DOM.span(null, null);
    }
    for (var i in this.props.list) {
      list = this.props.list[i];
      list['status'] = STATUS_CODE[list.activityStatus];
      if ((this.props.filter.length === 0) || (this.props.filter.indexOf(list.status) === -1)) {
        continue;
      }
      row = React.DOM.tr({key: i, className: STATUS_CLASS[list.status]}, [
        React.DOM.td({key: 'td-name-' + i}, list.appName),
        React.DOM.td({key: 'td-req-' + i}, list.activityName),
        React.DOM.td({key: 'td-status-' + i}, list.status.replace(/_/g, ' ')),
        React.DOM.td({key: 'td-time-' + i}, window.moment(list.beginTime).format('HH:mm:ss'))
      ]);
      rows.push(row);
    }
    return React.DOM.table(null,
      tableHead,
      React.DOM.tbody(null, rows)
    );
  }
});

window.safeLauncher.value('AppLogs', AppLogs);
