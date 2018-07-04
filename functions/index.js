'use strict';

const functions = require('firebase-functions'); // Cloud Functions for Firebase library
const {
    dialogflow,
    Permission
} = require('actions-on-google'); // Google Assistant helper library
const requestLib = require('request');
var config = require('./config');
var flights = require('./flights');
var vehicles = require('./vehicles');
var fuels = require('./fuels');
var electricity = require('./electricity');
var poultry = require('./poultry');
var appliances = require('./appliances');
var trains = require('./trains');

const app = dialogflow({
    debug: true
});

// The default welcome intent has been matched, welcome the user (https://dialogflow.com/docs/events#default_welcome_intent)
app.intent('Default Welcome Intent', (conv) => {
    sendGoogleResponse(conv, 'Hello, Welcome to CarbonFootPrint Action!');
});

app.intent('trains_intent', (conv, parameters) => {
    return trains.processRequest(conv, parameters);
});

app.intent('vehicle_intent', (conv, parameters) => {
    return vehicles.processRequest(conv, parameters);
});

app.intent('flights_intent', (conv, parameters) => {
    return flights.processRequest(conv, parameters);
});

app.intent('fuels_intent', (conv, parameters) => {
    return fuels.processRequest(conv, parameters);
});

app.intent('electricity_intent', (conv, parameters) => {
    return electricity.processRequest(conv, parameters);
});

app.intent('poultry_intent', (conv, parameters) => {
    return poultry.processRequest(conv, parameters);
});

app.intent('appliance_intent', (conv, parameters) => {
    return appliances.processRequest(conv, parameters);
});

// The default fallback intent has been matched, try to recover (https://dialogflow.com/docs/intents#fallback_intents)
app.intent('Default Fallback Intent', (conv) => {
    // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
    sendGoogleResponse(conv, 'I\'m having trouble, can you try that again?');
});

// Function to send correctly formatted Google Assistant responses to Dialogflow which are then sent to the user
function sendGoogleResponse(conv, responseToUser) {
    conv.ask(responseToUser); // Google Assistant response
}

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
