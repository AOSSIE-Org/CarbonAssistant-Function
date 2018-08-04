var config = require('./config')
const requestLib = require('request');
const reverseLookupManager = require('./reverseLookupManager');
const utils = require('./utils');

exports.processRequest = function(conv, parameters) {
    return new Promise(function(resolve, reject) {
        if (parameters.origin != "" && parameters.destination !== "") {
            let origin = parameters.origin,
                destination = parameters.destination,
                passengers = 1;

            if (parameters.passengers !== "")
                passengers = parameters.passengers;

            var options = {
                uri: config.endpoint + "/trains",
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
                    let basicResponseString = 'CO2 emissions due to train journey from ' + origin + ' to ' + destination;

                    let finalResponseString;
                    if (passengers === 1)
                        finalResponseString = basicResponseString;
                    else
                        finalResponseString = basicResponseString + ' carrying ' + passengers + ' passengers';

                    let carbonEmission = body.emissions.CO2;

                    let reverseLookup = reverseLookupManager.reverseLookup(body.emissions, conv.user.storage.location.coordinates, "trains");
                    reverseLookup
                        .then((responses) => {
                            let selectedResponse = utils.getRandomNumber(0, responses.length - 1);
                            finalResponseString = finalResponseString + ' are ' + carbonEmission + ' kg.\n\n' + responses[selectedResponse]
                            utils.richResponse(conv, finalResponseString, responses[selectedResponse]);
                            resolve();
                        })
                        .catch((err) => {
                            finalResponseString = finalResponseString + ' are ' + carbonEmission + ' kg.\n';
                            utils.richResponse(conv, finalResponseString, emissionResponse);
                            resolve();
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
            conv.close("Sorry, need a valid origin and destination of your train journey. Could you please say it again?");
            resolve();
        }
    });
}