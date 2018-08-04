var config = require('./config')
const requestLib = require('request');
const reverseLookupManager = require('./reverseLookupManager');
const utils = require('./utils');

exports.processRequest = function(conv, parameters) {
    return new Promise(function(resolve, reject) {
        if (parameters.origin != "" && parameters.destination !== "") {
            let origin = parameters.origin,
                destination = parameters.destination,
                origin_original = parameters.origin_original,
                destination_original = parameters.destination_original,
                passengers = 1;

            if (parameters.passengers !== "")
                passengers = parameters.passengers;

            var options = {
                uri: config.endpoint + "/flight",
                method: 'POST',
                headers: {
                    'access-key': config.access_key
                },
                json: true,
                body: {
                    "origin": origin,
                    "destination": destination,
                    "passengers": passengers
                }
            };

            requestLib(options, function(error, response, body) {
                const emissionResponse = "The emissions released due to this action are given below";
                if (!error && response.statusCode === 200) {
                    console.log(body);
                    let emissionType = parameters.emission_type;
                    let emission = body.emissions.CO2;

                    let basicResponseString = 'Carbon emissions for a flight from ' + origin_original + ' (' +
                        origin + ') to ' + destination_original + ' (' + destination + ')';

                    let finalResponseString;
                    if (passengers !== 1)
                        finalResponseString = basicResponseString + ' carrying ' + passengers + ' passengers are ' + emission;
                    else
                        finalResponseString = basicResponseString + ' are ' + emission

                    let reverseLookup = reverseLookupManager.reverseLookup(body.emissions, conv.user.storage.location.coordinates);
                    reverseLookup
                        .then((responses) => {
                            let selectedResponse = utils.getRandomNumber(0, responses.length - 1);
                            let unit = body.unit;
                            if (unit !== undefined) {
                                finalResponseString = finalResponseString + ' ' + unit + '\n\n' + responses[selectedResponse];
                                utils.richResponse(conv, finalResponseString, responses[selectedResponse])
                                resolve();
                            } else {
                                finalResponseString = finalResponseString + ' kg ' + '\n\n' + responses[selectedResponse];
                                utils.richResponse(conv, finalResponseString, responses[selectedResponse])
                                resolve();
                            }
                        })
                        .catch((err) => {
                            let unit = body.unit;
                            if (unit !== undefined) {
                                conv.close(finalResponseString + ' ' + unit);
                                resolve();
                            } else {
                                conv.close(finalResponseString + ' kg');
                                resolve();
                            }
                        });
                } else {
                    if (body.err !== undefined) {
                        console.log("Error: " + JSON.stringify(body));
                        conv.close(body.err);
                        resolve();
                    } else {
                        conv.close("Sorry, we are facing a temporary outage. Please contact our support.");
                        resolve();
                    }
                }
            });
        } else {
            conv.close("Sorry, need a valid origin and destination of your flight travel");
            resolve();
        }
    });
}