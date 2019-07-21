'use strict';

const functions = require('firebase-functions'); // Cloud Functions for Firebase library
const {
    dialogflow,
    Permission,
    Suggestions,
    BasicCard,
    SimpleResponse,
    List
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
var land = require('./land');
var food = require('./food');
var land_utils = require('./land_utils');
var food_utils = require('./food_utils');
var menu_utils = require('./menu_utils');
var appliances_utils = require('./appliances_utils');
var sector =require('./sector');
var sector_utils = require('./sector_utils');

const app = dialogflow({
    debug: true
});

// The default welcome intent has been matched, welcome the user (https://dialogflow.com/docs/events#default_welcome_intent)
app.intent('Default Welcome Intent', (conv) => {
    const options = {
        context: `Hello, Welcome to CarbonFootPrint Action! To address you by name and provide you relatable emission comparisons based on your location`,
        // Ask for more than one permission. User can authorize all or none.
        permissions: ['NAME', 'DEVICE_PRECISE_LOCATION'],
    };
    if ((!conv.user.storage.name || !conv.user.storage.location) && !conv.user.storage.noPermission)
        conv.ask(new Permission(options));
    else {
        if (!conv.user.storage.noPermission) {
            const name = conv.user.storage.name.given;
            conv.ask(`Hello ${name}, what's the info you need today? Feel free to ask what I can do for assistance or you can simply say 'help'`);
        } else {
            conv.ask(`Hey there!, what's the info you need today? Feel free to ask what I can do for assistance or you can simply say 'help'`);
        }
    }
});

app.intent('request_permission', (conv) => {
    const options = {
        context: `Hello, Welcome to CarbonFootPrint Action! To address you by name and provide you relatable emission comparisons based on your location`,
        // Ask for more than one permission. User can authorize all or none.
        permissions: ['NAME', 'DEVICE_PRECISE_LOCATION'],
    };
    if (!conv.user.storage.name || !conv.user.storage.location)
        conv.ask(new Permission(options));
    else
        conv.ask(`I already have all the permissions I need. Thanks!`);
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
        conv.ask(`Ok ${name.given}, we are all set!`);
    } else {
        //For display screens
        if (conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')){
            conv.ask(` Unfortunately, we can't provide you intelligent emission results without the location information.
                Therefore, you'll only be able to receive raw emission results. You can allow the permission if you change your mind.`);
            conv.ask(new Suggestions(['Request Permission', 'Allowed Permission']));    
            conv.user.storage.noPermission = true;
        } else if (!conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')){
            // google home
            conv.ask(` Unfortunately, we can't provide you intelligent emission results without the location information.
                Therefore, you'll only be able to receive raw emission results. You can allow the permission if you change your mind.`);
            conv.user.storage.noPermission = true;

        }
        

    }
});

app.intent('help_intent', (conv) => {
    //google home
    if (!conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')){
        conv.ask(`I can try to answer some of your emission related questions. I promise to make it less boring by giving you info that you can relate with!I can provide you with info regarding emissions released due to appliance usage, flight travels, train journeys, road trips, fuel consumption, poultry and meat generation and electricity generation across the world.  You can ask me about how much emissions your washing machine produces, or, how much pollution you contribute to by taking a flight to Mauritius. I support limited number of categories right now but trust me I'll get better over time.`)
    } else if(conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')){
    //display screens
        conv.ask(new SimpleResponse({
            speech: "I can tell you the emissions produced by different activities and appliances. Try asking me about them. You can also choose the category you want to know the emission of, from the menu list.",
            text: "Here's what I can do:"
        }));
        conv.ask(new BasicCard({
            title: '',
            text: "**Appliances**  \n  \ne.g: *How much emissions are produced if a radio is used for 3 hours in Canada?* \n  \n  \n**Travel \u0026 Journeys**  \n  \nYou can ask about emissions generated due to a travel by flight,"
             +" train or a private vehicle by road between two places, optionally, with no. of passengers if you"+
              "know.  \n  \ne.g: *How much emissions are produced due to flight from Mumbai to Seattle airport with 1202 passengers?*    \n  \n \n You can choose the category from the menu to know the emission related to it.  \n  \nThere is much more I can do. Click Read More to know more.",
            
            buttons: [
                {
                 title: "Read More",
                 openUrlAction: {
                    url: "https://gitlab.com/aossie/CarbonAssistant-Function/tree/master/docs/Usage.md",
                    urlTypeHint: "URL_TYPE_HINT_UNSPECIFIED"
                    }
                }
            ]
        }));
        conv.ask(new Suggestions(["Show the menu"]));    
    }
});

