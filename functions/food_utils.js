const foodtypes = require('./assets/raw_data_food.json')
const Image =require('actions-on-google').Image;

exports.getFoodTypes = ()=>{
    var items = {};
    var data = (foodtypes);
    console.log("data: ", data);
    data.forEach((obj) => {
        items[obj.food]= {
            title: obj.food,
            description: obj.description,
            image: new Image({
              url: obj.image,
              alt: obj.alt,
            }),
        }        
    });
    return items;
   }