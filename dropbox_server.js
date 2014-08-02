DropboxOauth = {};

//var urlUtil = Npm.require('url');

OAuth.registerService('dropbox', 2, null, function(query) {

  var response = getTokenResponse(query);
  var accessToken = response.accessToken;
  var identity = getIdentity(accessToken);

  var serviceData = {
    id: identity.uid,
    accessToken: accessToken,
    expiresAt: (+new Date()) + (1000 * response.expiresIn)
  };

  // include all fields from dropbox
  // https://www.dropbox.com/developers/core/docs#account-info
  var fields = _.pick(identity, ['display_name', 'country']);

  return {
    serviceData: serviceData,
    options: {
      profile: fields
    }
  };
});

// checks whether a string parses as JSON
var isJSON = function (str) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
};

// returns an object containing:
// - accessToken
// - expiresIn: lifetime of token in seconds
var getTokenResponse = function (query) {
  var config = ServiceConfiguration.configurations.findOne({service: 'dropbox'});
  if (!config)
    throw new ServiceConfiguration.ConfigError("Service not configured");

  var responseContent;
  try {
    // Request an access token
    responseContent = Meteor.http.post(
      "https://api.dropbox.com/1/oauth2/token", {
        auth: [config.appId, config.secret].join(':'),
        params: {
          grant_type: 'authorization_code',
          code: query.code,
          redirect_uri: Meteor.absoluteUrl("_oauth/dropbox?close")
        }
      }).content;
  } catch (err) {
    throw new Error("Failed to complete OAuth handshake with dropbox. " + err.message);
  }

  // If 'responseContent' does not parse as JSON, it is an error.
  if (!isJSON(responseContent)) {
    throw new Error("Failed to complete OAuth handshake with dropbox. " + responseContent);
  }

  // Success! Extract access token and expiration
  var parsedResponse = JSON.parse(responseContent);
  var accessToken = parsedResponse.access_token;
  var expiresIn = parsedResponse.expires_in;

  if (!accessToken) {
    throw new Error("Failed to complete OAuth handshake with dropbox " +
      "-- can't find access token in HTTP response. " + responseContent);
  }

  return {
    accessToken: accessToken,
    expiresIn: expiresIn
  };
};

var getIdentity = function (accessToken) {
  try {
    return Meteor.http.get("https://api.dropbox.com/1/account/info", {
        headers: { "Authorization": 'bearer ' + accessToken }
    }).data;
  } catch (err) {
    throw new Error("Failed to fetch identity from dropbox. " + err.message);
  }
};

DropboxOauth.retrieveCredential = function(credentialToken, credentialSecret) {
  return OAuth.retrieveCredential(credentialToken, credentialSecret);
};