app.intent('menu_intent', (conv,option) => { //intent to show the list of categories
    if (conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
        var items = menu_utils.getCategories();
        conv.ask('This is the list of all categories I support please choose one so that I can provide you the exact value of the emission for it.');
        conv.ask(new List({
            title: "Category List",
            items: items
        }));
    }
});

app.intent('menu_option_handler',(conv, parameters, option) => { //intent to handle the triggering of followup events
    if(option == 'Land'){
        conv.followup('land_intent_triggered', {
            option: option,
        });
    } else if(option == 'Food Production'){
        conv.followup('food_intent_triggered', {
            option: option,
        });
    } else if(option == 'Appliances'){
        conv.followup('appliance_intent_triggered', {
            option: option,
        });
    } else if(option == 'Flights'){
        conv.followup('flights_intent_triggered', {
            option: option,
        });
    } else if(option == 'Train'){
        conv.followup('trains_intent_triggered', {
            option: option,
        });
    } else if(option == 'Sector'){
        conv.followup('sector_intent_triggered', {
            option: option,
        });
    } else if(option == 'Electricity'){
        conv.followup('electricity_intent_triggered', {
            option: option,
        });
    }
});

app.intent('trains_intent', (conv, parameters) => {
    conv.user.storage.lastParams = parameters;
    if(parameters.passengers == ''){
        conv.ask("Would you like to provide the number of passengers travelling?");
        conv.ask(new Suggestions(["Yes, I'll provide", "No, thanks"]));
    } else {
        if (!conv.user.storage.noPermission)
            return trains.processRequest(conv, parameters, true);
        else
            return trains.processRequest(conv, parameters, false);
    }
});

app.intent('trains_passenger_yes', (conv, parameters) => {
    conv.user.storage.lastParams.passengers = parameters.passengers; 
    parameters = conv.user.storage.lastParams;
    if (!conv.user.storage.noPermission)
        return trains.processRequest(conv, parameters, true);
    else
        return trains.processRequest(conv, parameters, false);
});

app.intent('trains_passenger_no', (conv, parameters) => {
    parameters = conv.user.storage.lastParams;
    if (!conv.user.storage.noPermission)
        return trains.processRequest(conv, parameters, true);
    else
        return trains.processRequest(conv, parameters, false);
});

app.intent('trains_passenger_yes-followup', (conv, parameters) => {
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

    if (!conv.user.storage.noPermission)
        return trains.processRequest(conv, newParams, true);
    else
        return trains.processRequest(conv, newParams, false);
});

app.intent('trains_passenger_no-followup', (conv, parameters) => {
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

    if (!conv.user.storage.noPermission)
        return trains.processRequest(conv, newParams, true);
    else
        return trains.processRequest(conv, newParams, false);
});

app.intent('vehicle_intent', (conv, parameters) => {
    conv.user.storage.lastParams = parameters;
    if (!conv.user.storage.noPermission)
        return vehicles.processRequest(conv, parameters, true);
    else
        return vehicles.processRequest(conv, parameters, false);
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

    if (!conv.user.storage.noPermission)
        return vehicles.processRequest(conv, newParams, true);
    else
        return vehicles.processRequest(conv, newParams, false);
});

app.intent('flights_intent', (conv, parameters) => {
    conv.user.storage.lastParams = parameters;
    if(parameters.passengers == ''){
        conv.ask("Would you like to provide the number of passengers travelling?");
        conv.ask(new Suggestions(["Yes, I'll provide", "No, thanks"]));
    } else {
        if (!conv.user.storage.noPermission)
            return flights.processRequest(conv, parameters, true);
        else
            return flights.processRequest(conv, parameters, false);
    }
});

