const agriculturetypes = require('./assets/raw_data_agriculture.json')
exports.getAgricultureTypes = () => {
    var items = {};
    var data = (agriculturetypes);
    console.log("data: ", data);
    data.forEach((obj) => {
        items[obj.agriculture] = {
            title: obj.agriculture,
            description: obj.description,
        }
    });
    return items;
}