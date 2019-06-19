const categories = require('./assets/raw_data_menu.json');

exports.getCategories = ()=>{
    var items = {};
    var data = (categories);
    console.log("data: ", data);
    data.forEach((obj) => {
        items[obj.category]= {
            title: obj.category,
            description: obj.description,

        }      
    });
    return items;
   }