app.intent('flights_passenger_yes', (conv, parameters) => {
    conv.user.storage.lastParams.passengers = parameters.passengers; 
    parameters = conv.user.storage.lastParams;
    if (!conv.user.storage.noPermission)
        return flights.processRequest(conv, parameters, true);
    else
        return flights.processRequest(conv, parameters, false);
});

app.intent('flights_passenger_no', (conv, parameters) => {
    parameters = conv.user.storage.lastParams;
    if (!conv.user.storage.noPermission)
        return flights.processRequest(conv, parameters, true);
    else
        return flights.processRequest(conv, parameters, false);
});

app.intent('flights_passenger_yes-followup', (conv, parameters) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};

    if (parameters.origin && parameters.origin !== "") {
        newParams.origin = parameters.origin;
        newParams.origin_original = newParams.origin_original;
    } else {
        newParams.origin = contextParams.origin;
        newParams.origin_original = contextParams.origin_original;
    }

    if (parameters.destination && parameters.destination !== "") {
        newParams.destination = parameters.destination;
        newParams.destination_original = parameters.destination_original;
    } else {
        newParams.destination = contextParams.destination;
        newParams.destination_original = contextParams.destination_original;
    }

    if (parameters.passengers && parameters.passengers !== "")
        newParams.passengers = parameters.passengers;
    else
        newParams.passengers = contextParams.passengers;

    conv.user.storage.lastParams = newParams;

    if (!conv.user.storage.noPermission)
        return flights.processRequest(conv, newParams, true);
    else
        return flights.processRequest(conv, newParams, false);
});

app.intent('flights_passenger_no-followup', (conv, parameters) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};

    if (parameters.origin && parameters.origin !== "") {
        newParams.origin = parameters.origin;
        newParams.origin_original = newParams.origin_original;
    } else {
        newParams.origin = contextParams.origin;
        newParams.origin_original = contextParams.origin_original;
    }

    if (parameters.destination && parameters.destination !== "") {
        newParams.destination = parameters.destination;
        newParams.destination_original = parameters.destination_original;
    } else {
        newParams.destination = contextParams.destination;
        newParams.destination_original = contextParams.destination_original;
    }

    if (parameters.passengers && parameters.passengers !== "")
        newParams.passengers = parameters.passengers;
    else
        newParams.passengers = contextParams.passengers;

    conv.user.storage.lastParams = newParams;

    if (!conv.user.storage.noPermission)
        return flights.processRequest(conv, newParams, true);
    else
        return flights.processRequest(conv, newParams, false);
});

app.intent('fuels_intent', (conv, parameters) => {
    conv.user.storage.lastParams = parameters;
    if (!conv.user.storage.noPermission)
        return fuels.processRequest(conv, parameters, true);
    else
        return fuels.processRequest(conv, parameters, false);
});

app.intent('fuels_intent - followup', (conv, parameters) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};

    if (parameters.quantity && parameters.quantity !== "")
        newParams.quantity = parameters.quantity;
    else
        newParams.quantity = contextParams.quantity;

    if (parameters.fuel_original && parameters.fuel_original !== "")
        newParams.fuel_original = parameters.fuel_original;
    else
        newParams.fuel_original = contextParams.fuel_original;

    if (parameters.emission_type && parameters.emission_type !== "")
        newParams.emission_type = parameters.emission_type;
    else
        newParams.emission_type = contextParams.emission_type;

    if (parameters.fuel_type && parameters.fuel_type !== "")
        newParams.fuel_type = parameters.fuel_type;
    else
        newParams.fuel_type = contextParams.fuel_type;

    conv.user.storage.lastParams = newParams;

    if (!conv.user.storage.noPermission)
        return fuels.processRequest(conv, newParams, true);
    else
        return fuels.processRequest(conv, newParams, false);
});


app.intent('electricity_intent', (conv, parameters) => {
    conv.user.storage.lastParams = parameters;
    if(parameters.geo_country == ''){
        conv.ask("Would you like to provide the consumption country name?");
        conv.ask(new Suggestions(["Yes, I'll provide", "No, thanks"]));
    } else {
        if (!conv.user.storage.noPermission)
            return electricity.processRequest(conv, parameters, true);
        else
            return electricity.processRequest(conv, parameters, false);
    }
});

