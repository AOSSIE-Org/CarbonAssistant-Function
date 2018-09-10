const supported_appliances = require('./assets/raw_data_appliances.json')

let matchAppliance = (appliance, toCheck) => {
    return new RegExp('\\b' + appliance + '\\b', 'i').test(toCheck);
}

exports.getApplianceTypes = (appliance) => {
    let applianceTypes = [];
    for (let i = 0; i < supported_appliances.length; i++) {
        if (matchAppliance(appliance, supported_appliances[i]["Appliance"])) {
            var type = supported_appliances[i]["Appliance"].replace(appliance, "").trim();
            if (type.length > 0)
                applianceTypes.push(type);
        }
    }
    return applianceTypes;
}