import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { Router, hashHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';
import axios from 'axios';

import './ui/app.global.css';
import routes from './ui/routes';
import configureStore from './ui/store/configure_store';
import './bridge';
import EventRegistry from './ui/event_registry';

const store = configureStore();
const history = syncHistoryWithStore(hashHistory, store);

(new EventRegistry(store)).run();

render(
  <Provider store={store}>
    <Router history={history} routes={routes} />
  </Provider>,
  document.getElementById('safeLauncher')
);