app.intent('electricity_intent_region_yes', (conv, parameters) => {
    conv.user.storage.lastParams.geo_country = parameters.geo_country;
    parameters = conv.user.storage.lastParams;
    if(parameters.quantity == ''){
        conv.ask("Would you like to provide the consumption quantity or the unit?");
        conv.ask(new Suggestions(["Yes", "No, thanks"]));
    } else {
        if (!conv.user.storage.noPermission)
            return electricity.processRequest(conv, parameters, true);
        else
            return electricity.processRequest(conv, parameters, false);
    }
});

app.intent('electricity_intent_region_no', (conv, parameters) => {
    parameters = conv.user.storage.lastParams;
    if(parameters.quantity == ''){
        conv.ask("Would you like to provide the consumption quantity or the unit?");
        conv.ask(new Suggestions(["Ok. I'll", "No, that's it"]));
    } else {
        if (!conv.user.storage.noPermission)
            return electricity.processRequest(conv, parameters, true);
        else
            return electricity.processRequest(conv, parameters, false);
    }
});

app.intent('electricity_region_yes_quantity_yes', (conv, parameters) => {
    conv.user.storage.lastParams.quantity = parameters.quantity; 
    parameters = conv.user.storage.lastParams;
    if (!conv.user.storage.noPermission)
        return electricity.processRequest(conv, parameters, true);
    else
        return electricity.processRequest(conv, parameters, false);
});

app.intent('electricity_region_yes_quantity_no', (conv, parameters) => {
    parameters = conv.user.storage.lastParams;
    if (!conv.user.storage.noPermission)
        return electricity.processRequest(conv, parameters, true);
    else
        return electricity.processRequest(conv, parameters, false);
});

app.intent('electricity_region_no_quantity_yes', (conv, parameters) => {
    conv.user.storage.lastParams.quantity = parameters.quantity; 
    parameters = conv.user.storage.lastParams;
    if (!conv.user.storage.noPermission)
        return electricity.processRequest(conv, parameters, true);
    else
        return electricity.processRequest(conv, parameters, false);
});

app.intent('electricity_region_no_quantity_no', (conv, parameters) => {
    parameters = conv.user.storage.lastParams;
    if (!conv.user.storage.noPermission)
        return electricity.processRequest(conv, parameters, true);
    else
        return electricity.processRequest(conv, parameters, false);
});

app.intent('electricity_region_yes_quantity_yes_followup', (conv, parameters) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};

    if (parameters.quantity && parameters.quantity !== "")
        newParams.quantity = parameters.quantity;
    else
        newParams.quantity = contextParams.quantity;

    if (parameters.geo_country && parameters.geo_country !== "")
        newParams.geo_country = parameters.geo_country;
    else
        newParams.geo_country = contextParams.geo_country;
    
    if (parameters.emission_type && parameters.emission_type !== "")
        newParams.emission_type = parameters.emission_type;
    else
        newParams.emission_type = contextParams.emission_type;

    conv.user.storage.lastParams = newParams;
    if (!conv.user.storage.noPermission)
        return electricity.processRequest(conv, newParams, true);
    else
        return electricity.processRequest(conv, newParams, false);
});

app.intent('electricity_region_yes_quantity_no_followup', (conv, parameters) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};

    if (parameters.quantity && parameters.quantity !== "")
        newParams.quantity = parameters.quantity;
    else
        newParams.quantity = contextParams.quantity;

    if (parameters.geo_country && parameters.geo_country !== "")
        newParams.geo_country = parameters.geo_country;
    else
        newParams.geo_country = contextParams.geo_country;
    
    if (parameters.emission_type && parameters.emission_type !== "")
        newParams.emission_type = parameters.emission_type;
    else
        newParams.emission_type = contextParams.emission_type;

    conv.user.storage.lastParams = newParams;
    if (!conv.user.storage.noPermission)
        return electricity.processRequest(conv, newParams, true);
    else
        return electricity.processRequest(conv, newParams, false);
});

