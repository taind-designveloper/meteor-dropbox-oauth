DropboxOauth = {};

// Request dropbox credentials for the user
// @param options {optional}
// @param callback {Function} Callback function to call on
//   completion. Takes one argument, credentialToken on success, or Error on
//   error.
DropboxOauth.requestCredential = function (options, callback) {
  // support both (options, callback) and (callback).
  if (!callback && typeof options === 'function') {
    callback = options;
    options = {};
  }

  var config = ServiceConfiguration.configurations.findOne({service: 'dropbox'});
  if (!config) {
    callback && callback(new ServiceConfiguration.ConfigError("Service not configured"));
    return;
  }

  var state = Random.id();

  var loginUrl =
      'https://www.dropbox.com/1/oauth2/authorize?' +
      '?client_id=' + config.appId + '&response_type=code' + '&state=' + state +
      '&redirect_uri=' + encodeURIComponent(Meteor.absoluteUrl('_oauth/dropbox?close'));

  OAuth.initiateLogin(state, loginUrl, callback, {width: 875, height: 400});
};
