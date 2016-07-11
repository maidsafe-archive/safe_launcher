/*global window:false */
var React = window.React;
var AppList = React.createClass({
  propTypes: {
    list: React.PropTypes.object,
    revokeApp: React.PropTypes.func,
    toggleAppDetails: React.PropTypes.func
  },
  handleClick: function(e) {
    e.stopPropagation();
    this.props.revokeApp(this.props.list[e.currentTarget.dataset.id].id);
  },
  showAppDetails: function(e) {
    this.props.toggleAppDetails(e.currentTarget.dataset.id);
  },
  render: function() {
    var listItems = [];
    var listItem = null;
    var statusBar = null;
    var option = null;
    var ACTIVITY_STATUS = {
      0: 'IN_PROGRESS',
      1: 'SUCCESS',
      '-1': 'FAILURE'
    };
    for (var i in this.props.list) {
      statusBar = React.DOM.div({key: 'status-bar-' + i, className: 'status-bar in-progress'}, [
        React.DOM.span({key: 'status-bar-time-' + i, className: 'time'},
          window.moment(this.props.list[i].status.beginTime).format('HH:mm:ss')
        ),
        React.DOM.span({key: 'status-bar-msg-' + i, className: 'msg'}, this.props.list[i].status.activityName),
        React.DOM.span({key: 'status-bar-status-' + i, className: 'status'}, 'Status: ' +
          ACTIVITY_STATUS[this.props.list[i].status.activityStatus])
      ]);
      option = React.DOM.div({key: 'option-' + i, className: 'opt'},
        React.DOM.div({key: 'option-item-' + i, className: 'opt-i'},
          React.DOM.button({key: 'option-btn-' + i, className: 'btn flat danger', name:'revoke', 'data-id': i,
            onClick: this.handleClick}, 'Revoke Access')
        )
      );
      listItem = React.DOM.div({key: i, className: 'app-li-i', 'data-id': this.props.list[i].id, onClick: this.showAppDetails},[
        React.DOM.h3({key: 'title-' + i, className: 'title'}, [
          this.props.list[i].name + ' - ',
          React.DOM.span({ kery: 'version-' + i, className: 'version' }, 'v ' + this.props.list[i].version)
        ]),
        React.DOM.h4({key: 'sub-title-' + i, className: 'sub-title'}, 'Last Active: ' + this.props.list[i].lastActive),
        statusBar,
        option
      ]);
      listItems.push(listItem);
    }
    return React.DOM.div({className: 'app-li-cnt'}, listItems);
  }
});

window.safeLauncher.value('AppList', AppList);
