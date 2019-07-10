const landtypes = require('./assets/raw_data_land.json');
const Image = require('actions-on-google').Image;

exports.getLandTypes = () => {
    var items = {};
    var data = (landtypes);
    console.log("data: ", data);
    data.forEach((obj) => {
        items[obj.land] = {
            title: obj.land,
            description: obj.description,
            image: new Image({
                url: obj.url,
                alt: obj.alt,
            }),
        }
    });
    return items;
}