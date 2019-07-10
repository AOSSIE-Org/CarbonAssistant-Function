const {
  SimpleResponse,
  Suggestions,
  BasicCard
} = require('actions-on-google');

exports.roundWithPrecision = (value, precision) => {
  var multiplier = Math.pow(10, precision || 0);
  return Math.round(value * multiplier) / multiplier;
}

exports.getRandomNumber = (minimum, maximum) => {
  return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
}

exports.richResponse = (conv, display, toSpeak, button) => {
  if (conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
      conv.ask(new SimpleResponse({
          speech: toSpeak,
          text: display
      }));
      conv.ask(new BasicCard({
          title: '',
          text: 'To see some visuals click the button',
          buttons: [{
              title: "See More",
              openUrlAction: {
                  url: "https://carbonhub.org" + button,
                  urlTypeHint: "URL_TYPE_HINT_UNSPECIFIED"
              }
          }]
      }));
  } else if (conv.surface.capabilities.has('actions.capability.AUDIO_OUTPUT')) {
      conv.ask(new SimpleResponse({
          speech: display
      }));
  }
  conv.ask("What else would you like to know next?");
}

exports.responseWithSuggestions = (conv, display, suggestions) => {
  console.log("Sending response: " + display);
  console.log("Sending suggestion: " + suggestions);
  conv.ask(new SimpleResponse({
          speech: display,
          text: display
      }),
      new Suggestions(suggestions));
}

exports.handleError = (error, response, body, conv) => {
  // Handle errors here
  console.log(response);
  if (!response) {
      conv.close("An unknown error occurred. Please contact our support.\nError: " + error);
  } else {
      if (response.statusCode == 400) {
          //Handle API errors that come with their own error messages
          //This basically just wraps existing messages in a more readable format for the Assistant
          if (error.toLowerCase().startsWith("unable")) {
              if (error.toLowerCase().includes("IATA")) {
                  //Format "Unable to find the airports. Please use IATA airport codes only"
                  conv.ask("I couldn't find that airport. Please only give me IATA codes.");
              } else {
                  //Format "Unable to find <emission type> for <item type> in <region>"
                  conv.ask("I was " + error + ". Please try again.");
              }
          } else if (error.toLowerCase().startsWith("please provide")) {
              //Format "Please provide valid sector and region values"
              conv.ask("Sorry, I'm missing some info from you. " + error + ".");
          } else if (error.toLowerCase().includes("cannot be less than zero")) {
              //Format "Distance cannot be less than zero"
              conv.ask("Sorry, I can't use a negative distance or mileage. Please try again.");
          } else {
              conv.close("An unknown error occured. Please report this to the developers.\nError: " + error);
          }
      } else if (response.statusCode == 403 || response.statusCode == 406) {
          // Forbidden, not acceptable
          conv.close("An unknown error occured. Please report this to the developers.\nError: " + error);
      } else if (response.statusCode == 404) {
          // Not found
          conv.ask("The data you requested isn't available. Please try again");
      } else if (response.statusCode == 429) {
          // Too many requests
          conv.close("I'm feeling a bit overwhelmed right now. Try asking me again later.");
      } else if (response.statusCode == 500) {
          // Internal server error
          conv.close("There's a problem with our server. Please try again in a bit.");
      } else if (response.statusCode == 503) {
          // Service unavailable
          conv.close("The server is currently offline for maintenance. Please try again later.");
      } else {
          conv.close("An unknown error occured. Please contact our support.\nError: " + error);
      }
  }
}