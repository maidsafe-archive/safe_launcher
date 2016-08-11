/**
 * React list bridge
 */
window.safeLauncher.factory('logListComponent', [ 'eventRegistrationFactory',
  function(eventRegistry) {
    var self = this;
    var reactComponent;
    var appSpecificLogs;
    self.register = function(component, appSpecific) {
      reactComponent = component;
      appSpecific = appSpecific;
      reactComponent.state.list = appSpecific ? [] : eventRegistry.logList;
    };
    self.unregister = function() {
      reactComponent = null;
    };
    self.update = function(list) {
      if (!reactComponent) {
        return;
      }
      reactComponent.setState({ list: list });
    };
    return self;
  }
]);