app.intent('electricity_region_no_quantity_yes_followup', (conv, parameters) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};

    if (parameters.quantity && parameters.quantity !== "")
        newParams.quantity = parameters.quantity;
    else
        newParams.quantity = contextParams.quantity;

    if (parameters.geo_country && parameters.geo_country !== "")
        newParams.geo_country = parameters.geo_country;
    else
        newParams.geo_country = contextParams.geo_country;
    
    if (parameters.emission_type && parameters.emission_type !== "")
        newParams.emission_type = parameters.emission_type;
    else
        newParams.emission_type = contextParams.emission_type;

    conv.user.storage.lastParams = newParams;
    if (!conv.user.storage.noPermission)
        return electricity.processRequest(conv, newParams, true);
    else
        return electricity.processRequest(conv, newParams, false);
});

app.intent('electricity_region_no_quantity_no_followup', (conv, parameters) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};

    if (parameters.quantity && parameters.quantity !== "")
        newParams.quantity = parameters.quantity;
    else
        newParams.quantity = contextParams.quantity;

    if (parameters.geo_country && parameters.geo_country !== "")
        newParams.geo_country = parameters.geo_country;
    else
        newParams.geo_country = contextParams.geo_country;
    
    if (parameters.emission_type && parameters.emission_type !== "")
        newParams.emission_type = parameters.emission_type;
    else
        newParams.emission_type = contextParams.emission_type;

    conv.user.storage.lastParams = newParams;
    if (!conv.user.storage.noPermission)
        return electricity.processRequest(conv, newParams, true);
    else
        return electricity.processRequest(conv, newParams, false);
});

app.intent('poultry_intent', (conv, parameters) => {
    conv.user.storage.lastParams = parameters;
    
    if (!conv.user.storage.noPermission)
        return poultry.processRequest(conv, parameters, true);
    else
        return poultry.processRequest(conv, parameters, false);
    
});


app.intent('poultry_intent - followup', (conv, parameters) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};

    if (parameters.poultry_type && parameters.poultry_type !== "")
        newParams.poultry_type = parameters.poultry_type;
    else
        newParams.poultry_type = contextParams.poultry_type;

    if (parameters.poultry_region && parameters.poultry_region !== "")
        newParams.poultry_region = parameters.poultry_region;
    else
        newParams.poultry_region = contextParams.poultry_region;

    if (parameters.poultry_quantity && parameters.poultry_quantity !== "")
        newParams.poultry_quantity = parameters.poultry_quantity;
    else
        newParams.poultry_quantity = contextParams.poultry_quantity;

    conv.user.storage.lastParams = newParams;

    if (!conv.user.storage.noPermission)
        return poultry.processRequest(conv, newParams, true);
    else
        return poultry.processRequest(conv, newParams, false);
    
});

app.intent('appliance_intent', (conv, parameters) => {
    conv.user.storage.lastParams = parameters;
    if (parameters.appliance == '') {
        if (conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
            var items = appliances_utils.getApplianceList();
            conv.ask('This is the list of Appliance names Please choose one So, that I can provide you the exact value of the emission.');
            conv.ask(new List({
                title: "Appliances List",
                items: items
            }));
        }
    } else {
        if (!conv.user.storage.noPermission)
            return appliances.processRequest(conv, parameters, true);
        else
            return appliances.processRequest(conv, parameters, false);
    }
});

app.intent('appliance_duration_ask', (conv, parameters, option) => {
    conv.user.storage.lastParams.appliance = option;
    parameters = conv.user.storage.lastParams;
    if (parameters.duration == '') {
        conv.ask("Would you like to provide the duration or the number of hours the appliance is being used?");
        conv.ask(new Suggestions(["Yes, I'll provide", "No, thanks"]));
    } else {
        if (!conv.user.storage.noPermission)
            return appliances.processRequest(conv, parameters, true);
        else
            return appliances.processRequest(conv, parameters, false);
    }
});

app.intent('appliance_duration_yes', (conv, parameters) => {
    conv.user.storage.lastParams.duration = parameters.duration;
    parameters = conv.user.storage.lastParams;
    if(parameters.quantity == ''){
        conv.ask("Would you like to provide the quantity or number of the appliance being used?");
        conv.ask(new Suggestions(["Yes", "No, thanks"]));
    } else {
        if (!conv.user.storage.noPermission)
            return appliances.processRequest(conv, parameters, true);
        else
            return appliances.processRequest(conv, parameters, false);
    }
});

