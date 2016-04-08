/* eslint-disable no-unused-vars */
import React from 'react';
/* eslint-enable no-unused-vars */

import {AUTH_USER_LOGIN_CHANGED} from './constants/EventTypes';

import Actions from './actions/Actions';

let SDK = require('./SDK').getSDK();
let {AuthStore, Config, DOMUtils} = SDK.get(['AuthStore', 'Config', 'DOMUtils']);

let segmentScript = `!function(){var analytics=window.analytics=window.analytics||[];if(!analytics.initialize)if(analytics.invoked)window.console&&console.error&&console.error('Segment snippet included twice.');else{analytics.invoked=!0;analytics.methods=['trackSubmit','trackClick','trackLink','trackForm','pageview','identify','group','track','ready','alias','page','once','off','on'];analytics.factory=function(t){return function(){var e=Array.prototype.slice.call(arguments);e.unshift(t);analytics.push(e);return analytics}};for(var t=0;t<analytics.methods.length;t++){var e=analytics.methods[t];analytics[e]=analytics.factory(e)}analytics.load=function(t){var e=document.createElement('script');e.type="text/javascript";e.async=!0;e.src=('https:'===document.location.protocol?'https://':'http://')+'cdn.segment.com/analytics.js/v1/'+t+'/analytics.min.js';var n=document.getElementsByTagName('script')[0];n.parentNode.insertBefore(e,n)};analytics.SNIPPET_VERSION="3.0.1";analytics.load("${Config.analyticsKey}");}}();`;

module.exports = {
  filters: [
    'installCLIModalCLIInstallURL',
    'installCLIModalCLIInstallScript'
  ],

  actions: [
    'pluginsConfigured',
    'userLogoutSuccess'
  ],

  initialize: function () {
    this.filters.forEach(filter => {
      SDK.Hooks.addFilter(filter, this[filter].bind(this));
    });
    this.actions.forEach(action => {
      SDK.Hooks.addAction(action, this[action].bind(this));
    });

    Actions.initialize();

    AuthStore.addChangeListener(AUTH_USER_LOGIN_CHANGED, function () {
      Actions.identify(AuthStore.getUser().uid);
    });

    if (AuthStore.getUser()) {
      Actions.identify(AuthStore.getUser().uid);
    }
  },

  pluginsConfigured: function () {
    DOMUtils.appendScript(document.head, segmentScript);
  },

  installCLIModalCLIInstallURL: function () {
    return `${Config.downloadsURI}/dcos-cli/install.sh`;
  },

  installCLIModalCLIInstallScript: function () {
    return './install.sh';
  },

  userLogoutSuccess: function () {
    Actions.log({
      eventID: 'Logged out'
    });
  }

};
