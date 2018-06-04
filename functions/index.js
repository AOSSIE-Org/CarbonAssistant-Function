'use strict';

const functions = require('firebase-functions'); // Cloud Functions for Firebase library
const DialogflowApp = require('actions-on-google').DialogflowApp; // Google Assistant helper library
const requestLib = require('request');
var config = require('./config');
var flights = require('./flights');
var vehicles = require('./vehicles');
var fuels = require('./fuels');
var electricity = require('./electricity');
var poultry = require('./poultry');

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
    console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
    console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
    if (request.body.result) {
        processV1Request(request, response);
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
        'input.vehicle_details': () => {
            vehicles.processRequest(parameters)
                .then(function(responseString) {
                    sendGoogleResponse(responseString);
                })
                .catch(function(errorString) {
                    sendGoogleResponse(errorString);
                });
        },
        'input.flight_details': () => {
            flights.processRequest(parameters)
                .then(function(responseString) {
                    sendGoogleResponse(responseString);
                })
                .catch(function(errorString) {
                    sendGoogleResponse(errorString);
                });
        },
        'input.fuel_details': () => {
            fuels.processRequest(parameters)
                .then(function(responseString) {
                    sendGoogleResponse(responseString);
                })
                .catch(function(errorString) {
                    sendGoogleResponse(errorString);
                });
        },
        'input.electricity_details': () => {
            electricity.processRequest(parameters)
                .then(function(responseString) {
                    sendGoogleResponse(responseString);
                })
                .catch(function(errorString) {
                    sendGoogleResponse(errorString);
                });

        },
        'input.poultry_details': () => {
           poultry.processRequest(parameters)
                .then(function(responseString) {
                    sendGoogleResponse(responseString);
                })
                .catch(function(errorString) {
                    sendGoogleResponse(errorString);
                }); 
        },
        'input.appliance_details': () => {
            if (parameters.appliance !== "") {
                let item = parameters.appliance;
                let appliance_type = "",
                    appliance_size = "",
                    appliance_quantity = 1,
                    appliance_usage_hours = 1,
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

                if (appliance_type != "" && appliance_size != "") {
                    appliance_path = appliance_type + " " + appliance_size;
                    item = item + ' ' + appliance_path;
                } else if (appliance_type != "") {
                    appliance_path = appliance_type;
                    item = item + ' ' + appliance_path;
                } else if (appliance_size != "") {
                    appliance_path = appliance_size;
                    item = item + ' ' + appliance_path;
                } else
                    appliance_path = "";

                if (parameters.quantity != "")
                    appliance_quantity = parameters.quantity;

                if (parameters.duration) {
                    let duration_in_hours = getTimeInHours(parameters.duration);
                    console.log("Calculated duration:" + duration_in_hours);
                    if (duration_in_hours != -1)
                        appliance_usage_hours = duration_in_hours;
                }

                console.log("Appliance: " + parameters.appliance + ", path=" + appliance_path);
                console.log("Duration: " + appliance_usage_hours + ", quantity=" + appliance_quantity);

                // At this point we have enough info
                var options = {
                    uri: config.endpoint + "/emissions",
                    method: 'POST',
                    headers: {
                        'access-key': config.access_key
                    },
                    json: true,
                    body: {
                        "item": item,
                        "region": usage_country,
                        "quantity": appliance_quantity,
                        "multiply": appliance_usage_hours
                    }
                };
                requestLib(options, function(error, response, body) {
                    if (!error && response.statusCode === 200) {
                        console.log(body);
                        if (parameters.emission_type !== "") {
                            let emissionType = parameters.emission_type;
                            let emission;
                            if (emissionType === "CO2")
                                emission = body.emissions.CO2;
                            else if (emissionType === "N2O")
                                emission = body.emissions.N2O;
                            else
                                emission = body.emissions.CH4;

                            let basicResponseString = emissionType + ' emissions due to ' + appliance_quantity + ' ' + appliance_size + ' ' + appliance_type +
                                ' ' + parameters.appliance + ' consumed for ' + appliance_usage_hours + ' hour(s)';
                            let finalResponseString = "";

                            if (usage_country != "" && usage_country != "Default")
                                finalResponseString = basicResponseString + ' in ' + usage_country + ' are ' + emission;
                            else
                                finalResponseString = basicResponseString + ' are ' + emission;


                            let unit = body.unit;
                            if (unit !== undefined)
                                sendGoogleResponse(finalResponseString + ' ' + unit);
                            else
                                sendGoogleResponse(finalResponseString + ' kg');
                        } else {
                            let basicResponseString = 'Emissions due to ' + appliance_quantity + ' ' + appliance_size + ' ' + appliance_type + ' ' +
                                parameters.appliance + ' consumed for ' + appliance_usage_hours + ' hour(s)';
                            let finalResponseString = "";
                            if (usage_country != "" && usage_country != "Default")
                                finalResponseString = basicResponseString + ' in ' + usage_country;
                            else
                                finalResponseString = basicResponseString;
                            let carbonEmission = body.emissions.CO2;
                            let nitrousEmission = body.emissions.N2O;
                            let methaneEmission = body.emissions.CH4;
                            sendGoogleResponse(finalResponseString + ' are as follows:\n  \n' +
                                'Carbon Dioxide: ' + carbonEmission + ' kg.\n' +
                                "Nitrous Oxide: " + nitrousEmission + ' kg.\n' +
                                "Methane: " + methaneEmission + ' kg.');
                        }
                    } else {
                        if (body.err !== undefined) {
                            console.log("Error: " + JSON.stringify(body));
                            sendGoogleResponse(body.err);
                        } else {
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

    function getTimeInHours(duration) {
        if (duration.unit === 'h')
            return duration.amount;
        else if (duration.unit === 'min')
            return duration.amount / 60;
        else if (duration.unit === 's')
            return duration.amount / (60 * 60);
        else
            return -1;
    }
}