app.intent('appliance_duration_no', (conv, parameters) => {
    parameters = conv.user.storage.lastParams;
    if(parameters.quantity == ''){
        conv.ask("Would you like to provide the quantity or number of the appliance being used?");
        conv.ask(new Suggestions(["Ok. I'll", "No, that's it"]));
    } else {
        if (!conv.user.storage.noPermission)
            return appliances.processRequest(conv, parameters, true);
        else
            return appliances.processRequest(conv, parameters, false);
    }
});

app.intent('appliance_duration_yes_quantity_yes', (conv, parameters) => {
    conv.user.storage.lastParams.quantity = parameters.quantity; 
    parameters = conv.user.storage.lastParams;
    if (!conv.user.storage.noPermission)
        return appliances.processRequest(conv, parameters, true);
    else
        return appliances.processRequest(conv, parameters, false);
});

app.intent('appliance_duration_yes_quantity_no', (conv, parameters) => {
    parameters = conv.user.storage.lastParams;
    if (!conv.user.storage.noPermission)
        return appliances.processRequest(conv, parameters, true);
    else
        return appliances.processRequest(conv, parameters, false);
});

app.intent('appliance_duration_no_quantity_yes', (conv, parameters) => {
    conv.user.storage.lastParams.quantity = parameters.quantity; 
    parameters = conv.user.storage.lastParams;
    if (!conv.user.storage.noPermission)
        return appliances.processRequest(conv, parameters, true);
    else
        return appliances.processRequest(conv, parameters, false);
});

app.intent('appliance_duration_no_quantity_no', (conv, parameters) => {
    parameters = conv.user.storage.lastParams;
    if (!conv.user.storage.noPermission)
        return appliances.processRequest(conv, parameters, true);
    else    
        return appliances.processRequest(conv, parameters, false);
});

app.intent('appliance_duration_yes_quantity_yes-followup', (conv, parameters, option) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};

    if (parameters.type && parameters.type !== "")
        newParams.type = parameters.type;
    else
        newParams.type = contextParams.type;

    if (parameters.appliance && parameters.appliance !== "")
        newParams.appliance = parameters.appliance;
    else if(option && contextParams.appliance == "")
        newParams.appliance = option;
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

    if (!conv.user.storage.noPermission)
        return appliances.processRequest(conv, newParams, true);
    else
        return appliances.processRequest(conv, newParams, false);
});

app.intent('appliance_duration_yes_quantity_no-followup', (conv, parameters, option) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};

    if (parameters.type && parameters.type !== "")
        newParams.type = parameters.type;
    else
        newParams.type = contextParams.type;

    if (parameters.appliance && parameters.appliance !== "")
        newParams.appliance = parameters.appliance;
    else if(option && contextParams.appliance == "")
        newParams.appliance = option;
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

    if (!conv.user.storage.noPermission)
        return appliances.processRequest(conv, newParams, true);
    else
        return appliances.processRequest(conv, newParams, false);
});

app.intent('appliance_duration_no_quantity_yes-followup', (conv, parameters, option) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};

    if (parameters.type && parameters.type !== "")
        newParams.type = parameters.type;
    else
        newParams.type = contextParams.type;

    if (parameters.appliance && parameters.appliance !== "")
        newParams.appliance = parameters.appliance;
    else if(option && contextParams.appliance == "")
        newParams.appliance = option;
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

    if (!conv.user.storage.noPermission)
        return appliances.processRequest(conv, newParams, true);
    else
        return appliances.processRequest(conv, newParams, false);
});

app.intent('appliance_duration_no_quantity_no-followup', (conv, parameters, option) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};

    if (parameters.type && parameters.type !== "")
        newParams.type = parameters.type;
    else
        newParams.type = contextParams.type;

    if (parameters.appliance && parameters.appliance !== "")
        newParams.appliance = parameters.appliance;
    else if(option && contextParams.appliance == "")
        newParams.appliance = option;
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

    if (!conv.user.storage.noPermission)
        return appliances.processRequest(conv, newParams, true);
    else
        return appliances.processRequest(conv, newParams, false);
});

app.intent('appliance_intent-followup', (conv, parameters) => {
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

    if (!conv.user.storage.noPermission)
        return appliances.processRequest(conv, newParams, true);
    else
        return appliances.processRequest(conv, newParams, false);
});

