const poultrytypes = require('./assets/raw_data_poultry.json');
const Image = require('actions-on-google').Image;

exports.getPoultryTypes = () => {
    var items = {};
    var data = (poultrytypes);
    console.log("data: ", data);
    data.forEach((obj) => {
        items[obj.poultry] = {
            title: obj.poultry,
            description: obj.description,
            image: new Image({
                url: obj.url,
                alt: obj.alt,
            }),
        }
    });
    return items;
}

const poultryregions = require('./assets/raw_data_region.json');
exports.getPoultryRegions = () => {
    var items = {};
    var data = (poultryregions);
    console.log("data: ", data);
    data.forEach((obj) => {
        items[obj.region] = {
            title: obj.region,
        }
    });
    return items;
}