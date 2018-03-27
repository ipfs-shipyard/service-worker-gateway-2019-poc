import React, { Component } from 'react';
import { Router as ReactRouter, Route, Switch } from 'react-router-dom';
import createHistory from 'history/createBrowserHistory';

import Gateway from './Gateway';
import Home from './Home';

const browserHistory = createHistory();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/serviceWorker.js').then(function(reg) {
    if(reg.installing) {
      console.log('Service worker installing');
    } else if(reg.waiting) {
      console.log('Service worker installed');
    } else if(reg.active) {
      console.log('Service worker active');
    }
  }).catch(function(error) {
    // registration failed
    console.log('Registration failed with ' + error);
  });
}

export default class App extends Component {
  render() {
    return (
      <ReactRouter history={browserHistory}>
        <Switch>
          <Route exact path="/ipfs/:hash" component={Gateway} />
          <Route path="/" component={Home} />
        </Switch>
      </ReactRouter>
    );
  }
}
