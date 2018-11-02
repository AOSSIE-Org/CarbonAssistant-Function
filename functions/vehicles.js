var config = require('./config')
const requestLib = require('request');
const reverseLookupManager = require('./reverseLookupManager');
const utils = require('./utils');

function getFuelType(fuelString) {
    return fuelString.substring(4);
}

exports.processRequest = function(conv, parameters, requestReverseLookup) {
    return new Promise(function(resolve, reject) {
        if (parameters.origin != "" && parameters.destination !== "" && parameters.fuel_type !== "") {
            let origin = parameters.origin,
                destination = parameters.destination,
                fuel_type = getFuelType(parameters.fuel_type),
                mileage = 20;

            if (parameters.mileage !== "")
                mileage = parameters.mileage;

            var options = {
                uri: config.endpoint + "/vehicle",
                method: 'POST',
                headers: {
                    'access-key': config.access_key
                },
                json: true,
                body: {
                    "type": fuel_type,
                    "origin": origin,
                    "destination": destination,
                    "mileage": mileage
                }
            };

            requestLib(options, function(error, response, body) {
                if (!error && response.statusCode === 200) {
                    const emissionResponse = "The emissions released due to this action are given below";
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

                        let basicResponseString = emissionType + ' emissions for a road trip from ' + origin + ' to ' + destination + ' on a ' +
                            fuel_type + '-based vehicle ';

                        let finalResponseString;
                        if (mileage !== 20)
                            finalResponseString = basicResponseString + 'with a mileage of ' + mileage + ' km/l is ' + emission;
                        else
                            finalResponseString = basicResponseString + 'usually with a mileage of 20 km/l is ' + emission;

                        if (requestReverseLookup) {
                            let reverseLookup = reverseLookupManager.reverseLookup(body.emissions, conv.user.storage.location.coordinates, "vehicles");
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
                                        finalResponseString = finalResponseString + ' ' + unit;
                                        utils.richResponse(conv, finalResponseString, emissionResponse);
                                        resolve();
                                    } else {
                                        finalResponseString = finalResponseString + ' kg';
                                        utils.richResponse(conv, finalResponseString, emissionResponse);
                                        resolve();
                                    }
                                });
                        } else {
                            let unit = body.unit;
                            if (unit !== undefined) {
                                finalResponseString = finalResponseString + ' ' + unit;
                                utils.richResponse(conv, finalResponseString, emissionResponse);
                                resolve();
                            } else {
                                finalResponseString = finalResponseString + ' kg';
                                utils.richResponse(conv, finalResponseString, emissionResponse);
                                resolve();
                            }
                        }
                    } else {
                        let basicResponseString = 'Emissions for a road trip from ' + origin + ' to ' + destination + ' on a ' +
                            fuel_type + '-based vehicle ';

                        let finalResponseString;
                        if (mileage !== 20)
                            finalResponseString = basicResponseString + 'with a mileage of ' + mileage + ' km/l';
                        else
                            finalResponseString = basicResponseString + 'usually with a mileage of 20 km/l';

                        let carbonEmission = body.emissions.CO2;
                        let nitrousEmission = body.emissions.N2O;
                        let methaneEmission = body.emissions.CH4;

                        if (requestReverseLookup) {
                            let reverseLookup = reverseLookupManager.reverseLookup(body.emissions, conv.user.storage.location.coordinates);
                            reverseLookup
                                .then((responses) => {
                                    console.log("responses length: " + responses.length);
                                    let selectedResponse = utils.getRandomNumber(0, responses.length - 1);
                                    finalResponseString = finalResponseString + ' are as follows:\n  \n' +
                                        'Carbon Dioxide: ' + carbonEmission + ' kg.\n' +
                                        "Nitrous Oxide: " + nitrousEmission + ' kg.\n' +
                                        "Methane: " + methaneEmission + ' kg.' + ' \n\n' + responses[selectedResponse];
                                    console.log("selected response: " + selectedResponse);
                                    utils.richResponse(conv, finalResponseString, responses[selectedResponse]);
                                    resolve();
                                })
                                .catch((err) => {
                                    finalResponseString = finalResponseString + ' are as follows:\n  \n' +
                                        'Carbon Dioxide: ' + carbonEmission + ' kg.\n' +
                                        "Nitrous Oxide: " + nitrousEmission + ' kg.\n' +
                                        "Methane: " + methaneEmission + ' kg.'
                                    utils.richResponse(conv, finalResponseString, emissionResponse);
                                    resolve();
                                });
                        } else {
                            finalResponseString = finalResponseString + ' are as follows:\n  \n' +
                                'Carbon Dioxide: ' + carbonEmission + ' kg.\n' +
                                "Nitrous Oxide: " + nitrousEmission + ' kg.\n' +
                                "Methane: " + methaneEmission + ' kg.'
                            utils.richResponse(conv, finalResponseString, emissionResponse);
                            resolve();
                        }
                    }
                } else {
                  //Handle the error in the utils function
                  conv.close(utils.handleError(error, response, body));
                  resolve();
                }
            });
        } else {
            conv.ask("Sorry, need a valid origin, destination and type of fuel your vehicle uses. Could you please say it again?");
            resolve();
        }
    });
}
