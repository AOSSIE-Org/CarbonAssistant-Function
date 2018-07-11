var config = require('./config')
const requestLib = require('request');
const utils = require('./utils');

function constructResponse(result) {
    let response;
    if (result.section == "vehicles") {
        let sourceCity = result.match.source;
        let sourceState = result.match.sourceState;
        let destinationCity = result.match.destination;
        let destinationState = result.match.destinationState;
        let mileage = utils.roundWithPrecision(result.match.mileage, 1);
        let distance = utils.roundWithPrecision(result.match.distance, 1);
        response = "A road trip from " + sourceCity + ", " + sourceState + " to " + destinationCity + ", " + destinationState +
            " produces similar emissions";
    } else if (result.section == "trees") {
        let treeName = result.match.item;
        let quantity = Math.round(result.match.quantity);
        response = "It will take " + quantity + " years for a "+treeName+" tree to absorb these emissions";
    } else if (result.section == "trains") {
        let sourceCity = result.match.source;
        let destinationCity = result.match.destination;
        let distance = utils.roundWithPrecision(result.match.distance, 1);
        let passengers = result.match.passengers;
        response = "A train from " + sourceCity + " to " + destinationCity + " carrying " + passengers + " passengers" +
            " will produce these many emissions";
    }
	console.log("Reverselookup response: "+response);
	return response;
}

exports.reverseLookup = function(emissions, locationData, blacklist) {
    return new Promise(function(resolve, reject) {
        var reverseLookupOptions = {
            uri: config.endpoint + "/comparer",
            method: 'POST',
            headers: {
                'access-key': config.access_key
            },
            json: true,
            body: {
                "emissions": {
                    "CO2": emissions.CO2
                },
                "relativeLocation": {
                    "lat": locationData.latitude,
                    "lng": locationData.longitude
                },
                "section": "all"
            }
        };
        requestLib(reverseLookupOptions, function(error, response, body) {
            if (!error && response.statusCode === 200) {
                let matches = body.matches;
                let responses = [];
				console.log("Matches length:"+matches.length);
                for (let i = 0; i < matches.length; i++) {
                    if (matches[i].status === "success" && matches[i].section !== blacklist)
                        responses.push(constructResponse(matches[i]));
                }
                console.log("Allowed responses: "+JSON.stringify(responses));
                resolve(responses);
            } else {
                console.log("Error in reverseLookup:" + error);
                reject();
            }
        });
    });
}
