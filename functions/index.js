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
    const options = {
        context: 'Hello, Welcome to CarbonFootPrint Action! To address you by name and provide you relatable emission comparisons based on your location',
        // Ask for more than one permission. User can authorize all or none.
        permissions: ['NAME', 'DEVICE_PRECISE_LOCATION'],
    };
    if ((!conv.user.storage.name || !conv.user.storage.location) && !conv.user.storage.noPermission)
        conv.ask(new Permission(options));
    else {
        if (!conv.user.storage.noPermission) {
            const name = conv.user.storage.name.given;
            conv.ask("Hello " + name + ", what's the info you need today? Feel free to ask what I can do for assistance or you can simply say 'help'");
        } else {
            conv.ask("Hey there!, what's the info you need today? Feel free to ask what I can do for assistance or you can simply say 'help'");
        }
    }
});

app.intent('permission_confirmation', (conv, parameters, permission_allowed) => {
    if (permission_allowed) {
        const {
            location
        } = conv.device;
        const {
            name
        } = conv.user;

        conv.user.storage.noPermission = false;
        conv.user.storage.name = name;
        conv.user.storage.location = location;

        const {
            latitude,
            longitude
        } = location.coordinates;
        conv.ask("Ok " + name.given + ", we are all set!");
    } else {
        conv.ask("Sorry about that :( Unfortunately, we cannot provide you intelligent emission results without the location information. \
            Therefore, you will only be able to receive raw emission results. Please say 'request permissions' if you change your mind.");
        conv.user.storage.noPermission = true;
    }
});

app.intent('trains_intent', (conv, parameters) => {
    conv.user.storage.lastParams = parameters;
    return trains.processRequest(conv, parameters);
});

app.intent('trains_intent - followup', (conv, parameters) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};

    if (parameters.origin && parameters.origin !== "")
        newParams.origin = parameters.origin;
    else
        newParams.origin = contextParams.origin;

    if (parameters.destination && parameters.destination !== "")
        newParams.destination = parameters.destination;
    else
        newParams.destination = contextParams.destination;

    if (parameters.passengers && parameters.passengers !== "")
        newParams.passengers = parameters.passengers;
    else
        newParams.passengers = contextParams.passengers;

    conv.user.storage.lastParams = newParams;

    return trains.processRequest(conv, newParams);
});

app.intent('vehicle_intent', (conv, parameters) => {
    conv.user.storage.lastParams = parameters;
    return vehicles.processRequest(conv, parameters);
});

app.intent('vehicle_intent - followup', (conv, parameters) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};

    if (parameters.origin && parameters.origin !== "")
        newParams.origin = parameters.origin;
    else
        newParams.origin = contextParams.origin;

    if (parameters.destination && parameters.destination !== "")
        newParams.destination = parameters.destination;
    else
        newParams.destination = contextParams.destination;

    if (parameters.mileage && parameters.mileage !== "")
        newParams.mileage = parameters.mileage;
    else
        newParams.mileage = contextParams.mileage;

    if (parameters.emission_type && parameters.emission_type !== "")
        newParams.emission_type = parameters.emission_type;
    else
        newParams.emission_type = contextParams.emission_type;

    if (parameters.fuel_type && parameters.fuel_type !== "")
        newParams.fuel_type = parameters.fuel_type;
    else
        newParams.fuel_type = contextParams.fuel_type;

    conv.user.storage.lastParams = newParams;

    return vehicles.processRequest(conv, newParams);
});

app.intent('flights_intent', (conv, parameters) => {
    conv.user.storage.lastParams = parameters;
    return flights.processRequest(conv, parameters);
});

app.intent('flights_intent - followup', (conv, parameters) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};

    if (parameters.origin && parameters.origin !== "") {
        newParams.origin = parameters.origin;
        newParams.origin_original = newParams.origin_original;
	}
    else {
        newParams.origin = contextParams.origin;
        newParams.origin_original = contextParams.origin_original;
	}

    if (parameters.destination && parameters.destination !== "") {
        newParams.destination = parameters.destination;
        newParams.destination_original = parameters.destination_original;
	}
    else {
        newParams.destination = contextParams.destination;
        newParams.destination_original = contextParams.destination_original;
	}

    if (parameters.passengers && parameters.passengers !== "")
        newParams.passengers = parameters.passengers;
    else
        newParams.passengers = contextParams.passengers;

    conv.user.storage.lastParams = newParams;

    return flights.processRequest(conv, newParams);
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
    conv.user.storage.lastParams = parameters;
    if (!conv.user.storage.noPermission)
        return appliances.processRequest(conv, parameters, true);
    else
        return appliances.processRequest(conv, parameters, false);
});

app.intent('appliance_intent - followup', (conv, parameters) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};

    if (parameters.type && parameters.type !== "")
        newParams.type = parameters.type;
    else
        newParams.type = contextParams.type;

    if (parameters.appliance && parameters.appliance !== "")
        newParams.appliance = parameters.appliance;
    else
        newParams.appliance = contextParams.appliance;

    if (parameters.geo_country && parameters.geo_country !== "")
        newParams.geo_country = parameters.geo_country;
    else
        newParams.geo_country = contextParams.geo_country;

    if (parameters.emission_type && parameters.emission_type !== "")
        newParams.emission_type = parameters.emission_type;
    else
        newParams.emission_type = contextParams.emission_type;

    if (parameters.duration && parameters.duration !== "")
        newParams.duration = parameters.duration;
    else
        newParams.duration = contextParams.duration;

    if (parameters.size && parameters.size !== "")
        newParams.size = parameters.size;
    else
        newParams.size = contextParams.size;

    if (parameters.quantity && parameters.quantity !== "")
        newParams.quantity = parameters.quantity;
    else
        newParams.quantity = contextParams.quantity;

    conv.user.storage.lastParams = newParams;

    return appliances.processRequest(conv, newParams);
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
