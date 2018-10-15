var config = require('./config')
const requestLib = require('request');
const utils = require('./utils');

exports.processRequest = function(conv, parameters) {
    return new Promise(function(resolve, reject) {
        if (parameters.poultry_type !== "") {
            let poultry_type = parameters.poultry_type;
            let poultry_region = "Default",
                poultry_quantity = 1;

            if (parameters.poultry_region !== "")
                poultry_region = parameters.poultry_region;

            if (parameters.poultry_quantity !== "")
                poultry_quantity = parameters.poultry_quantity;

            console.log("Poultry type = " + poultry_type + ", region =" + poultry_region + ", quantity =" + poultry_quantity);

            var options = {
                uri: config.endpoint + "/poultry",
                method: 'POST',
                headers: {
                    'access-key': config.access_key
                },
                json: true,
                body: {
                    "type": poultry_type,
                    "region": poultry_region,
                    "quantity": poultry_quantity
                }
            };

            requestLib(options, function(error, response, body) {
                const emissionResponse = "The emissions released due to this action are given below";
                if (!error && response.statusCode === 200) {
                    console.log(body);

                    let emission = body.emissions.CO2;
                    let unit = '';
                    if (poultry_type !== 'egg')
                        unit = 'kg(s) ';
                    let basicResponseString = 'CO2 emissions for ' + poultry_quantity + ' ' + unit + poultry_type + ' production';
                    let finalResponseString = "";

                    if (poultry_region != "Default")
                        finalResponseString = basicResponseString + ' in ' + poultry_region + ' is ' + emission;
                    else
                        finalResponseString = basicResponseString + ' is ' + emission;


                    let outputUnit = body.unit;
                    if (outputUnit !== undefined) {
                        finalResponseString = finalResponseString + ' ' + outputUnit;
                        utils.richResponse(conv, finalResponseString, emissionResponse);
                        resolve();
                    } else {
                        finalResponseString = finalResponseString + ' kg'
                        utils.richResponse(conv, finalResponseString, emissionResponse);
                        resolve();
                    }
                } else {
                    conv.ask("Sorry, we are facing a temporary outage. Please contact our support.");
                    resolve();
                }
            });

        } else {
            conv.ask("Sorry, I did not understand the poultry type you said.");
            resolve();
        }
    });
}
