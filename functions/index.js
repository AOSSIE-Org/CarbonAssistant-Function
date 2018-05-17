'use strict';

const functions = require('firebase-functions'); // Cloud Functions for Firebase library
const DialogflowApp = require('actions-on-google').DialogflowApp; // Google Assistant helper library
const requestLib = require('request');
var config = require('./config')

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
    console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
    console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
    if (request.body.result) {
        processV1Request(request, response);
    } else if (request.body.queryResult) {
        processV2Request(request, response);
    } else {
        console.log('Invalid Request');
        return response.status(400).end('Invalid Webhook Request (expecting v1 or v2 webhook request)');
    }
});
/*
 * Function to handle v1 webhook requests from Dialogflow
 */
function processV1Request(request, response) {
    let action = request.body.result.action; // https://dialogflow.com/docs/actions-and-parameters
    let parameters = request.body.result.parameters; // https://dialogflow.com/docs/actions-and-parameters
    let inputContexts = request.body.result.contexts; // https://dialogflow.com/docs/contexts
    let requestSource = (request.body.originalRequest) ? request.body.originalRequest.source : undefined;
    const googleAssistantRequest = 'google'; // Constant to identify Google Assistant requests
    const app = new DialogflowApp({
        request: request,
        response: response
    });
    // Create handlers for Dialogflow actions as well as a 'default' handler
    const actionHandlers = {
        // The default welcome intent has been matched, welcome the user (https://dialogflow.com/docs/events#default_welcome_intent)
        'input.welcome': () => {
            // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
            if (requestSource === googleAssistantRequest) {
                sendGoogleResponse('Hello, Welcome to my Dialogflow agent!'); // Send simple response to user
            } else {
                sendResponse('Hello, Welcome to my Dialogflow agent!'); // Send simple response to user
            }
        },
        'input.appliance_details': () => {
            if (parameters.appliance !== "") {
                let appliance_type = "",
                    appliance_size = "",
                    appliance_path = "";
                let usage_country;

                if (parameters.type != "")
                    appliance_type = parameters.type;
                if (parameters.size != "")
                    appliance_size = parameters.size;
                if (parameters.geo_country != "")
                    usage_country = parameters.geo_country;
                else
                    usage_country = 'Default';

                console.log("Original Size: " + parameters.size);
                console.log("Size: " + appliance_size);

                if (appliance_type != "" && appliance_size != "")
                    appliance_path = appliance_type + " " + appliance_size;
                else if (appliance_type != "")
                    appliance_path = appliance_type;
                else if (appliance_size != "")
                    appliance_path = appliance_size;
                else
                    appliance_path = "";

                console.log("Appliance: " + parameters.appliance + ", path=" + appliance_path);

                // At this point we have enough info
                var options = {
                    uri: config.endpoint + "/appliances",
                    method: 'POST',
                    headers: {
                        'access-key': config.access_key
                    },
                    json: true,
                    body: {
                        "appliance": parameters.appliance,
                        "type": appliance_path,
                        "region": usage_country
                    }
                };
                requestLib(options, function(error, response, body) {
                    if (!error && response.statusCode === 200) {
                        console.log(body) // Print the shortened url.
                        //let emission = body.emissions.CO2;
                        if (parameters.emission_type !== "") {
                            let emissionType = parameters.emission_type;
                            let emission;
                            if (emissionType === "CO2")
                                emission = body.emissions.CO2;
                            else if (emissionType === "N2O")
                                emission = body.emissions.N2O;
                            else
                                emission = body.emissions.CH4;

                            let unit = body.unit;
                            if (unit !== undefined)
                                sendGoogleResponse(emissionType + ' emission for a ' + parameters.type + ' ' + parameters.appliance + ' in ' + parameters.geo_country + ' is ' + emission + ' ' + unit);
                            else
                                sendGoogleResponse(emissionType + ' emission for a ' + parameters.type + ' ' + parameters.appliance + ' in ' + parameters.geo_country + ' is ' + emission + ' kg');
                        } else {
                            let carbonEmission = body.emissions.CO2;
                            let nitrousEmission = body.emissions.N2O;
                            let methaneEmission = body.emissions.CH4;
                            sendGoogleResponse('Emissions for a ' + parameters.type + ' ' + parameters.appliance + ' in ' + parameters.geo_country + ' are as follows.\n  \n' +
                                'Carbon Dioxide: ' + carbonEmission + ' kg.\n' +
                                "Nitrous Oxide: " + nitrousEmission + ' kg.\n' +
                                "Methane: " + methaneEmission + ' kg.');
                        }
                    } else {
                        if (body.err !== undefined)
                            sendGoogleResponse(body.err);
                        else {
                            sendGoogleResponse("Sorry, we are facing a temporary outage. Please contact our support.");
                        }
                    }
                });
            } else {
                sendGoogleResponse("Sorry, I did not understand the appliance you mentioned");
            }
            // sendGoogleResponse('This is a valid request'); // Send simple response to user
        },
        // The default fallback intent has been matched, try to recover (https://dialogflow.com/docs/intents#fallback_intents)
        'input.unknown': () => {
            // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
            if (requestSource === googleAssistantRequest) {
                sendGoogleResponse('I\'m having trouble, can you try that again?'); // Send simple response to user
            } else {
                sendResponse('I\'m having trouble, can you try that again?'); // Send simple response to user
            }
        },
        // Default handler for unknown or undefined actions
        'default': () => {
            // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
            if (requestSource === googleAssistantRequest) {
                let responseToUser = {
                    //googleRichResponse: googleRichResponse, // Optional, uncomment to enable
                    //googleOutputContexts: ['weather', 2, { ['city']: 'rome' }], // Optional, uncomment to enable
                    speech: 'This message is from Dialogflow\'s Cloud Functions for Firebase editor!', // spoken response
                    text: 'This is from Dialogflow\'s Cloud Functions for Firebase editor! :-)' // displayed response
                };
                sendGoogleResponse(responseToUser);
            } else {
                let responseToUser = {
                    //data: richResponsesV1, // Optional, uncomment to enable
                    //outputContexts: [{'name': 'weather', 'lifespan': 2, 'parameters': {'city': 'Rome'}}], // Optional, uncomment to enable
                    speech: 'This message is from Dialogflow\'s Cloud Functions for Firebase editor!', // spoken response
                    text: 'This is from Dialogflow\'s Cloud Functions for Firebase editor! :-)' // displayed response
                };
                sendResponse(responseToUser);
            }
        }
    };
    // If undefined or unknown action use the default handler
    if (!actionHandlers[action]) {
        action = 'default';
    }
    // Run the proper handler function to handle the request from Dialogflow
    actionHandlers[action]();
    // Function to send correctly formatted Google Assistant responses to Dialogflow which are then sent to the user
    function sendGoogleResponse(responseToUser) {
        if (typeof responseToUser === 'string') {
            app.ask(responseToUser); // Google Assistant response
        } else {
            // If speech or displayText is defined use it to respond
            let googleResponse = app.buildRichResponse().addSimpleResponse({
                speech: responseToUser.speech || responseToUser.displayText,
                displayText: responseToUser.displayText || responseToUser.speech
            });
            // Optional: Overwrite previous response with rich response
            if (responseToUser.googleRichResponse) {
                googleResponse = responseToUser.googleRichResponse;
            }
            // Optional: add contexts (https://dialogflow.com/docs/contexts)
            if (responseToUser.googleOutputContexts) {
                app.setContext(...responseToUser.googleOutputContexts);
            }
            console.log('Response to Dialogflow (AoG): ' + JSON.stringify(googleResponse));
            app.ask(googleResponse); // Send response to Dialogflow and Google Assistant
        }
    }
    // Function to send correctly formatted responses to Dialogflow which are then sent to the user
    function sendResponse(responseToUser) {
        // if the response is a string send it as a response to the user
        if (typeof responseToUser === 'string') {
            let responseJson = {};
            responseJson.speech = responseToUser; // spoken response
            responseJson.displayText = responseToUser; // displayed response
            response.json(responseJson); // Send response to Dialogflow
        } else {
            // If the response to the user includes rich responses or contexts send them to Dialogflow
            let responseJson = {};
            // If speech or displayText is defined, use it to respond (if one isn't defined use the other's value)
            responseJson.speech = responseToUser.speech || responseToUser.displayText;
            responseJson.displayText = responseToUser.displayText || responseToUser.speech;
            // Optional: add rich messages for integrations (https://dialogflow.com/docs/rich-messages)
            responseJson.data = responseToUser.data;
            // Optional: add contexts (https://dialogflow.com/docs/contexts)
            responseJson.contextOut = responseToUser.outputContexts;
            console.log('Response to Dialogflow: ' + JSON.stringify(responseJson));
            response.json(responseJson); // Send response to Dialogflow
        }
    }
}
// Construct rich response for Google Assistant (v1 requests only)
const app = new DialogflowApp();
const googleRichResponse = app.buildRichResponse()
    .addSimpleResponse('This is the first simple response for Google Assistant')
    .addSuggestions(
        ['Suggestion Chip', 'Another Suggestion Chip'])
    // Create a basic card and add it to the rich response
    .addBasicCard(app.buildBasicCard(`This is a basic card.  Text in a
 basic card can include "quotes" and most other unicode characters
 including emoji ??.  Basic cards also support some markdown
 formatting like *emphasis* or _italics_, **strong** or __bold__,
 and ***bold itallic*** or ___strong emphasis___ as well as other things
 like line  \nbreaks`) // Note the two spaces before '\n' required for a
        // line break to be rendered in the card
        .setSubtitle('This is a subtitle')
        .setTitle('Title: this is a title')
        .addButton('This is a button', 'https://assistant.google.com/')
        .setImage('https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
            'Image alternate text'))
    .addSimpleResponse({
        speech: 'This is another simple response',
        displayText: 'This is the another simple response ??'
    });
