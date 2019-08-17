const dotenv = require('dotenv');
dotenv.config();
const requestLib = require('request');
const utils = require('./utils');
const reverseLookupManager = require('./reverseLookupManager');
const BASE_URL = process.env.ENDPOINT;
const ENDPOINT = BASE_URL + "/agriculture";
const ACCESS_KEY = process.env.ACCESS_KEY;

exports.processRequest = function(conv, parameters, requestReverseLookup, option) {
    return new Promise(function(resolve, reject) {
        if (parameters.agriculture_region !== "") {
            let agriculture_type = parameters.agriculture_type;
            let agriculture_region = parameters.agriculture_region;
            var options = {
                uri: ENDPOINT,
                method: 'POST',
                headers: {
                    'access-key': ACCESS_KEY
                },
                json: true,
                body: {
                    "item": agriculture_type,
                    "region": agriculture_region
                }
            };

            requestLib(options, function(error, response, body) {
                const button = "/visuals/agriculture";
                const emissionResponse = "The net emissions or removals  due to this agriculture type are given below";
                if (!error && response.statusCode === 200) {
                    let emission = body.quantity;
                    let finalResponseString = 'Net emissions for ' + agriculture_type + ' in ' + agriculture_region + ' are ' + emission;

                    if (requestReverseLookup) {
                        var emissions = {
                            "CO2": emission
                        };
                        let reverseLookup = reverseLookupManager.reverseLookup(emissions, conv.user.storage.location.coordinates);
                        reverseLookup
                            .then((responses) => {
                                let selectedResponse = utils.getRandomNumber(0, responses.length - 1);
                                let unit = body.unit;
                                if (unit !== undefined) {
                                    finalResponseString = finalResponseString + ' ' + unit + ' \n\n' + responses[selectedResponse];
                                    utils.richResponse(conv, finalResponseString, responses[selectedResponse], button);
                                    resolve();
                                } else {
                                    finalResponseString = finalResponseString + ' kg' + ' \n\n' + responses[selectedResponse];
                                    utils.richResponse(conv, finalResponseString, responses[selectedResponse], button);
                                    resolve();
                                }
                            })
                            .catch((err) => {
                                let unit = body.unit;
                                if (unit !== undefined) {
                                    utils.richResponse(conv, finalResponseString + ' ' + unit, emissionResponse, button);
                                    resolve();
                                } else {
                                    utils.richResponse(conv, finalResponseString + ' kg', emissionResponse, button);
                                    resolve();
                                }
                            });
                    } else {
                        let unit = body.unit;
                        if (unit !== undefined) {
                            utils.richResponse(conv, finalResponseString + ' ' + unit, emissionResponse, button);
                            resolve();
                        } else {
                            utils.richResponse(conv, finalResponseString + ' kg', emissionResponse, button);
                            resolve();
                        }
                    }

                } else {
                    // Handle errors here
                    utils.handleError(error, response, body, conv);
                    resolve();
                }
            });

        } else {
            conv.ask("Sorry, need a valid country name. Could you please repeat your question with correct information?");
            resolve();
        }
    });
}