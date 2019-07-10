const supported_appliances = require('./assets/raw_data_appliances.json');

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
            console.log(applianceTypes);
        }
    }
    return applianceTypes;
}

// Shuffle array
const randApplianceTypes = supported_appliances.sort(() => 0.5 - Math.random());
// Get sub-array of first n elements after shuffled
let selected = randApplianceTypes.slice(0, 29);
exports.getApplianceList = () => {
    var items = {};
    var data = (selected);
    console.log("data: ", data);
    data.forEach((obj) => {
        items[obj.Appliance] = {
            title: obj.Appliance
        }
    });
    return items;
}