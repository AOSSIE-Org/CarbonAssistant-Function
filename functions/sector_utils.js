const sectortypes = require('./assets/raw_data_sector.json');
const Image = require('actions-on-google').Image;

exports.getSectorTypes = () => {
    var items = {};
    var data = (sectortypes);
    console.log("data: ", data);
    data.forEach((obj) => {
        items[obj.sector] = {
            title: obj.sector,
            description: obj.description,
            image: new Image({
                url: obj.url,
                alt: obj.alt,
            }),
        }
    });
    return items;
}