var config = require('./config')
const requestLib = require('request');
const reverseLookupManager = require('./reverseLookupManager');
const utils = require('./utils');

exports.processRequest = function(conv, parameters, requestReverseLookup, option) {
    return new Promise(function(resolve, reject) {
        if (parameters.food_region !== "") {
            if(parameters.food_type !== ""){
                switch (parameters.food_type) {
                    case "Beef Production":
                      parameters.food_type = "Meat, cattle";
                      break;
                    case "Cow Dairy Farming":
                      parameters.food_type = "Milk, whole fresh cow";
                      break;
                    case "Production of Cereals excluding rice":
                      parameters.food_type = "Cereals excluding rice";
                      break;
                    case "Rice Production":
                      parameters.food_type = "Rice, paddy";
                      break;
                    case "Goat Production":
                      parameters.food_type = "Meat, goat";
                      break;
                    case "Sheep Dairy Farming":
                      parameters.food_type = "Milk, whole fresh sheep";
                      break;
                    case "Sheep Production":
                     parameters.food_type = "Meat, sheep";
                      break;
                    case "Goat Dairy Farming":
                      parameters.food_type= "Milk, whole fresh goat";
                      break; 
                    case "Hen Production":
                      parameters.food_type = "Eggs, hen, in shell";
                      break;              
                    case "Chicken Production":
                      parameters.food_type = "Meat, chicken";
                      break;
                    case "Camel Dairy Farming":
                      parameters.food_type = "Milk, whole fresh camel";                       
                  }
            }
            let food_type = parameters.food_type;
            let food_region = parameters.food_region;
            var options = {
                uri: config.endpoint + "/food",
                method: 'POST',
                headers: {
                    'access-key': config.access_key
                },
                json: true,
                body: {
                    "item": food_type,
                    "region": food_region
                }
            };

            requestLib(options, function(error, response, body) {
                const button = "/";
                const emissionResponse = "The net emission  due to this food type are given below";
                if (!error && response.statusCode === 200) {
                    let emission = body.quantity;
                    let finalResponseString = 'Net emissions for ' + food_type  + ' in ' + food_region + ' are ' + emission;
                    if (requestReverseLookup) {
                        var emissions = { "CO2": emission };
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
                  if (!error)
                    error = body.error;
                  //Handle the error in the utils function
                  utils.handleError(error, response, body, conv);
                  resolve();
                }
            });

        } else {
            conv.ask("Sorry, I need a valid country name. Could you please repeat your question with correct information?");
            resolve();
        }
    });
}
