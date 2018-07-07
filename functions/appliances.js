var config = require('./config')
const requestLib = require('request');

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

exports.processRequest = function(conv, parameters) {
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
            } else
                appliance_path = "";

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


                        let unit = body.unit;
                        if (unit !== undefined) {
                            conv.ask(finalResponseString + ' ' + unit);
                            resolve();
                        } else {
                            conv.ask(finalResponseString + ' kg');
                            resolve();
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
                        conv.ask(finalResponseString + ' are as follows:\n  \n' +
                            'Carbon Dioxide: ' + carbonEmission + ' kg.\n' +
                            "Nitrous Oxide: " + nitrousEmission + ' kg.\n' +
                            "Methane: " + methaneEmission + ' kg.');
                        resolve();
                    }
                } else {
                    if (body && body.err) {
                        console.log("Error: " + JSON.stringify(body));
                        conv.ask(body.err);
                        resolve();
                    } else {
                        conv.ask("Sorry, we are facing a temporary outage. Please contact our support.\nError: "+error);
                        resolve();
                    }
                }
            });
        } else {
            conv.ask("Sorry, I did not understand the appliance you mentioned");
            resolve();
        }
    });
}
