var config = require('./config')
const requestLib = require('request');

exports.processRequest = function(parameters) {
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


                    let unit = body.unit;
                    if (unit !== undefined)
                        resolve(finalResponseString + ' ' + unit);
                    else
                        resolve(finalResponseString + ' kg');
                } else {
                    if (body.err !== undefined) {
                        console.log("Error: " + JSON.stringify(body));
                        resolve(body.err);
                    } else {
                        reject("Sorry, we are facing a temporary outage. Please contact our support.");
                    }
                }
            });
        } else {
            reject("Sorry, need a valid origin and destination of your flight travel");
        }
    });
}
