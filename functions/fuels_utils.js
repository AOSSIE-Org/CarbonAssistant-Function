const fueltypes = require('./assets/raw_data_fuels.json');
const Image = require('actions-on-google').Image;

exports.getFuelTypes = () => {
    var items = {};
    var data = (fueltypes);
    console.log("data: ", data);
    data.forEach((obj) => {
        items[obj.fuel] = {
            title: obj.fuel,
            description: obj.description,
            image: new Image({
                url: obj.url,
                alt: obj.alt,
            }),
        }
    });
    return items;
}