// Rich responses for Slack and Facebook for v1 webhook requests
const richResponsesV1 = {
    'slack': {
        'text': 'This is a text response for Slack.',
        'attachments': [{
            'title': 'Title: this is a title',
            'title_link': 'https://assistant.google.com/',
            'text': 'This is an attachment.  Text in attachments can include \'quotes\' and most other unicode characters including emoji ??.  Attachments also upport line\nbreaks.',
            'image_url': 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
            'fallback': 'This is a fallback.'
        }]
    },
    'facebook': {
        'attachment': {
            'type': 'template',
            'payload': {
                'template_type': 'generic',
                'elements': [{
                    'title': 'Title: this is a title',
                    'image_url': 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
                    'subtitle': 'This is a subtitle',
                    'default_action': {
                        'type': 'web_url',
                        'url': 'https://assistant.google.com/'
                    },
                    'buttons': [{
                        'type': 'web_url',
                        'url': 'https://assistant.google.com/',
                        'title': 'This is a button'
                    }]
                }]
            }
        }
    }
};
/*
 * Function to handle v2 webhook requests from Dialogflow
 */
function processV2Request(request, response) {
    // An action is a string used to identify what needs to be done in fulfillment
    let action = (request.body.queryResult.action) ? request.body.queryResult.action : 'default';
    // Parameters are any entites that Dialogflow has extracted from the request.
    let parameters = request.body.queryResult.parameters || {}; // https://dialogflow.com/docs/actions-and-parameters
    // Contexts are objects used to track and store conversation state
    let inputContexts = request.body.queryResult.contexts; // https://dialogflow.com/docs/contexts
    // Get the request source (Google Assistant, Slack, API, etc)
    let requestSource = (request.body.originalDetectIntentRequest) ? request.body.originalDetectIntentRequest.source : undefined;
    // Get the session ID to differentiate calls from different users
    let session = (request.body.session) ? request.body.session : undefined;
    // Create handlers for Dialogflow actions as well as a 'default' handler
    const actionHandlers = {
        // The default welcome intent has been matched, welcome the user (https://dialogflow.com/docs/events#default_welcome_intent)
        'input.welcome': () => {
            sendResponse('Hello, Welcome to my Dialogflow agent!'); // Send simple response to user
        },
        // The default fallback intent has been matched, try to recover (https://dialogflow.com/docs/intents#fallback_intents)
        'input.unknown': () => {
            // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
            sendResponse('I\'m having trouble, can you try that again?'); // Send simple response to user
        },
        // Default handler for unknown or undefined actions
        'default': () => {
            let responseToUser = {
                //fulfillmentMessages: richResponsesV2, // Optional, uncomment to enable
                //outputContexts: [{ 'name': `${session}/contexts/weather`, 'lifespanCount': 2, 'parameters': {'city': 'Rome'} }], // Optional, uncomment to enable
                fulfillmentText: 'This is from Dialogflow\'s Cloud Functions for Firebase editor! :-)' // displayed response
            };
            sendResponse(responseToUser);
        }
    };
    // If undefined or unknown action use the default handler
    if (!actionHandlers[action]) {
        action = 'default';
    }
    // Run the proper handler function to handle the request from Dialogflow
    actionHandlers[action]();
    // Function to send correctly formatted responses to Dialogflow which are then sent to the user
    function sendResponse(responseToUser) {
        // if the response is a string send it as a response to the user
        if (typeof responseToUser === 'string') {
            let responseJson = {
                fulfillmentText: responseToUser
            }; // displayed response
            response.json(responseJson); // Send response to Dialogflow
        } else {
            // If the response to the user includes rich responses or contexts send them to Dialogflow
            let responseJson = {};
            // Define the text response
            responseJson.fulfillmentText = responseToUser.fulfillmentText;
            // Optional: add rich messages for integrations (https://dialogflow.com/docs/rich-messages)
            if (responseToUser.fulfillmentMessages) {
                responseJson.fulfillmentMessages = responseToUser.fulfillmentMessages;
            }
            // Optional: add contexts (https://dialogflow.com/docs/contexts)
            if (responseToUser.outputContexts) {
                responseJson.outputContexts = responseToUser.outputContexts;
            }
            // Send the response to Dialogflow
            console.log('Response to Dialogflow: ' + JSON.stringify(responseJson));
            response.json(responseJson);
        }
    }
}
const richResponseV2Card = {
    'title': 'Title: this is a title',
    'subtitle': 'This is an subtitle.  Text can include unicode characters including emoji ??.',
    'imageUri': 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
    'buttons': [{
        'text': 'This is a button',
        'postback': 'https://assistant.google.com/'
    }]
};
const richResponsesV2 = [{
        'platform': 'ACTIONS_ON_GOOGLE',
        'simple_responses': {
            'simple_responses': [{
                'text_to_speech': 'Spoken simple response',
                'display_text': 'Displayed simple response'
            }]
        }
    },
    {
        'platform': 'ACTIONS_ON_GOOGLE',
        'basic_card': {
            'title': 'Title: this is a title',
            'subtitle': 'This is an subtitle.',
            'formatted_text': 'Body text can include unicode characters including emoji ??.',
            'image': {
                'image_uri': 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png'
            },
            'buttons': [{
                'title': 'This is a button',
                'open_uri_action': {
                    'uri': 'https://assistant.google.com/'
                }
            }]
        }
    },
    {
        'platform': 'FACEBOOK',
        'card': richResponseV2Card
    },
    {
        'platform': 'SLACK',
        'card': richResponseV2Card
    }
];
