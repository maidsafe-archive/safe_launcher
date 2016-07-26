/*global window:false */
var React = window.React;
var AppLogs = React.createClass({
  propTypes: {
    list: React.PropTypes.object,
    filter: React.PropTypes.array,
    table: React.PropTypes.string
  },
  render: function() {
    var self = this;
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

    var listKeys = this.props.list ? Object.keys(this.props.list) : [];
    if (listKeys.length === 0) {
      return React.DOM.div({key: 'inner-b', className: 'table-inner-b'}, [
        React.DOM.table({key: 'table', className: this.props.table}, [
          tableHead,
          React.DOM.tbody(null, [
            React.DOM.tr({key: 'default-row', className: 'default-row'}, [
              React.DOM.td({key: 'default-col', colspan:'100%'}, 'No requests made yet.')
            ])
          ])
        ])
      ]);
    }

    var listArr = [];
    listKeys.map(function(key) {
      listArr.push(self.props.list[key]);
    });
    listArr.sort(function(a, b) {
      var aTime = a.endTime ? new Date(a.endTime) : new Date(a.beginTime);
      var bTime = b.endTime ? new Date(b.endTime) : new Date(b.beginTime);
      return bTime - aTime;
    });

    listArr.map(function(list, i) {
      list['status'] = STATUS_CODE[list.activityStatus];
      if ((self.props.filter.length === 0) || (self.props.filter.indexOf(list.status) === -1)) {
        return;
      }
      row = React.DOM.tr({key: i, className: STATUS_CLASS[list.status]}, [
        React.DOM.td({key: 'td-name-' + i}, list.appName),
        React.DOM.td({key: 'td-req-' + i}, list.activityName),
        React.DOM.td({key: 'td-status-' + i}, list.status.replace(/_/g, ' ')),
        React.DOM.td({key: 'td-time-' + i}, window.moment(list.beginTime).format('HH:mm:ss'))
      ]);
      rows.push(row);
    });
    return React.DOM.div({key: 'inner-b', className: 'table-inner-b '  + this.props.table}, [
      React.DOM.table({key: 'table'},
        tableHead,
        React.DOM.tbody(null, rows)
      )
    ]);
  }
});

window.safeLauncher.value('AppLogs', AppLogs);