app.intent('land_intent', (conv, parameters, option) => {
    if (parameters.land_type === ""){
        if (conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
            var items = land_utils.getLandTypes();
            conv.ask('This is the list of land types Please choose one So, that I can provide you the exact value of the emission.');
            conv.ask(new List({
                title: "Land Types List",
                items: items
            }));
        }
        conv.user.storage.lastParams = parameters;
    } else {
        if (!conv.user.storage.noPermission)
            return land.processRequest(conv, parameters, true);
        else
            return land.processRequest(conv, parameters, false);
    }
}); 

app.intent('land_intent_followup',(conv,parameters,option) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};
    if (parameters.land_region && parameters.land_region !== "")
        newParams.land_region = parameters.land_region;
    else
        newParams.land_region = contextParams.land_region;

    if (parameters.land_type && parameters.land_type !== "")
        newParams.land_type = parameters.land_type;
    else if(option && contextParams.land_type == "")
        newParams.land_type = option;
    else
        newParams.land_type = contextParams.land_type;
    conv.user.storage.lastParams = newParams;
    if (!conv.user.storage.noPermission)
        return land.processRequest(conv, newParams, true);
    else
        return land.processRequest(conv, newParams, false);
});        
    
app.intent('food_intent', (conv, parameters, option) => {
    if (parameters.food_type === ""){
        if (conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
            var items = food_utils.getFoodTypes();
            conv.ask('This is the list of food types Please choose one So, that I can provide you the exact value of the emission.');
            conv.ask(new List({
                title: "Food Types List",
                items: items
            }));
        }
        conv.user.storage.lastParams = parameters;
    } else {
        if (!conv.user.storage.noPermission)
            return food.processRequest(conv, parameters, true);
        else
            return food.processRequest(conv, parameters, false);
    }
});

app.intent('food_intent_followup',(conv,parameters,option) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};
    
    if (parameters.food_region && parameters.food_region !== "")
        newParams.food_region = parameters.food_region;
    else
        newParams.food_region = contextParams.food_region;

    if (parameters.food_type && parameters.food_type !== "")
        newParams.food_type = parameters.food_type;
    else if(option && contextParams.food_type == "")
        newParams.food_type = option;
    else
        newParams.food_type = contextParams.food_type;
        
    conv.user.storage.lastParams = newParams;
    return food.processRequest(conv, newParams, option);
});

app.intent('sector_intent', (conv, parameters, option) => {
    conv.user.storage.lastParams = parameters;
    if (parameters.sector_type === ""){
        if (conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
            var items = sector_utils.getSectorTypes();
            conv.ask('This is the list of sector types Please choose one So, that I can provide you the exact value of the emission.');
            conv.ask(new List({
                title: "Sector Types List",
                items: items
            }));
        }
        conv.user.storage.lastParams = parameters;
    } else {
        if (!conv.user.storage.noPermission)
            return sector.processRequest(conv, parameters, true);
        else
            return sector.processRequest(conv, parameters, false);
    }
});

app.intent('sector_intent_followup',(conv,parameters,option) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};
    if (parameters.sector_region && parameters.sector_region !== "")
        newParams.sector_region = parameters.sector_region;
    else
        newParams.sector_region = contextParams.sector_region;

    if (parameters.sector_type && parameters.sector_type !== "")
        newParams.sector_type = parameters.sector_type;
    else if(option && contextParams.sector_type == "")
        newParams.sector_type = option;
    else
        newParams.sector_type = contextParams.sector_type;
    option = '';
    conv.user.storage.lastParams = newParams;
    if (!conv.user.storage.noPermission)
        return sector.processRequest(conv, newParams, true);
    else
        return sector.processRequest(conv, newParams, false);
});


// The default fallback intent has been matched, try to recover (https://dialogflow.com/docs/intents#fallback_intents)
app.intent('Default Fallback Intent', (conv) => {
    // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
    sendGoogleResponse(conv, `I'm having trouble, can you try that again?`);
});

// Function to send correctly formatted Google Assistant responses to Dialogflow which are then sent to the user
function sendGoogleResponse(conv, responseToUser) {
    conv.ask(responseToUser); // Google Assistant response
}

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
