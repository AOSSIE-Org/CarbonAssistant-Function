var config = require('./config')
const requestLib = require('request');

function getFuelType(fuelString) {
    return fuelString.substring(4);
}

exports.processRequest = function(conv, parameters) {
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


                        let unit = body.unit;
                        if (unit !== undefined) {
                            conv.ask(finalResponseString + ' ' + unit);
                            resolve();
                        } else {
                            conv.ask(finalResponseString + ' kg');
                            resolve();
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
                        conv.ask(finalResponseString + ' are as follows:\n  \n' +
                            'Carbon Dioxide: ' + carbonEmission + ' kg.\n' +
                            "Nitrous Oxide: " + nitrousEmission + ' kg.\n' +
                            "Methane: " + methaneEmission + ' kg.');
                        resolve();
                    }
                } else {
                    console.log("Vehicles: error response");
                    if (body.err !== undefined) {
                        console.log("Error: " + JSON.stringify(body));
                        reject(body.err);
                    } else {
                        conv.ask("Sorry, we are facing a temporary outage. Please contact our support.");
                        resolve();
                    }
                }
            });
        } else {
            conv.ask("Sorry, need a valid origin, destination and type of fuel your vehicle uses. Could you please say it again?");
            resolve();
        }
    });
}
