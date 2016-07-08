/*global window:false */
var React = window.React;
var AppLogs = React.createClass({
  propTypes: {
    list: React.PropTypes.array,
    filter: React.PropTypes.array
  },
  render: function() {
    var rows = [];
    var row = null;
    var STATUS_CLASS = {
      'IN_PROGRESS': 'in-progress',
      'COMPLETED': 'completed',
      'ERROR': 'error'
    };
    var tableHead = React.DOM.thead(null,
      React.DOM.tr(null,
        React.DOM.th(null, 'App Name'),
        React.DOM.th(null, 'Request'),
        React.DOM.th(null, 'Status'),
        React.DOM.th(null, 'Time Sent')
      )
    );

    for (var i in this.props.list) {
      var list = this.props.list[i];
      row = React.DOM.tr({key: i, className: STATUS_CLASS[list.status.toUpperCase()]}, [
        React.DOM.td({key: 'td-name-' + i}, list.name),
        React.DOM.td({key: 'td-req-' + i}, list.req),
        React.DOM.td({key: 'td-status-' + i}, list.status.replace(/_/g, ' ')),
        React.DOM.td({key: 'td-time-' + i}, list.time)
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
