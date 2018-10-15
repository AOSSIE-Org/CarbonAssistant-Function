var config = require('./config')
const requestLib = require('request');
const reverseLookupManager = require('./reverseLookupManager');
const utils = require('./utils');
const appliances_utils = require('./appliances_utils');

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

exports.processRequest = function(conv, parameters, requestReverseLookup) {
    return new Promise(function(resolve, reject) {
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
            } else {
                appliance_path = "";
                var applianceTypes = appliances_utils.getApplianceTypes(item);
                console.log("Appliance types avilable: " + applianceTypes);
                console.log("Appliance types length: " + applianceTypes.length);
                if (applianceTypes.length > 0) {
                    utils.responseWithSuggestions(conv, "Please select from the following types of " + item + "s", applianceTypes);
                    resolve();
                    return;
                }
            }

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
                const emissionResponse = "The emissions released due to this action are given below";
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

                        if (requestReverseLookup) {
                            let reverseLookup = reverseLookupManager.reverseLookup(body.emissions, conv.user.storage.location.coordinates);
                            reverseLookup
                                .then((responses) => {
                                    let selectedResponse = utils.getRandomNumber(0, responses.length - 1);
                                    let unit = body.unit;
                                    if (unit !== undefined) {
                                        finalResponseString = finalResponseString + ' ' + unit + ' \n\n' + responses[selectedResponse];
                                        utils.richResponse(conv, finalResponseString, responses[selectedResponse]);
                                        resolve();
                                    } else {
                                        finalResponseString = finalResponseString + ' kg' + ' \n\n' + responses[selectedResponse];
                                        utils.richResponse(conv, finalResponseString, responses[selectedResponse]);
                                        resolve();
                                    }
                                })
                                .catch((err) => {
                                    let unit = body.unit;
                                    if (unit !== undefined) {
                                        utils.richResponse(conv, finalResponseString + ' ' + unit, emissionResponse);
                                        resolve();
                                    } else {
                                        utils.richResponse(conv, finalResponseString + ' kg', emissionResponse);
                                        resolve();
                                    }
                                });
                        } else {
                            let unit = body.unit;
                            if (unit !== undefined) {
                                utils.richResponse(conv, finalResponseString + ' ' + unit, emissionResponse);
                                resolve();
                            } else {
                                utils.richResponse(conv, finalResponseString + ' kg', emissionResponse);
                                resolve();
                            }
                        }
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

                        if (requestReverseLookup) {
                            console.log("Location data:" + JSON.stringify(conv.user.storage.location.coordinates));
                            let reverseLookup = reverseLookupManager.reverseLookup(body.emissions, conv.user.storage.location.coordinates);
                            reverseLookup
                                .then((responses) => {
                                    console.log("responses length: " + responses.length);
                                    let selectedResponse = utils.getRandomNumber(0, responses.length - 1);
                                    console.log("selected response: " + selectedResponse);
                                    finalResponseString = finalResponseString + ' are as follows:\n  \n' +
                                        'Carbon Dioxide: ' + carbonEmission + ' kg.\n' +
                                        "Nitrous Oxide: " + nitrousEmission + ' kg.\n' +
                                        "Methane: " + methaneEmission + ' kg.' + ' \n\n' + responses[selectedResponse];
                                    utils.richResponse(conv, finalResponseString, responses[selectedResponse]);
                                    resolve();
                                })
                                .catch((err) => {
                                    finalResponseString = finalResponseString + ' are as follows:\n  \n' +
                                        'Carbon Dioxide: ' + carbonEmission + ' kg.\n' +
                                        "Nitrous Oxide: " + nitrousEmission + ' kg.\n' +
                                        "Methane: " + methaneEmission + ' kg.';
                                    utils.richResponse(conv, finalResponseString, emissionResponse);
                                    resolve();
                                });
                        } else {
                            finalResponseString = finalResponseString + ' are as follows:\n  \n' +
                                'Carbon Dioxide: ' + carbonEmission + ' kg.\n' +
                                "Nitrous Oxide: " + nitrousEmission + ' kg.\n' +
                                "Methane: " + methaneEmission + ' kg.';
                            utils.richResponse(conv, finalResponseString, emissionResponse);
                            resolve();
                        }
                    }
                } else {
                    conv.tell("Sorry, we are facing a temporary outage. Please contact our support.\nError: " + error);
                    resolve();
                }
            });
        } else {
            conv.ask("Sorry, I didn't get the appliance you were looking for. Can you say the appliance name again?");
            resolve();
        }
    });
}
