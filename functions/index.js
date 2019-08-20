'use strict';

const functions = require('firebase-functions'); // Cloud Functions for Firebase library
const {
    dialogflow,
    Permission,
    Suggestions,
    BasicCard,
    SimpleResponse,
    RegisterUpdate,
    List
} = require('actions-on-google'); // Google Assistant helper library
const requestLib = require('request');
var flights = require('./flights');
var vehicles = require('./vehicles');
var fuels = require('./fuels');
var electricity = require('./electricity');
var poultry = require('./poultry');
var appliances = require('./appliances');
var trains = require('./trains');
var land = require('./land');
var food = require('./food');
var land_utils = require('./land_utils');
var food_utils = require('./food_utils');
var menu_utils = require('./menu_utils');
var appliances_utils = require('./appliances_utils');
var sector =require('./sector');
var sector_utils = require('./sector_utils');
var fuels_utils = require('./fuels_utils');
var vehicles_utils = require('./vehicles_utils');
var poultry_utils = require('./poultry_utils');
var agriculture = require('./agriculture');
var agriculture_utils = require('./agriculture_utils');
const dotenv = require('dotenv');
dotenv.config();

const app = dialogflow({
    debug: true
});

// The default welcome intent has been matched, welcome the user (https://dialogflow.com/docs/events#default_welcome_intent)
app.intent('Default Welcome Intent', (conv) => {
    const options = {
        context: `Hello, Welcome to CarbonFootPrint Action! To address you by name and provide you relatable emission comparisons based on your location`,
        // Ask for more than one permission. User can authorize all or none.
        permissions: ['NAME', 'DEVICE_PRECISE_LOCATION'],
    };
    if ((!conv.user.storage.name || !conv.user.storage.location) && !conv.user.storage.noPermission)
        conv.ask(new Permission(options));
    else {
        if (!conv.user.storage.noPermission) {
            const name = conv.user.storage.name.given;
            conv.ask(`Hello ${name}, what's the info you need today? Feel free to ask what I can do for assistance or you can simply say 'help'`);
        } else {
            conv.ask(`Hey there!, what's the info you need today? Feel free to ask what I can do for assistance or you can simply say 'help'`);
        }
    }
});

app.intent('request_permission', (conv) => {
    const options = {
        context: `Hello, Welcome to CarbonFootPrint Action! To address you by name and provide you relatable emission comparisons based on your location`,
        // Ask for more than one permission. User can authorize all or none.
        permissions: ['NAME', 'DEVICE_PRECISE_LOCATION'],
    };
    if (!conv.user.storage.name || !conv.user.storage.location)
        conv.ask(new Permission(options));
    else
        conv.ask(`I already have all the permissions I need. Thanks!`);
});

app.intent('permission_confirmation', (conv, parameters, permission_allowed) => {
    if (permission_allowed) {
        const {
            location
        } = conv.device;
        const {
            name
        } = conv.user;

        conv.user.storage.noPermission = false;
        conv.user.storage.name = name;
        conv.user.storage.location = location;

        const {
            latitude,
            longitude
        } = location.coordinates;
        conv.ask(`Ok ${name.given}, we are all set!`);
    } else {
        //For display screens
        if (conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
            conv.ask(` Unfortunately, we can't provide you intelligent emission results without the location information.
                Therefore, you'll only be able to receive raw emission results. You can allow the permission if you change your mind.`);
            conv.ask(new Suggestions(['Request Permission', 'Allowed Permission']));
            conv.user.storage.noPermission = true;
        } else if (!conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
            // google home
            conv.ask(` Unfortunately, we can't provide you intelligent emission results without the location information.
                Therefore, you'll only be able to receive raw emission results. You can allow the permission if you change your mind.`);
            conv.user.storage.noPermission = true;

        }


    }
});

app.intent('help_intent', (conv) => {
    //google home
    if (!conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')){
        conv.ask(`I can try to answer some of your emission related questions. I promise to make it less boring by giving you info that you can relate with!I can provide you with info regarding emissions released due to appliance usage, flight travels, train journeys, road trips, fuel consumption, poultry and meat generation and electricity generation across the world.  You can ask me about how much emissions your washing machine produces, or, how much pollution you contribute to by taking a flight to Mauritius. I can also help you in reducing your carbon footprint by following various simple methods. I support limited number of categories right now but trust me I'll get better over time.`)
    } else if(conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')){
    //display screens
        conv.ask(new SimpleResponse({
            speech: "I can help you in reducing your carbon footprint also I can tell you the emissions produced by different activities and appliances. Try asking me about them. You can also choose the category you want to know the emission of, from the menu list.",
            text: "Here's what I can do:"
        }));
        conv.ask(new BasicCard({
            title: '',
            text: "**Appliances**  \n  \ne.g: *How much emissions are produced if a radio is used for 3 hours in Canada?* \n  \n  \n**Travel \u0026 Journeys**  \n  \nYou can ask about emissions generated due to a travel by flight,"
             +" train or a private vehicle by road between two places, optionally, with no. of passengers if you"+
              "know.  \n  \ne.g: *How much emissions are produced due to flight from Mumbai to Seattle airport with 1202 passengers?*    \n  \n \n**Reducing Emissions** \n  \nI can help in reducing your carbon footprint by various simple methods.\n  \ne.g: *You can always reduce carbon emissions by planting a tree or recycling and composting.* \n  \nYou can choose the category from the menu to know the emission related to it.  \n  \nThere is much more I can do. Click Read More to know more.",
            
            buttons: [
                {
                 title: "Read More",
                 openUrlAction: {
                    url: "https://gitlab.com/aossie/CarbonAssistant-Function/tree/master/docs/Usage.md",
                    urlTypeHint: "URL_TYPE_HINT_UNSPECIFIED"
                }
            }]
        }));
        conv.ask(new Suggestions(["Show the menu"]));
    }
});

app.intent('menu_intent', (conv, option) => { //intent to show the list of categories
    if (conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
        var items = menu_utils.getCategories();
        conv.ask('This is the list of all categories I support please choose one so that I can provide you the exact value of the emission for it.');
        conv.ask(new List({
            title: "Category List",
            items: items
        }));
    }
});

app.intent('menu_option_handler', (conv, parameters, option) => { //intent to handle the triggering of followup events
    if (option == 'Land') {
        conv.followup('land_intent_triggered', {
            option: option,
        });
    } else if (option == 'Food Production') {
        conv.followup('food_intent_triggered', {
            option: option,
        });
    } else if(option == 'Appliances'){
        conv.followup('appliance_intent_triggered', {
            option: option,
        });
    } else if(option == 'Flights'){
        conv.followup('flights_intent_triggered', {
            option: option,
        });
    } else if(option == 'Train'){
        conv.followup('trains_intent_triggered', {
            option: option,
        });
    } else if(option == 'Sector'){
        conv.followup('sector_intent_triggered', {
            option: option,
        });
    } else if(option == 'Electricity'){
        conv.followup('electricity_intent_triggered', {
            option: option,
        });
    } else if(option == 'Fuel consumption'){
        conv.followup('fuels_intent_triggered', {
            option: option,
        });
    } else if (option == 'Vehicles') {
        conv.followup('vehicles_intent_triggered', {
            option: option,
        });
    } else if(option == 'Poultry'){
        conv.followup('poultry_intent_triggered', {
            option: option,
        });
    } else if(option == 'Agriculture'){
        conv.followup('agriculture_intent_triggered', {
            option: option,
        });
    } else if(option == 'Reduce Emission'){
        conv.followup('reduceEmission_intent_triggered', {
            option: option,
        });
    } 
});

app.intent('reduceEmission_intent', (conv) => {
    //google home
    if (!conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')){
        conv.ask(`There are few ways following which you can help reduce carbon emission. For example, You can join a NGO or plant a tree, you can reduce your emission in daily transportation, you can reduce the emission by donating clothes or by avoiding food wastage, You can also help by reducing emission in home. Let me how you want to reduce emission and I will help you with it.`)
    } else if(conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')){
    //display screens
        conv.ask(new SimpleResponse({
            speech: "I can help you with reducing emission in couple of fields, let me know which one you want to begin with",
            text: "Here are couple of ways to reduce emission :-"
        }));
        conv.ask(new BasicCard({
            title: '',
            text: "**1. NGO** \n  \n *You can be a member of an NGO and help the community in reducing emission* \n  \n  \n**2. Food and Composting** \n  \n *You can reduce emission by using organic products and reducing wastage* \n  \n  \n**3. Transportation** \n  \n *You can can reduce emission in your daily transportation by taking alternatives to driving.* \n  \n  \n**4. Clothes and Shopping** \n  \n *You can reduce emission by donating clothes and not using plastic bags* \n  \n  \n**5. Trees** \n  \n *You can always reduce emission be planting trees* \n  \n  \n**6. Air Travel** \n  \n *You can reduce emission in air travel by avoiding flying when possible, fly less frequently, fly shorter distances, and fly economy class.* \n  \n  \n**7. Go Green at Home** \n  \n *You reduce emission at home by turning off lights when not required*",
            buttons: [
                {
                 title: "Read More",
                 openUrlAction: {
                    url: "https://cotap.org/reduce-carbon-emissions/",
                    urlTypeHint: "URL_TYPE_HINT_UNSPECIFIED"
                    }
                }
            ]
        }));
        conv.ask(new Suggestions(["NGO", "Composting", "Transportation", "Go Green at Home", "Clothes and Shopping", "Trees", "Air Travel"]));
    }
});

app.intent('reduce_emission_ngo_intent', (conv) => {
    //google home
    if (!conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')){
        conv.ask(`Human caused climate change is real and it is caused due to the increase in the GHG emissions. It is a burning global issue now. We can reduce the GHG emissions in a number of ways. 1.You can switch to the companies and support organisations who are trying to reduce the green house gases themselves and supporting action on climate change. 2.During the elections always vote for the candidate who is most likely to support climate-friendly policies. 3. Learn about the climate change and GHG emissions and share with others what you learn. 4. Be a part of an Non Governmental Organization and start campaigns. 5. You can always support and fund a project Or an NGO actively working for the climate change. `)
    } else if(conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')){
    //display screens
        conv.ask(new SimpleResponse({
            speech: "Human caused climate change is real and it is caused due to the increase in the GHG emissions. It is a burning global issue now. We can reduce the GHG emissions in a number of ways. ",
            text: "Here are couple of ways in which you can reduce emission by being a part of an Organization and bringing mass:-"
        }));
        conv.ask(new BasicCard({
            title: '',
            text: "**1. Support climate action organizations.** \n \n *Research the companies you buy your products from (especially ongoing purchases). If they aren't reducing greenhouse gases themselves and supporting action on climate change, switch to a company that is.* \n  \n  \n**2. Vote like your future depends on it - because it does!** \n \n *Always vote in every election for the candidate who is most likely to support climate-friendly policies. Ask your elected officials to support a carbon free and dividend policy to provide incentives for companies and individuals to reduce carbon emissions.*\n \n\n **3. Spread the message**  \n  \n*Learn more about climate change and share with others what you learn because together we can make a change!* \n  \n  \n **4. Help in stabilizing the population** \n \n*Support organizations that educate, protect and empower girls and women and help in stabilizing our population, such as Camfed.org, Girls Not Brides, Tostan, and Population Services International. * \n \n \n **5. Be a part of an NGO** \n \n *You can always contribute by being a part of an Non Governmental Organization. You be a part of a campaign and bring awareness among the mass. You also contribute by funding a project Or an NGO actively working for the climate change.*",


            buttons: [
                {
                 title: "Read More",
                 openUrlAction: {
                    url: "https://cotap.org/reduce-carbon-footprint/",
                    urlTypeHint: "URL_TYPE_HINT_UNSPECIFIED"
                    }
                }
            ]
        }));
        conv.ask('I can send you daily updates about NGO and eco-friendly organizations. Would you like that?');
        conv.ask(new Suggestions('Send NGO updates'));  
    }
});

app.intent('reduce_emission_food_intent', (conv) => {
    //google home
    if (!conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')){
        conv.ask(`Meat and dairy is responsible for 14.5 percent of man-made global greenhouse gas emissions, mainly from production and processing and the methane that beef and sheep belch out. 1.Every day that you forgo meat and dairy, you can reduce your carbon footprint by 8 pounds—that’s 2,920 pounds a year. You can start by joining Meatless Mondays. 2.Buy foodstuffs in bulk when possible using your own reusable container. 3. Reduce your food waste by planning meals ahead of time, freezing the excess and reusing leftovers. 4.Compost your food waste if possible. `)
    } else if(conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')){
    //display screens
        conv.ask(new SimpleResponse({
            speech: "Meat and dairy is responsible for 14.5 percent of man-made global greenhouse gas emissions, mainly from production and processing and the methane that beef and sheep belch out. ",
            text: "Here are couple of ways in which you can reduce emission due to food production and transportation:-"
        }));
        conv.ask(new BasicCard({
            title: '',
            text: "**1.Eat low on the food chain.**  \n  \n *This means eating mostly fruits, veggies, grains, and beans. Livestock—meat and dairy—is responsible for 14.5 percent of man-made global greenhouse gas emissions, mainly from feed production and processing and the methane that beef and sheep belch out. Every day that you forgo meat and dairy, you can reduce your carbon footprint by 8 pounds—that’s 2,920 pounds a year. You can start by joining Meatless Mondays.* \n  \n  \n**2. Choose organic and local foods that are in season.** \n \n *Transporting food from far away, whether by truck, ship, rail or plane, uses fossil fuels for fuel and for cooling to keep foods in transit from spoiling.*\n \n\n **3. Buy foodstuffs in bulk**  \n  \n*Buy food products in bulk when possible using your own reusable container.* \n  \n  \n **4. Reduce Waste**\n \n *Reduce your food waste by planning meals ahead of time, freezing the excess and reusing leftovers. You can also save water by using the dishwasher when full and by selecting the program with low water usage.*\n \n \n **5. Compost** \n \n *You can always make your own compost with uncooked vegetable scraps. Using a home-composting system in earthen pots can avoid a building’s meaningless contribution of 22 tonnes of waste, which would end up in a landfill. This is equivalent to planting 29 trees per building per year.*",


            buttons: [
                {
                 title: "Read More",
                 openUrlAction: {
                    url: "http://www.greeneatz.com/foods-carbon-footprint.html",
                    urlTypeHint: "URL_TYPE_HINT_UNSPECIFIED"
                    }
                }
            ]
        }));
        conv.ask('I can send you daily updates about composting and organic food. Would you like that?');
        conv.ask(new Suggestions('Send food updates')); 
    }
});

app.intent('reduce_emission_transportation_intent', (conv) => {
    //google home
    if (!conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')){
        conv.ask(`An average car produces about five tons of CO2 each year. Making changes in how you get around can significantly cut your carbon budget. 1. Always try to choose alternatives to driving. When possible, walk or ride your bike in order to avoid carbon emissions completely. 2. Drive a fuel efficient vehicle. 3.Avoid speeding and unnecessary acceleration because it can reduce mileage by up to 33%, waste gas and money, and increase your carbon emissions. 4. When doing errands, try to combine them to reduce your driving. 5.On longer trips, turn on the cruise control, which can save gas. `)
    } else if(conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')){
    //display screens
        conv.ask(new SimpleResponse({
            speech: "An average car produces about five tons of CO2 each year. Making changes in how you get around can significantly cut your carbon budget. ",
            text: "Here are couple of ways in which you can reduce your carbon emissions from driving:-"
        }));
        conv.ask(new BasicCard({
            title: '',
            text: "**1. Alternatives to driving** \n \n *When possible, walk or ride your bike in order to avoid carbon emissions completely. Carpooling and public transportation drastically reduce GHG emissions by spreading them out over many riders.* \n  \n  \n**2. Driving style** \n \n *If you must drive, avoid unnecessary braking and acceleration. Some studies found that aggressive driving can result in 40 percent more fuel consumption than consistent, calm driving.*\n \n\n **3. Take care of your car**  \n  \n*Keeping your tires properly inflated can increase your fuel efficiency by three percent; and ensuring that your car is properly maintained can increase it by four percent. Remove any extra weight from the car.* \n  \n  \n **4. Traffic apps** \n \n*Use traffic apps like Waze to help avoid getting stuck in traffic jams.* \n \n \n **5. Hybrid or Electric vehicle** \n \n *If you’re shopping for a new car, consider purchasing a hybrid or electric vehicle. But do factor in the greenhouse gas emissions from the production of the car as well as its operation. Some electric vehicles are initially responsible for more emissions than internal combustion engine vehicles because of manufacturing impacts; but they make up for it after three years.*",


            buttons: [
                {
                 title: "Read More",
                 openUrlAction: {
                    url: "https://cotap.org/reduce-carbon-emissions/",
                    urlTypeHint: "URL_TYPE_HINT_UNSPECIFIED"
                    }
                }
            ]
        }));
        conv.ask('I can send you daily updates about alternatives to driving and eco-friendly transportation. Would you like that?');
        conv.ask(new Suggestions('Ok. Send updates')); 
    }
});

app.intent('reduce_emission_air_travel_intent', (conv) => {
    //google home
    if (!conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')){
        conv.ask(`Air travel is probably responsible for the largest part of your carbon footprint. It is one of the major contributor of the green house gases. 1.Avoid flying if possible, on shorter trips driving may emit fewer greenhouse gases. 2.Fly nonstop since landings and takeoffs use more fuel and produce more emissions. 3.If you can’t avoid flying, offset the carbon emissions of your travel. 4.Don’t fly on private jets and always go economy class.`)
    } else if(conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')){
    //display screens
        conv.ask(new SimpleResponse({
            speech: " Air travel is probably responsible for the largest part of your carbon footprint. It is one of the major contributor of the green house gases. ",
            text: "Here are couple of ways in which you can reduce your carbon emissions from air travel:-"
        }));
        conv.ask(new BasicCard({
            title: '',
            text: "**1. Go Economy Class** \n \n *Business class is responsible for almost three times as many emissions as economy because in economy, the flight’s carbon emissions are shared among more passengers; first class can result in nine times more carbon emissions than economy.* \n  \n  \n**2. Fly Nonstop** \n \n *landings and takeoffs use more fuel and produce more emissions.*\n \n \n **3. Don't Fly on Private Jets**  \n  \n*Fly first or business class if you must, because at least those seats always fill up anyway, and avoid private jets.* \n  \n  \n **4. Avoid flying if possible** \n \n*Until petroleum-based aviation fuel is replaced, you should avoid flying when possible, fly less frequently, fly shorter distances, and fly economy class.*",


            buttons: [
                {
                 title: "Read More",
                 openUrlAction: {
                    url: "https://cotap.org/reduce-carbon-emissions/",
                    urlTypeHint: "URL_TYPE_HINT_UNSPECIFIED"
                    }
                }
            ]
        }));
        conv.ask('I can send daily updates about eco-friendly air travel. Would you like that?');
        conv.ask(new Suggestions('Send daily')); 
    }
});

app.intent('reduce_emission_shopping_intent', (conv) => {
    //google home
    if (!conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')){
        conv.ask(` It has been estimated that 29% of greenhouse gas emissions result from the provision of goods, which means the extraction of resources, manufacturing, transport, and final disposal of goods. 1.Wash your clothing in cold water because the enzymes in cold water detergent are designed to clean better in cold water. 2.Don't buy fast fashion. 3.Buy used or recycled item whenever possible. 4.Bring your own reusable bag when you shop and try avoiding the usage of plastic. 5.Use energy star products and opt for a laptop instead of a desktop. 6.Try donating clothes whenever possible.`)
    } else if(conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')){
    //display screens
        conv.ask(new SimpleResponse({
            speech: "  It has been estimated that 29% of greenhouse gas emissions result from the provision of goods, which means the extraction of resources, manufacturing, transport, and final disposal of goods. ",
            text: "Here are couple of ways in which you can reduce your carbon emissions from clothing and shopping:-"
        }));
        conv.ask(new BasicCard({
            title: '',
            text: "**1. Don't buy fast fashion** \n \n *Trendy, cheap items that go out of style quickly get dumped in landfills where they produce methane as they decompose.* \n  \n  \n**2. Wash your clothing in cold water** \n \n *The enzymes in cold water detergent are designed to clean better in cold water. Doing two loads of laundry weekly in cold water instead of hot or warm water can save up to 500 pounds of carbon dioxide each year.*\n \n \n **3. Buy less stuff**  \n  \n*Buy used or recycled items whenever possible and bring your own reusable bag when you shop. Try donating clothes whenever possible.* \n  \n  \n **4. Use energy star products** \n \n*If shopping for appliances, lighting, office equipment or electronics, look for Energy Star products, which are certified to be more energy efficient.* \n \n \n **5. Laptop over a desktop** \n \n *If you’re in the market for a new computer, opt for a laptop instead of a desktop. Laptops require less energy to charge and operate than desktops.* ",

            buttons: [
                {
                 title: "Read More",
                 openUrlAction: {
                    url: "https://cotap.org/reduce-carbon-emissions/",
                    urlTypeHint: "URL_TYPE_HINT_UNSPECIFIED"
                    }
                }
            ]
        }));
        conv.ask('I can send you daily updates about eco-friendly shopping and donations. Would you like that?');
        conv.ask(new Suggestions("Ok. Update me")); 
    }
});

app.intent('reduce_emission_home_appliances_intent', (conv) => {
    //google home
    if (!conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')){
        conv.ask(` All the electronics draw energy when they are plugged in, even if they're powered down. This vampire power is responsible for draining up to 59 billion dollar in energy every year. 1. Change incandescent light bulbs to light emitting diodes. 2.Do an energy audit of your home. 3.Switch lights off when you leave the room and unplug your electronic devices when they are not in use. 4.Installing a low-flow showerhead to reduce hot water use can save 350 pounds of CO2. 5.Turn your water heater down to 120˚F. This can save about 550 pounds of CO2 a year. 6.Lower your thermostat in winter and raise it in summer. Use less air conditioning in the summer.`)
    } else if(conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')){
    //display screens
        conv.ask(new SimpleResponse({
            speech: "All the electronics draw energy when they are plugged in, even if they're powered down. This vampire power is responsible for draining up to 59 billion dollar in energy every year. ",
            text: "Here are couple of ways in which you can reduce your home energy carbon emissions:-"
        }));
        conv.ask(new BasicCard({
            title: '',
            text: "**1. Do an energy audit of your home** \n \n *This will show how you use or waste energy and help identify ways to be more energy efficient.* \n  \n  \n**2. Change incandescent light bulbs to LEDs** \n \n *Though LEDs cost more, they use a quarter of the energy and last up to 25 times longer. They are also preferable to compact fluorescent lamp bulbs, which emit 80 percent of their energy as heat and contain mercury.*\n \n \n**3. Unplug your electronic devices**  \n  \n*Switch lights off when you leave the room and unplug your electronic devices when they are not in use. Turn your water heater down to 120˚F. This can save about 550 pounds of CO2 a year.* \n  \n  \n **4. Use solar energy** \n \n*Add solar panels to the roof of your home. This costs a little more than the above options, but many providers offer financing options which minimize upfront costs.* \n \n \n **5. Energy Star** \n \n *Make energy efficiency a primary consideration when choosing new appliances like furnaces, air conditioning units, dishwashers, and refrigerators. ENERGY STAR labeled products are recognized as having superior energy efficiency.* ",

            buttons: [
                {
                 title: "Read More",
                 openUrlAction: {
                    url: "https://cotap.org/reduce-carbon-emissions/",
                    urlTypeHint: "URL_TYPE_HINT_UNSPECIFIED"
                    }
                }
            ]
        }));
        conv.ask('I can send you daily updates about reducing carbon emissions at home. Would you like that?');
        conv.ask(new Suggestions('Send updates daily')); 
    }
});

app.intent('reduce_emission_trees_intent', (conv) => {
    //google home
    if (!conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')){
        conv.ask(` Whether you live in a house or an apartment, planting some greens is a quick and easy way to reduce your carbon footprint. We all know plants absorb carbon dioxide. Plant some bee friendly flowers, a few trees, or a vegetable garden. Balcony gardens are great for urban dwellings. Cities often need to reduce the urban heat island effect. Basically, cities tend to be hotter than rural areas because of vast pavement areas, concrete buildings, and increased human activity. Creating more spaces for plants, grasses, and trees can mitigate this effect and lead to better cooling, which will be a necessity with worsening climate change. Help avoid the heat island effect by planting trees for shade, or maybe try a green roof or community garden.`)
    } else if(conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')){
    //display screens
        conv.ask(new SimpleResponse({
            speech: "A young tree absorbs roughly 13 pounds of CO2 per year and a mature tree can absorb 48 pounds. After 40 years, a tree will have sequestered 1 ton of carbon that would have otherwise contributed to global warming. ",
            text: "Here are couple of ways in which you can reduce the carbon emissions by planting trees:-"
        }));
        conv.ask(new BasicCard({
            title: '',
            text: "**1. Plant a Garden** \n \n *Plants consume carbon dioxide, a significant greenhouse gas. The reduction of carbon dioxide in the atmosphere has an indirect cooling effect. Creating more spaces for plants, grasses, and trees can mitigate the heat island effect and lead to better cooling, which will be a necessity with worsening climate change.* \n  \n  \n**2. Green Hotels** \n \n *Whenever possible choose green hotels and encourage hotels you visit to green their practices.* \n \n \n**3.Support Green homes**  \n  \n *A green home is a type of house designed to be environmentally sustainable and focus on the efficient use of water, energy and building material. It may include sustainable energy sources such as solar or geothermal, and be sited to take maximum advantage of natural features such as sunlight and tree cover to improve energy efficiency. You can always support green home project by funding and promoting it.* \n  \n  \n**4. Support Green Highways** \n \n*A green highway is a roadway constructed per a relatively new concept for roadway design that integrates transportation functionality and ecological sustainability. The result is a highway that will benefit transportation, the ecosystem, urban growth, public health and surrounding communities. You can always help by supporting and funding the green highways project.*",

            buttons: [
                {
                 title: "Read More",
                 openUrlAction: {
                    url: "https://cotap.org/reduce-carbon-emissions/",
                    urlTypeHint: "URL_TYPE_HINT_UNSPECIFIED"
                    }
                }
            ]
        }));
        conv.ask('I can send you these updates daily. Would you like that?');
        conv.ask(new Suggestions('Send green updates')); 
    }
});

app.intent("Setup_Daily_Updates_Trees", conv => {
    // Request to register Daily Updates
    conv.ask(new RegisterUpdate({
        intent: "reduce_emission_trees_intent",
        frequency: "DAILY"
    }));
});

app.intent("Setup_Daily_Updates_Home", conv => {
    // Request to register Daily Updates
    conv.ask(new RegisterUpdate({
        intent: "reduce_emission_home_appliances_intent",
        frequency: "DAILY"
    }));
});

app.intent("Setup_Daily_Updates_Shopping", conv => {
    // Request to register Daily Updates
    conv.ask(new RegisterUpdate({
        intent: "reduce_emission_shopping_intent",
        frequency: "DAILY"
    }));
});

app.intent("Setup_Daily_Updates_Air", conv => {
    // Request to register Daily Updates
    conv.ask(new RegisterUpdate({
        intent: "reduce_emission_air_travel_intent",
        frequency: "DAILY"
    }));
});

app.intent("Setup_Daily_Updates_Transportation", conv => {
    // Request to register Daily Updates
    conv.ask(new RegisterUpdate({
        intent: "reduce_emission_transportation_intent",
        frequency: "DAILY"
    }));
});

app.intent("Setup_Daily_Updates_Food", conv => {
    // Request to register Daily Updates
    conv.ask(new RegisterUpdate({
        intent: "reduce_emission_food_intent",
        frequency: "DAILY"
    }));
});

app.intent("Setup_Daily_Updates_Ngo", conv => {
    // Request to register Daily Updates
    conv.ask(new RegisterUpdate({
        intent: "reduce_emission_ngo_intent",
        frequency: "DAILY"
    }));
});


app.intent("Finish_Daily_Updates_Setup", (conv, params, registered) => {
    if (registered && registered.status === "OK") {
        conv.close("OK. I'll start giving you daily updates. See you again.");
    } else {
        reply(conv, "I won't send you daily reminders. Can I help you with anything else?");
    }
});

app.intent('trains_intent', (conv, parameters) => {
    conv.user.storage.lastParams = parameters;
    if(parameters.passengers == ''){
        conv.ask("Would you like to provide the number of passengers travelling?");
        conv.ask(new Suggestions(["Yes, I'll provide", "No, thanks"]));
    } else {
        if (!conv.user.storage.noPermission)
            return trains.processRequest(conv, parameters, true);
        else
            return trains.processRequest(conv, parameters, false);
    }
});

app.intent('trains_passenger_yes', (conv, parameters) => {
    conv.user.storage.lastParams.passengers = parameters.passengers; 
    parameters = conv.user.storage.lastParams;
    if (!conv.user.storage.noPermission)
        return trains.processRequest(conv, parameters, true);
    else
        return trains.processRequest(conv, parameters, false);
});

app.intent('trains_passenger_no', (conv, parameters) => {
    parameters = conv.user.storage.lastParams;
    if (!conv.user.storage.noPermission)
        return trains.processRequest(conv, parameters, true);
    else
        return trains.processRequest(conv, parameters, false);
});

app.intent('trains_passenger_yes-followup', (conv, parameters) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};

    if (parameters.origin && parameters.origin !== "")
        newParams.origin = parameters.origin;
    else
        newParams.origin = contextParams.origin;

    if (parameters.destination && parameters.destination !== "")
        newParams.destination = parameters.destination;
    else
        newParams.destination = contextParams.destination;

    if (parameters.passengers && parameters.passengers !== "")
        newParams.passengers = parameters.passengers;
    else
        newParams.passengers = contextParams.passengers;

    conv.user.storage.lastParams = newParams;

    if (!conv.user.storage.noPermission)
        return trains.processRequest(conv, newParams, true);
    else
        return trains.processRequest(conv, newParams, false);
});

app.intent('trains_passenger_no-followup', (conv, parameters) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};

    if (parameters.origin && parameters.origin !== "")
        newParams.origin = parameters.origin;
    else
        newParams.origin = contextParams.origin;

    if (parameters.destination && parameters.destination !== "")
        newParams.destination = parameters.destination;
    else
        newParams.destination = contextParams.destination;

    if (parameters.passengers && parameters.passengers !== "")
        newParams.passengers = parameters.passengers;
    else
        newParams.passengers = contextParams.passengers;

    conv.user.storage.lastParams = newParams;

    if (!conv.user.storage.noPermission)
        return trains.processRequest(conv, newParams, true);
    else
        return trains.processRequest(conv, newParams, false);
});

app.intent('vehicle_intent', (conv, parameters) => {
    conv.user.storage.lastParams = parameters;
    if (parameters.fuel_type == '') {
        if (conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
            var items = vehicles_utils.getFuelTypes();
            conv.ask('Can you please select the type of fuel your vehicle uses so that I can provide you the exact value of the emission.');
            conv.ask(new List({
                title: "Fuel Types List",
                items: items
            }));
        } else if(!conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
            conv.ask('Can you please select the type of fuel your vehicle uses so that I can provide you the exact value of the emission. 1.B20 Fuel. 2.Bio Diesel. 3.CNG. 4.Diesel. 5.E10 Fuel. 6.E25 Fuel. 7.E85 Fuel. 8.Ethanol. 9.Gasoline. 10.LPG. 11.Petrol.');
        }
    } else {
        if (!conv.user.storage.noPermission)
            return vehicles.processRequest(conv, parameters, true);
        else
            return vehicles.processRequest(conv, parameters, false);
    }

});

app.intent('vehicles_emission_type_ask', (conv, parameters, option) => {
    conv.user.storage.lastParams.fuel_type = option;
    parameters = conv.user.storage.lastParams;
    if (parameters.emission_type == '') {
        if (conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
            conv.ask("Would you like to provide the emission type?");
            conv.ask(new Suggestions(["Yes, I'll provide", "No, thanks", "carbon", "methane", "nitrous"]));
        } else if(!conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
            conv.ask("Would you like to provide the emission type?");
        }
    } else {
        if (!conv.user.storage.noPermission)
            return vehicles.processRequest(conv, parameters, true);
        else
            return vehicles.processRequest(conv, parameters, false);
    }
});

app.intent('vehicles_emission_type_yes', (conv, parameters) => {
    conv.user.storage.lastParams.emission_type = parameters.emission_type;
    parameters = conv.user.storage.lastParams;
    if (parameters.mileage == '') {
        if (conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
            conv.ask("Would you like to provide the mileage or the fuel efficiency of the vehicle that is the distance traveled per unit of fuel?");
            conv.ask(new Suggestions(["Yes, I'll provide", "No, thanks"]));
        } else if(!conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
            conv.ask("Would you like to provide the mileage or the fuel efficiency of the vehicle that is the distance traveled per unit of fuel?");
        }
    } else {
        if (!conv.user.storage.noPermission)
            return vehicles.processRequest(conv, parameters, true);
        else
            return vehicles.processRequest(conv, parameters, false);
    }
});

app.intent('vehicles_emission_type_no', (conv, parameters) => {
    parameters = conv.user.storage.lastParams;
    if (parameters.mileage == '') {
        if (conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
            conv.ask("Would you like to provide the mileage or the fuel efficiency of the vehicle that is the distance traveled per unit of fuel?");
            conv.ask(new Suggestions(["Ok. I'll", "No, that's it"]));
        } else if(!conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
            conv.ask("Would you like to provide the mileage or the fuel efficiency of the vehicle that is the distance traveled per unit of fuel?");
        }
    } else {
        if (!conv.user.storage.noPermission)
            return vehicles.processRequest(conv, parameters, true);
        else
            return vehicles.processRequest(conv, parameters, false);
    }
});

app.intent('vehicles_emission_type_yes_mileage_yes', (conv, parameters) => {
    conv.user.storage.lastParams.mileage = parameters.mileage;
    parameters = conv.user.storage.lastParams;
    if (!conv.user.storage.noPermission)
        return vehicles.processRequest(conv, parameters, true);
    else
        return vehicles.processRequest(conv, parameters, false);
});

app.intent('vehicles_emission_type_yes_mileage_no', (conv, parameters) => {
    parameters = conv.user.storage.lastParams;
    if (!conv.user.storage.noPermission)
        return vehicles.processRequest(conv, parameters, true);
    else
        return vehicles.processRequest(conv, parameters, false);
});

app.intent('vehicles_emission_type_no_mileage_yes', (conv, parameters) => {
    conv.user.storage.lastParams.mileage = parameters.mileage;
    parameters = conv.user.storage.lastParams;
    if (!conv.user.storage.noPermission)
        return vehicles.processRequest(conv, parameters, true);
    else
        return vehicles.processRequest(conv, parameters, false);
});

app.intent('vehicles_emission_type_no_mileage_no', (conv, parameters) => {
    parameters = conv.user.storage.lastParams;
    if (!conv.user.storage.noPermission)
        return vehicles.processRequest(conv, parameters, true);
    else
        return vehicles.processRequest(conv, parameters, false);
});

app.intent('vehicle_intent-followup', (conv, parameters) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};

    if (parameters.origin && parameters.origin !== "")
        newParams.origin = parameters.origin;
    else
        newParams.origin = contextParams.origin;

    if (parameters.destination && parameters.destination !== "")
        newParams.destination = parameters.destination;
    else
        newParams.destination = contextParams.destination;

    if (parameters.mileage && parameters.mileage !== "")
        newParams.mileage = parameters.mileage;
    else
        newParams.mileage = contextParams.mileage;

    if (parameters.emission_type && parameters.emission_type !== "")
        newParams.emission_type = parameters.emission_type;
    else
        newParams.emission_type = contextParams.emission_type;

    if (parameters.fuel_type && parameters.fuel_type !== "")
        newParams.fuel_type = parameters.fuel_type;
    else
        newParams.fuel_type = contextParams.fuel_type;

    conv.user.storage.lastParams = newParams;

    if (!conv.user.storage.noPermission)
        return vehicles.processRequest(conv, newParams, true);
    else
        return vehicles.processRequest(conv, newParams, false);
});

app.intent('vehicles_emission_type_yes_mileage_yes-followup', (conv, parameters) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};

    if (parameters.origin && parameters.origin !== "")
        newParams.origin = parameters.origin;
    else
        newParams.origin = contextParams.origin;

    if (parameters.destination && parameters.destination !== "")
        newParams.destination = parameters.destination;
    else
        newParams.destination = contextParams.destination;

    if (parameters.mileage && parameters.mileage !== "")
        newParams.mileage = parameters.mileage;
    else
        newParams.mileage = contextParams.mileage;

    if (parameters.emission_type && parameters.emission_type !== "")
        newParams.emission_type = parameters.emission_type;
    else
        newParams.emission_type = contextParams.emission_type;

    if (parameters.fuel_type && parameters.fuel_type !== "")
        newParams.fuel_type = parameters.fuel_type;
    else
        newParams.fuel_type = contextParams.fuel_type;

    conv.user.storage.lastParams = newParams;

    if (!conv.user.storage.noPermission)
        return vehicles.processRequest(conv, newParams, true);
    else
        return vehicles.processRequest(conv, newParams, false);
});

app.intent('vehicles_emission_type_yes_mileage_no-followup', (conv, parameters) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};

    if (parameters.origin && parameters.origin !== "")
        newParams.origin = parameters.origin;
    else
        newParams.origin = contextParams.origin;

    if (parameters.destination && parameters.destination !== "")
        newParams.destination = parameters.destination;
    else
        newParams.destination = contextParams.destination;

    if (parameters.mileage && parameters.mileage !== "")
        newParams.mileage = parameters.mileage;
    else
        newParams.mileage = contextParams.mileage;

    if (parameters.emission_type && parameters.emission_type !== "")
        newParams.emission_type = parameters.emission_type;
    else
        newParams.emission_type = contextParams.emission_type;

    if (parameters.fuel_type && parameters.fuel_type !== "")
        newParams.fuel_type = parameters.fuel_type;
    else
        newParams.fuel_type = contextParams.fuel_type;

    conv.user.storage.lastParams = newParams;

    if (!conv.user.storage.noPermission)
        return vehicles.processRequest(conv, newParams, true);
    else
        return vehicles.processRequest(conv, newParams, false);
});

app.intent('vehicles_emission_type_no_mileage_yes-followup', (conv, parameters) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};

    if (parameters.origin && parameters.origin !== "")
        newParams.origin = parameters.origin;
    else
        newParams.origin = contextParams.origin;

    if (parameters.destination && parameters.destination !== "")
        newParams.destination = parameters.destination;
    else
        newParams.destination = contextParams.destination;

    if (parameters.mileage && parameters.mileage !== "")
        newParams.mileage = parameters.mileage;
    else
        newParams.mileage = contextParams.mileage;

    if (parameters.emission_type && parameters.emission_type !== "")
        newParams.emission_type = parameters.emission_type;
    else
        newParams.emission_type = contextParams.emission_type;

    if (parameters.fuel_type && parameters.fuel_type !== "")
        newParams.fuel_type = parameters.fuel_type;
    else
        newParams.fuel_type = contextParams.fuel_type;

    conv.user.storage.lastParams = newParams;

    if (!conv.user.storage.noPermission)
        return vehicles.processRequest(conv, newParams, true);
    else
        return vehicles.processRequest(conv, newParams, false);
});

app.intent('vehicles_emission_type_no_mileage_no-followup', (conv, parameters) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};

    if (parameters.origin && parameters.origin !== "")
        newParams.origin = parameters.origin;
    else
        newParams.origin = contextParams.origin;

    if (parameters.destination && parameters.destination !== "")
        newParams.destination = parameters.destination;
    else
        newParams.destination = contextParams.destination;

    if (parameters.mileage && parameters.mileage !== "")
        newParams.mileage = parameters.mileage;
    else
        newParams.mileage = contextParams.mileage;

    if (parameters.emission_type && parameters.emission_type !== "")
        newParams.emission_type = parameters.emission_type;
    else
        newParams.emission_type = contextParams.emission_type;

    if (parameters.fuel_type && parameters.fuel_type !== "")
        newParams.fuel_type = parameters.fuel_type;
    else
        newParams.fuel_type = contextParams.fuel_type;

    conv.user.storage.lastParams = newParams;

    if (!conv.user.storage.noPermission)
        return vehicles.processRequest(conv, newParams, true);
    else
        return vehicles.processRequest(conv, newParams, false);
});

app.intent('flights_intent', (conv, parameters) => {
    conv.user.storage.lastParams = parameters;
    if(parameters.passengers == ''){
        conv.ask("Would you like to provide the number of passengers travelling?");
        conv.ask(new Suggestions(["Yes, I'll provide", "No, thanks"]));
    } else {
        if (!conv.user.storage.noPermission)
            return flights.processRequest(conv, parameters, true);
        else
            return flights.processRequest(conv, parameters, false);
    }
});

app.intent('flights_passenger_yes', (conv, parameters) => {
    conv.user.storage.lastParams.passengers = parameters.passengers; 
    parameters = conv.user.storage.lastParams;
    if (!conv.user.storage.noPermission)
        return flights.processRequest(conv, parameters, true);
    else
        return flights.processRequest(conv, parameters, false);
});

app.intent('flights_passenger_no', (conv, parameters) => {
    parameters = conv.user.storage.lastParams;
    if (!conv.user.storage.noPermission)
        return flights.processRequest(conv, parameters, true);
    else
        return flights.processRequest(conv, parameters, false);
});

app.intent('flights_passenger_yes-followup', (conv, parameters) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};

    if (parameters.origin && parameters.origin !== "") {
        newParams.origin = parameters.origin;
        newParams.origin_original = newParams.origin_original;
    } else {
        newParams.origin = contextParams.origin;
        newParams.origin_original = contextParams.origin_original;
    }

    if (parameters.destination && parameters.destination !== "") {
        newParams.destination = parameters.destination;
        newParams.destination_original = parameters.destination_original;
    } else {
        newParams.destination = contextParams.destination;
        newParams.destination_original = contextParams.destination_original;
    }

    if (parameters.passengers && parameters.passengers !== "")
        newParams.passengers = parameters.passengers;
    else
        newParams.passengers = contextParams.passengers;

    conv.user.storage.lastParams = newParams;

    if (!conv.user.storage.noPermission)
        return flights.processRequest(conv, newParams, true);
    else
        return flights.processRequest(conv, newParams, false);
});

app.intent('flights_passenger_no-followup', (conv, parameters) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};

    if (parameters.origin && parameters.origin !== "") {
        newParams.origin = parameters.origin;
        newParams.origin_original = newParams.origin_original;
    } else {
        newParams.origin = contextParams.origin;
        newParams.origin_original = contextParams.origin_original;
    }

    if (parameters.destination && parameters.destination !== "") {
        newParams.destination = parameters.destination;
        newParams.destination_original = parameters.destination_original;
    } else {
        newParams.destination = contextParams.destination;
        newParams.destination_original = contextParams.destination_original;
    }

    if (parameters.passengers && parameters.passengers !== "")
        newParams.passengers = parameters.passengers;
    else
        newParams.passengers = contextParams.passengers;

    conv.user.storage.lastParams = newParams;

    if (!conv.user.storage.noPermission)
        return flights.processRequest(conv, newParams, true);
    else
        return flights.processRequest(conv, newParams, false);
});

app.intent('fuels_intent', (conv, parameters) => {
    conv.user.storage.lastParams = parameters;
    if (parameters.fuel_type === ""){
        if (conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
            var items = fuels_utils.getFuelTypes();
            conv.ask('This is the list of fuel types Please choose one so that I can provide you the exact value of the emission.');
            conv.ask(new List({
                title: "Fuel Types List",
                items: items
            }));
            //Google home response
        } else if(!conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
            conv.ask("This is the list of fuel types please choose one so that I can provide you the exact value of the emission. 1.B20 Bio Diesel, it is a blend of 20% bio diesel and 80% petroleum diesel. 2.Bio Diesel, It is a domestically produced, renewable fuel that can be manufactured from vegetable oils, animal fats, or recycled restaurant grease for use in diesel vehicles. 3.CNG, It is a fuel which can be used in place of gasoline, diesel fuel and LPG.  4.Diesel fuel, it is a mixture of hydrocarbons obtained by distillation of crude oil. 5.E10, it is regular unleaded petrol blended with between 9% and 10% ethanol. 6.E25, it contains 25% ethanol. 7.E85, it contains high-level ethanol-gasoline blends containing 51% to 83% ethanol, depending on geography and season. 8.Ethanol fuel, it is ethyl alcohol, the same type of alcohol found in alcoholic beverages, used as fuel. 9.Gasoline, it is a colorless petroleum-derived flammable liquid that is used primarily as a fuel in spark-ignited internal combustion engines. 10.LPG, Liquefied petroleum gas is a flammable mixture of hydrocarbon gases used as fuel in heating appliances, cooking equipment, and vehicles. 11.Petrol, it is a naturally occurring, yellowish-black liquid found in geological formations beneath the Earth's surface.");
        }
    } else {
        if (!conv.user.storage.noPermission)
            return fuels.processRequest(conv, parameters, true);
        else
            return fuels.processRequest(conv, parameters, false);
    }
});

app.intent('fuels_emission_type_ask', (conv, parameters, option) => {
    conv.user.storage.lastParams.fuel_type = option;
    parameters = conv.user.storage.lastParams;
    if (parameters.emission_type == '') {
        if (conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
            conv.ask("Would you like to provide the emission type?");
            conv.ask(new Suggestions(["Yes, I'll provide", "No, thanks"]));
        } else if (!conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
            conv.ask("Would you like to provide the emission type?");
        }
    } else {
        if (!conv.user.storage.noPermission)
            return fuels.processRequest(conv, parameters, true);
        else
            return fuels.processRequest(conv, parameters, false);
    }
});

app.intent('fuels_emission_type_yes', (conv, parameters) => {
    conv.user.storage.lastParams.emission_type = parameters.emission_type;
    parameters = conv.user.storage.lastParams;
    if(parameters.quantity == ''){
        if (conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
            conv.ask("Would you like to provide the consumption quantity of the fuel?");
            conv.ask(new Suggestions(["Yes, I'll", "No, thanks"]));
        } else if (!conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
            conv.ask("Would you like to provide the consumption quantity of the fuel?");
        }
    } else {
        if (!conv.user.storage.noPermission)
            return fuels.processRequest(conv, parameters, true);
        else
            return fuels.processRequest(conv, parameters, false);
    }
});

app.intent('fuels_emission_type_no', (conv, parameters) => {
    parameters = conv.user.storage.lastParams;
    if(parameters.quantity == ''){
        if (conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
            conv.ask("Would you like to provide the consumption quantity of the fuel?");
            conv.ask(new Suggestions(["Ok. I'll", "No, that's it"]));
        } else if (!conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
            conv.ask("Would you like to provide the consumption quantity of the fuel?");
        }
    } else {
        if (!conv.user.storage.noPermission)
            return fuels.processRequest(conv, parameters, true);
        else
            return fuels.processRequest(conv, parameters, false);
    }
});

app.intent('fuels_emission_type_yes_quantity_yes', (conv, parameters) => {
    conv.user.storage.lastParams.quantity = parameters.quantity; 
    parameters = conv.user.storage.lastParams;
        if (!conv.user.storage.noPermission)
            return fuels.processRequest(conv, parameters, true);
        else
            return fuels.processRequest(conv, parameters, false);
});

app.intent('fuels_emission_type_yes_quantity_no', (conv, parameters) => {
    parameters = conv.user.storage.lastParams;
        if (!conv.user.storage.noPermission)
            return fuels.processRequest(conv, parameters, true);
        else
            return fuels.processRequest(conv, parameters, false);
});

app.intent('fuels_emission_type_no_quantity_yes', (conv, parameters) => {
    conv.user.storage.lastParams.quantity = parameters.quantity; 
    parameters = conv.user.storage.lastParams;
        if (!conv.user.storage.noPermission)
            return fuels.processRequest(conv, parameters, true);
        else
            return fuels.processRequest(conv, parameters, false);
});

app.intent('fuels_emission_type_no_quantity_no', (conv, parameters) => {
    parameters = conv.user.storage.lastParams;
        if (!conv.user.storage.noPermission)
            return fuels.processRequest(conv, parameters, true);
        else
            return fuels.processRequest(conv, parameters, false);
});

app.intent('fuels_emission_type_yes_quantity_yes-followup', (conv, parameters) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};

    if (parameters.quantity && parameters.quantity !== "")
        newParams.quantity = parameters.quantity;
    else
        newParams.quantity = contextParams.quantity;

    if (parameters.fuel_original && parameters.fuel_original !== "")
        newParams.fuel_original = parameters.fuel_original;
    else
        newParams.fuel_original = contextParams.fuel_original;

    if (parameters.emission_type && parameters.emission_type !== "")
        newParams.emission_type = parameters.emission_type;
    else
        newParams.emission_type = contextParams.emission_type;

    if (parameters.fuel_type && parameters.fuel_type !== "")
        newParams.fuel_type = parameters.fuel_type;   
    else
        newParams.fuel_type = contextParams.fuel_type;

    conv.user.storage.lastParams = newParams;
    if (!conv.user.storage.noPermission)
        return fuels.processRequest(conv, newParams, true);
    else
        return fuels.processRequest(conv, newParams, false);
});

app.intent('fuels_emission_type_yes_quantity_no-followup', (conv, parameters) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};

    if (parameters.quantity && parameters.quantity !== "")
        newParams.quantity = parameters.quantity;
    else
        newParams.quantity = contextParams.quantity;

    if (parameters.fuel_original && parameters.fuel_original !== "")
        newParams.fuel_original = parameters.fuel_original;
    else
        newParams.fuel_original = contextParams.fuel_original;

    if (parameters.emission_type && parameters.emission_type !== "")
        newParams.emission_type = parameters.emission_type;
    else
        newParams.emission_type = contextParams.emission_type;

    if (parameters.fuel_type && parameters.fuel_type !== "")
        newParams.fuel_type = parameters.fuel_type;    
    else
        newParams.fuel_type = contextParams.fuel_type;

    conv.user.storage.lastParams = newParams;
    if (!conv.user.storage.noPermission)
        return fuels.processRequest(conv, newParams, true);
    else
        return fuels.processRequest(conv, newParams, false);
});

app.intent('fuels_emission_type_no_quantity_yes-followup', (conv, parameters) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};

    if (parameters.quantity && parameters.quantity !== "")
        newParams.quantity = parameters.quantity;
    else
        newParams.quantity = contextParams.quantity;

    if (parameters.fuel_original && parameters.fuel_original !== "")
        newParams.fuel_original = parameters.fuel_original;
    else
        newParams.fuel_original = contextParams.fuel_original;

    if (parameters.emission_type && parameters.emission_type !== "")
        newParams.emission_type = parameters.emission_type;
    else
        newParams.emission_type = contextParams.emission_type;

    if (parameters.fuel_type && parameters.fuel_type !== "")
        newParams.fuel_type = parameters.fuel_type;
    else
        newParams.fuel_type = contextParams.fuel_type;

    conv.user.storage.lastParams = newParams;
    if (!conv.user.storage.noPermission)
        return fuels.processRequest(conv, newParams, true);
    else
        return fuels.processRequest(conv, newParams, false);
});

app.intent('fuels_emission_type_no_quantity_no-followup', (conv, parameters) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};

    if (parameters.quantity && parameters.quantity !== "")
        newParams.quantity = parameters.quantity;
    else
        newParams.quantity = contextParams.quantity;

    if (parameters.fuel_original && parameters.fuel_original !== "")
        newParams.fuel_original = parameters.fuel_original;
    else
        newParams.fuel_original = contextParams.fuel_original;

    if (parameters.emission_type && parameters.emission_type !== "")
        newParams.emission_type = parameters.emission_type;
    else
        newParams.emission_type = contextParams.emission_type;

    if (parameters.fuel_type && parameters.fuel_type !== "")
        newParams.fuel_type = parameters.fuel_type;
    else
        newParams.fuel_type = contextParams.fuel_type;

    conv.user.storage.lastParams = newParams;
    if (!conv.user.storage.noPermission)
        return fuels.processRequest(conv, newParams, true);
    else
        return fuels.processRequest(conv, newParams, false);
});

app.intent('fuels_intent-followup', (conv, parameters, option) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};

    if (parameters.quantity && parameters.quantity !== "")
        newParams.quantity = parameters.quantity;
    else
        newParams.quantity = contextParams.quantity;

    if (parameters.fuel_original && parameters.fuel_original !== "")
        newParams.fuel_original = parameters.fuel_original;
    else
        newParams.fuel_original = contextParams.fuel_original;

    if (parameters.emission_type && parameters.emission_type !== "")
        newParams.emission_type = parameters.emission_type;
    else
        newParams.emission_type = contextParams.emission_type;

    if (parameters.fuel_type && parameters.fuel_type !== "")
        newParams.fuel_type = parameters.fuel_type; 
    else
        newParams.fuel_type = contextParams.fuel_type;

    conv.user.storage.lastParams = newParams;
    option = '';
    if (!conv.user.storage.noPermission)
        return fuels.processRequest(conv, newParams, true);
    else
        return fuels.processRequest(conv, newParams, false);
});

app.intent('electricity_intent', (conv, parameters) => {
    conv.user.storage.lastParams = parameters;
    if(parameters.geo_country == ''){
        conv.ask("Would you like to provide the consumption country name?");
        conv.ask(new Suggestions(["Yes, I'll provide", "No, thanks"]));
    } else {
        if (!conv.user.storage.noPermission)
            return electricity.processRequest(conv, parameters, true);
        else
            return electricity.processRequest(conv, parameters, false);
    }
});

app.intent('electricity_intent_region_yes', (conv, parameters) => {
    conv.user.storage.lastParams.geo_country = parameters.geo_country;
    parameters = conv.user.storage.lastParams;
    if(parameters.quantity == ''){
        conv.ask("Would you like to provide the consumption quantity or the unit?");
        conv.ask(new Suggestions(["Yes", "No, thanks"]));
    } else {
        if (!conv.user.storage.noPermission)
            return electricity.processRequest(conv, parameters, true);
        else
            return electricity.processRequest(conv, parameters, false);
    }
});

app.intent('electricity_intent_region_no', (conv, parameters) => {
    parameters = conv.user.storage.lastParams;
    if(parameters.quantity == ''){
        conv.ask("Would you like to provide the consumption quantity or the unit?");
        conv.ask(new Suggestions(["Ok. I'll", "No, that's it"]));
    } else {
        if (!conv.user.storage.noPermission)
            return electricity.processRequest(conv, parameters, true);
        else
            return electricity.processRequest(conv, parameters, false);
    }
});

app.intent('electricity_region_yes_quantity_yes', (conv, parameters) => {
    conv.user.storage.lastParams.quantity = parameters.quantity; 
    parameters = conv.user.storage.lastParams;
    if (!conv.user.storage.noPermission)
        return electricity.processRequest(conv, parameters, true);
    else
        return electricity.processRequest(conv, parameters, false);
});

app.intent('electricity_region_yes_quantity_no', (conv, parameters) => {
    parameters = conv.user.storage.lastParams;
    if (!conv.user.storage.noPermission)
        return electricity.processRequest(conv, parameters, true);
    else
        return electricity.processRequest(conv, parameters, false);
});

app.intent('electricity_region_no_quantity_yes', (conv, parameters) => {
    conv.user.storage.lastParams.quantity = parameters.quantity; 
    parameters = conv.user.storage.lastParams;
    if (!conv.user.storage.noPermission)
        return electricity.processRequest(conv, parameters, true);
    else
        return electricity.processRequest(conv, parameters, false);
});

app.intent('electricity_region_no_quantity_no', (conv, parameters) => {
    parameters = conv.user.storage.lastParams;
    if (!conv.user.storage.noPermission)
        return electricity.processRequest(conv, parameters, true);
    else
        return electricity.processRequest(conv, parameters, false);
});

app.intent('electricity_region_yes_quantity_yes_followup', (conv, parameters) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};

    if (parameters.quantity && parameters.quantity !== "")
        newParams.quantity = parameters.quantity;
    else
        newParams.quantity = contextParams.quantity;

    if (parameters.geo_country && parameters.geo_country !== "")
        newParams.geo_country = parameters.geo_country;
    else
        newParams.geo_country = contextParams.geo_country;

    if (parameters.emission_type && parameters.emission_type !== "")
        newParams.emission_type = parameters.emission_type;
    else
        newParams.emission_type = contextParams.emission_type;

    conv.user.storage.lastParams = newParams;
    if (!conv.user.storage.noPermission)
        return electricity.processRequest(conv, newParams, true);
    else
        return electricity.processRequest(conv, newParams, false);
});

app.intent('electricity_region_yes_quantity_no_followup', (conv, parameters) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};

    if (parameters.quantity && parameters.quantity !== "")
        newParams.quantity = parameters.quantity;
    else
        newParams.quantity = contextParams.quantity;

    if (parameters.geo_country && parameters.geo_country !== "")
        newParams.geo_country = parameters.geo_country;
    else
        newParams.geo_country = contextParams.geo_country;
    
    if (parameters.emission_type && parameters.emission_type !== "")
        newParams.emission_type = parameters.emission_type;
    else
        newParams.emission_type = contextParams.emission_type;

    conv.user.storage.lastParams = newParams;
    if (!conv.user.storage.noPermission)
        return electricity.processRequest(conv, newParams, true);
    else
        return electricity.processRequest(conv, newParams, false);
});

app.intent('electricity_region_no_quantity_yes_followup', (conv, parameters) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};

    if (parameters.quantity && parameters.quantity !== "")
        newParams.quantity = parameters.quantity;
    else
        newParams.quantity = contextParams.quantity;

    if (parameters.geo_country && parameters.geo_country !== "")
        newParams.geo_country = parameters.geo_country;
    else
        newParams.geo_country = contextParams.geo_country;
    
    if (parameters.emission_type && parameters.emission_type !== "")
        newParams.emission_type = parameters.emission_type;
    else
        newParams.emission_type = contextParams.emission_type;

    conv.user.storage.lastParams = newParams;
    if (!conv.user.storage.noPermission)
        return electricity.processRequest(conv, newParams, true);
    else
        return electricity.processRequest(conv, newParams, false);
});

app.intent('electricity_region_no_quantity_no_followup', (conv, parameters) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};

    if (parameters.quantity && parameters.quantity !== "")
        newParams.quantity = parameters.quantity;
    else
        newParams.quantity = contextParams.quantity;

    if (parameters.geo_country && parameters.geo_country !== "")
        newParams.geo_country = parameters.geo_country;
    else
        newParams.geo_country = contextParams.geo_country;
    
    if (parameters.emission_type && parameters.emission_type !== "")
        newParams.emission_type = parameters.emission_type;
    else
        newParams.emission_type = contextParams.emission_type;

    conv.user.storage.lastParams = newParams;
    if (!conv.user.storage.noPermission)
        return electricity.processRequest(conv, newParams, true);
    else
        return electricity.processRequest(conv, newParams, false);
});

app.intent('appliance_intent', (conv, parameters) => {
    conv.user.storage.lastParams = parameters;
    if (parameters.appliance == '') {
        if (conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
            var items = appliances_utils.getApplianceList();
            conv.ask('This is the list of Appliance names Please choose one So, that I can provide you the exact value of the emission.');
            conv.ask(new List({
                title: "Appliances List",
                items: items
            }));
        }
    } else {
        if (!conv.user.storage.noPermission)
            return appliances.processRequest(conv, parameters, true);
        else
            return appliances.processRequest(conv, parameters, false);
    }
});

app.intent('appliance_duration_ask', (conv, parameters, option) => {
    conv.user.storage.lastParams.appliance = option;
    parameters = conv.user.storage.lastParams;
    if (parameters.duration == '') {
        conv.ask("Would you like to provide the duration or the number of hours the appliance is being used?");
        conv.ask(new Suggestions(["Yes, I'll provide", "No, thanks"]));
    } else {
        if (!conv.user.storage.noPermission)
            return appliances.processRequest(conv, parameters, true);
        else
            return appliances.processRequest(conv, parameters, false);
    }
});

app.intent('appliance_duration_yes', (conv, parameters) => {
    conv.user.storage.lastParams.duration = parameters.duration;
    parameters = conv.user.storage.lastParams;
    if(parameters.quantity == ''){
        conv.ask("Would you like to provide the quantity or number of the appliance being used?");
        conv.ask(new Suggestions(["Yes", "No, thanks"]));
    } else {
        if (!conv.user.storage.noPermission)
            return appliances.processRequest(conv, parameters, true);
        else
            return appliances.processRequest(conv, parameters, false);
    }
});

app.intent('appliance_duration_no', (conv, parameters) => {
    parameters = conv.user.storage.lastParams;
    if(parameters.quantity == ''){
        conv.ask("Would you like to provide the quantity or number of the appliance being used?");
        conv.ask(new Suggestions(["Ok. I'll", "No, that's it"]));
    } else {
        if (!conv.user.storage.noPermission)
            return appliances.processRequest(conv, parameters, true);
        else
            return appliances.processRequest(conv, parameters, false);
    }
});

app.intent('appliance_duration_yes_quantity_yes', (conv, parameters) => {
    conv.user.storage.lastParams.quantity = parameters.quantity; 
    parameters = conv.user.storage.lastParams;
    if (!conv.user.storage.noPermission)
        return appliances.processRequest(conv, parameters, true);
    else
        return appliances.processRequest(conv, parameters, false);
});

app.intent('appliance_duration_yes_quantity_no', (conv, parameters) => {
    parameters = conv.user.storage.lastParams;
    if (!conv.user.storage.noPermission)
        return appliances.processRequest(conv, parameters, true);
    else
        return appliances.processRequest(conv, parameters, false);
});

app.intent('appliance_duration_no_quantity_yes', (conv, parameters) => {
    conv.user.storage.lastParams.quantity = parameters.quantity; 
    parameters = conv.user.storage.lastParams;
    if (!conv.user.storage.noPermission)
        return appliances.processRequest(conv, parameters, true);
    else
        return appliances.processRequest(conv, parameters, false);
});

app.intent('appliance_duration_no_quantity_no', (conv, parameters) => {
    parameters = conv.user.storage.lastParams;
    if (!conv.user.storage.noPermission)
        return appliances.processRequest(conv, parameters, true);
    else    
        return appliances.processRequest(conv, parameters, false);
});

app.intent('appliance_duration_yes_quantity_yes-followup', (conv, parameters, option) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};

    if (parameters.type && parameters.type !== "")
        newParams.type = parameters.type;
    else
        newParams.type = contextParams.type;

    if (parameters.appliance && parameters.appliance !== "")
        newParams.appliance = parameters.appliance;
    else if(option && contextParams.appliance == "")
        newParams.appliance = option;
    else
        newParams.appliance = contextParams.appliance;

    if (parameters.geo_country && parameters.geo_country !== "")
        newParams.geo_country = parameters.geo_country;
    else
        newParams.geo_country = contextParams.geo_country;

    if (parameters.emission_type && parameters.emission_type !== "")
        newParams.emission_type = parameters.emission_type;
    else
        newParams.emission_type = contextParams.emission_type;

    if (parameters.duration && parameters.duration !== "")
        newParams.duration = parameters.duration;
    else
        newParams.duration = contextParams.duration;

    if (parameters.size && parameters.size !== "")
        newParams.size = parameters.size;
    else
        newParams.size = contextParams.size;

    if (parameters.quantity && parameters.quantity !== "")
        newParams.quantity = parameters.quantity;
    else
        newParams.quantity = contextParams.quantity;

    conv.user.storage.lastParams = newParams;

    if (!conv.user.storage.noPermission)
        return appliances.processRequest(conv, newParams, true);
    else
        return appliances.processRequest(conv, newParams, false);
});

app.intent('appliance_duration_yes_quantity_no-followup', (conv, parameters, option) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};

    if (parameters.type && parameters.type !== "")
        newParams.type = parameters.type;
    else
        newParams.type = contextParams.type;

    if (parameters.appliance && parameters.appliance !== "")
        newParams.appliance = parameters.appliance;
    else if(option && contextParams.appliance == "")
        newParams.appliance = option;
    else
        newParams.appliance = contextParams.appliance;

    if (parameters.geo_country && parameters.geo_country !== "")
        newParams.geo_country = parameters.geo_country;
    else
        newParams.geo_country = contextParams.geo_country;

    if (parameters.emission_type && parameters.emission_type !== "")
        newParams.emission_type = parameters.emission_type;
    else
        newParams.emission_type = contextParams.emission_type;

    if (parameters.duration && parameters.duration !== "")
        newParams.duration = parameters.duration;
    else
        newParams.duration = contextParams.duration;

    if (parameters.size && parameters.size !== "")
        newParams.size = parameters.size;
    else
        newParams.size = contextParams.size;

    if (parameters.quantity && parameters.quantity !== "")
        newParams.quantity = parameters.quantity;
    else
        newParams.quantity = contextParams.quantity;

    conv.user.storage.lastParams = newParams;

    if (!conv.user.storage.noPermission)
        return appliances.processRequest(conv, newParams, true);
    else
        return appliances.processRequest(conv, newParams, false);
});

app.intent('appliance_duration_no_quantity_yes-followup', (conv, parameters, option) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};

    if (parameters.type && parameters.type !== "")
        newParams.type = parameters.type;
    else
        newParams.type = contextParams.type;

    if (parameters.appliance && parameters.appliance !== "")
        newParams.appliance = parameters.appliance;
    else if(option && contextParams.appliance == "")
        newParams.appliance = option;
    else
        newParams.appliance = contextParams.appliance;

    if (parameters.geo_country && parameters.geo_country !== "")
        newParams.geo_country = parameters.geo_country;
    else
        newParams.geo_country = contextParams.geo_country;

    if (parameters.emission_type && parameters.emission_type !== "")
        newParams.emission_type = parameters.emission_type;
    else
        newParams.emission_type = contextParams.emission_type;

    if (parameters.duration && parameters.duration !== "")
        newParams.duration = parameters.duration;
    else
        newParams.duration = contextParams.duration;

    if (parameters.size && parameters.size !== "")
        newParams.size = parameters.size;
    else
        newParams.size = contextParams.size;

    if (parameters.quantity && parameters.quantity !== "")
        newParams.quantity = parameters.quantity;
    else
        newParams.quantity = contextParams.quantity;

    conv.user.storage.lastParams = newParams;

    if (!conv.user.storage.noPermission)
        return appliances.processRequest(conv, newParams, true);
    else
        return appliances.processRequest(conv, newParams, false);
});

app.intent('appliance_duration_no_quantity_no-followup', (conv, parameters, option) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};
    
    if (parameters.type && parameters.type !== "")
        newParams.type = parameters.type;
    else
        newParams.type = contextParams.type;
    
    if (parameters.appliance && parameters.appliance !== "")
        newParams.appliance = parameters.appliance;
    else if(option && contextParams.appliance == "")
        newParams.appliance = option;
    else
        newParams.appliance = contextParams.appliance;
    
    if (parameters.geo_country && parameters.geo_country !== "")
        newParams.geo_country = parameters.geo_country;
    else
        newParams.geo_country = contextParams.geo_country;
    
    if (parameters.emission_type && parameters.emission_type !== "")
        newParams.emission_type = parameters.emission_type;
    else
        newParams.emission_type = contextParams.emission_type;
    
    if (parameters.duration && parameters.duration !== "")
        newParams.duration = parameters.duration;
    else
        newParams.duration = contextParams.duration;
    
    if (parameters.size && parameters.size !== "")
        newParams.size = parameters.size;
    else
        newParams.size = contextParams.size;
    
    if (parameters.quantity && parameters.quantity !== "")
        newParams.quantity = parameters.quantity;
    else
        newParams.quantity = contextParams.quantity;
    
    conv.user.storage.lastParams = newParams;
    
    if (!conv.user.storage.noPermission)
        return appliances.processRequest(conv, newParams, true);
    else
        return appliances.processRequest(conv, newParams, false); 
});


app.intent('appliance_intent-followup', (conv, parameters) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};

    if (parameters.type && parameters.type !== "")
        newParams.type = parameters.type;
    else
        newParams.type = contextParams.type;

    if (parameters.appliance && parameters.appliance !== "")
        newParams.appliance = parameters.appliance;
    else
        newParams.appliance = contextParams.appliance;

    if (parameters.geo_country && parameters.geo_country !== "")
        newParams.geo_country = parameters.geo_country;
    else
        newParams.geo_country = contextParams.geo_country;

    if (parameters.emission_type && parameters.emission_type !== "")
        newParams.emission_type = parameters.emission_type;
    else
        newParams.emission_type = contextParams.emission_type;

    if (parameters.duration && parameters.duration !== "")
        newParams.duration = parameters.duration;
    else
        newParams.duration = contextParams.duration;

    if (parameters.size && parameters.size !== "")
        newParams.size = parameters.size;
    else
        newParams.size = contextParams.size;

    if (parameters.quantity && parameters.quantity !== "")
        newParams.quantity = parameters.quantity;
    else
        newParams.quantity = contextParams.quantity;

    conv.user.storage.lastParams = newParams;

    if (!conv.user.storage.noPermission)
        return appliances.processRequest(conv, newParams, true);
    else
        return appliances.processRequest(conv, newParams, false);
});

app.intent('poultry_intent', (conv, parameters) => {
    if (parameters.poultry_type === ""){
        if (conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
            var items = poultry_utils.getPoultryTypes();
            conv.ask('This is the list of poultry types please choose one so that I can provide you the exact value of the emission.');
            conv.ask(new List({
                title: "Poultry Types List",
                items: items
            }));
        } else if(!conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
            conv.ask('This is the list of poultry types please choose one so that I can provide you the exact value of the emission. 1.Beef cow farming, beef poultry farms are the farms where cows are raised for beef production. 2.Broiler chicken farming, it is a poultry farm where a broiler chicken is bred and raised specifically for meat production. 3.Layer poultry farming, it is the raising of egg laying poultry birds for the purpose of commercial egg production. 4.Lamp farming, it is the raising and breeding of domestic sheep. 5.Pig farming, it is the raising and breeding of domestic pigs as livestock. 6.Turkey farming, It is the raising and breeding of Turkey commercially for meat and egg production.');
        }
        conv.user.storage.lastParams = parameters;
    } else {
        conv.user.storage.lastParams = parameters;
        if (!conv.user.storage.noPermission)
            return poultry.processRequest(conv, parameters, true);
        else
            return poultry.processRequest(conv, parameters, false);
    } 
});

app.intent('poultry_region_ask', (conv, parameters,option) => {
    conv.user.storage.lastParams.poultry_type = option;
    parameters = conv.user.storage.lastParams;
    if(parameters.poultry_region == ''){
        if (conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
            conv.ask("Would you like to provide the region name for the poultry farm?");
            conv.ask(new Suggestions(["Yes, I'll provide", "No, thanks"]));
        } else if(!conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
            conv.ask("Would you like to provide the region name for the poultry farm?");
        }
    } else {
        if (!conv.user.storage.noPermission)
            return poultry.processRequest(conv, parameters, true);
        else
            return poultry.processRequest(conv, parameters, false);
    }
});

app.intent('poultry_region_yes', (conv, parameters) => {
    if (conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
        var items = poultry_utils.getPoultryRegions();
        conv.ask('This is the list of poultry farm regions please choose one So, that I can provide you the exact value of the emission.');
        conv.ask(new List({
            title: "Poultry Region List",
            items: items
        }));
    } else if(!conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
        conv.ask('This is the list of poultry farm regions please choose one so that I can provide you the exact value of the emission. 1.British Columbia. 2.Idaho. 3.Iowa. 4.Michigan. 5.Nebraska. 6.New Jersey. 7.Ohio. 8.Pennsylvania.');
    }
    parameters = conv.user.storage.lastParams;
});

app.intent('poultry_region_yes_quantity_ask', (conv, parameters, option) => {
    conv.user.storage.lastParams.poultry_region = option;
    parameters = conv.user.storage.lastParams;
    if(parameters.poultry_quantity == ''){
        if (conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
            conv.ask("Would you like to provide the production quantity?");
            conv.ask(new Suggestions(["Yes, I'll", "No, thanks"]));
        } else if(!conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
            conv.ask("Would you like to provide the production quantity?");
        }
    } else {
        if (!conv.user.storage.noPermission)
            return fuels.processRequest(conv, parameters, true);
        else
            return fuels.processRequest(conv, parameters, false);
    }
});

app.intent('poultry_region_no', (conv, parameters) => {
    parameters = conv.user.storage.lastParams;
    if(parameters.poultry_quantity == ''){
        if (conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
            conv.ask("Would you like to provide the production quantity?");
            conv.ask(new Suggestions(["Ok. I'll", "No, that's it"]));
        } else if(!conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
            conv.ask("Would you like to provide the production quantity?");
        }
    } else {
        if (!conv.user.storage.noPermission)
            return poultry.processRequest(conv, parameters, true);
        else
            return poultry.processRequest(conv, parameters, false);
    }
});

app.intent('poultry_region_yes_quantity_yes', (conv, parameters) => {
    conv.user.storage.lastParams.poultry_quantity = parameters.poultry_quantity; 
    parameters = conv.user.storage.lastParams;
    if (!conv.user.storage.noPermission)
        return poultry.processRequest(conv, parameters, true);
    else
        return poultry.processRequest(conv, parameters, false);

});

app.intent('poultry_region_yes_quantity_no', (conv, parameters) => {
    parameters = conv.user.storage.lastParams;
    if (!conv.user.storage.noPermission)
        return poultry.processRequest(conv, parameters, true);
    else
        return poultry.processRequest(conv, parameters, false);
});

app.intent('poultry_region_no_quantity_yes', (conv, parameters) => {
    conv.user.storage.lastParams.poultry_quantity = parameters.poultry_quantity; 
    parameters = conv.user.storage.lastParams;
    if (!conv.user.storage.noPermission)
        return poultry.processRequest(conv, parameters, true);
    else
        return poultry.processRequest(conv, parameters, false);
});

app.intent('poultry_region_no_quantity_no', (conv, parameters) => {
    parameters = conv.user.storage.lastParams;
    if (!conv.user.storage.noPermission)
        return poultry.processRequest(conv, parameters, true);
    else
        return poultry.processRequest(conv, parameters, false);
});


app.intent('poultry_intent-followup', (conv, parameters) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};

    if (parameters.poultry_type && parameters.poultry_type !== "")
        newParams.poultry_type = parameters.poultry_type;
    else
        newParams.poultry_type = contextParams.poultry_type;

    if (parameters.poultry_region && parameters.poultry_region !== "")
        newParams.poultry_region = parameters.poultry_region;
    else
        newParams.poultry_region = contextParams.poultry_region;

    if (parameters.poultry_quantity && parameters.poultry_quantity !== "")
        newParams.poultry_quantity = parameters.poultry_quantity;
    else
        newParams.poultry_quantity = contextParams.poultry_quantity;

    conv.user.storage.lastParams = newParams;

    if (!conv.user.storage.noPermission)
        return poultry.processRequest(conv, newParams, true);
    else
        return poultry.processRequest(conv, newParams, false);
    
});

app.intent('poultry_region_yes_quantity_yes-followup', (conv, parameters) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};

    if (parameters.poultry_type && parameters.poultry_type !== "")
        newParams.poultry_type = parameters.poultry_type;
    else
        newParams.poultry_type = contextParams.poultry_type;

    if (parameters.poultry_region && parameters.poultry_region !== "")
        newParams.poultry_region = parameters.poultry_region;
    else
        newParams.poultry_region = contextParams.poultry_region;

    if (parameters.poultry_quantity && parameters.poultry_quantity !== "")
        newParams.poultry_quantity = parameters.poultry_quantity;
    else
        newParams.poultry_quantity = contextParams.poultry_quantity;

    conv.user.storage.lastParams = newParams;

    if (!conv.user.storage.noPermission)
        return poultry.processRequest(conv, newParams, true);
    else
        return poultry.processRequest(conv, newParams, false);
    
});

app.intent('poultry_region_yes_quantity_no-followup', (conv, parameters) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};

    if (parameters.poultry_type && parameters.poultry_type !== "")
        newParams.poultry_type = parameters.poultry_type;
    else
        newParams.poultry_type = contextParams.poultry_type;

    if (parameters.poultry_region && parameters.poultry_region !== "")
        newParams.poultry_region = parameters.poultry_region;
    else
        newParams.poultry_region = contextParams.poultry_region;

    if (parameters.poultry_quantity && parameters.poultry_quantity !== "")
        newParams.poultry_quantity = parameters.poultry_quantity;
    else
        newParams.poultry_quantity = contextParams.poultry_quantity;

    conv.user.storage.lastParams = newParams;

    if (!conv.user.storage.noPermission)
        return poultry.processRequest(conv, newParams, true);
    else
        return poultry.processRequest(conv, newParams, false);
    
});

app.intent('poultry_region_no_quantity_yes-followup', (conv, parameters) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};

    if (parameters.poultry_type && parameters.poultry_type !== "")
        newParams.poultry_type = parameters.poultry_type;
    else
        newParams.poultry_type = contextParams.poultry_type;

    if (parameters.poultry_region && parameters.poultry_region !== "")
        newParams.poultry_region = parameters.poultry_region;
    else
        newParams.poultry_region = contextParams.poultry_region;

    if (parameters.poultry_quantity && parameters.poultry_quantity !== "")
        newParams.poultry_quantity = parameters.poultry_quantity;
    else
        newParams.poultry_quantity = contextParams.poultry_quantity;

    conv.user.storage.lastParams = newParams;

    if (!conv.user.storage.noPermission)
        return poultry.processRequest(conv, newParams, true);
    else
        return poultry.processRequest(conv, newParams, false);
    
});

app.intent('poultry_region_no_quantity_no-followup', (conv, parameters) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};

    if (parameters.poultry_type && parameters.poultry_type !== "")
        newParams.poultry_type = parameters.poultry_type;
    else
        newParams.poultry_type = contextParams.poultry_type;

    if (parameters.poultry_region && parameters.poultry_region !== "")
        newParams.poultry_region = parameters.poultry_region;
    else
        newParams.poultry_region = contextParams.poultry_region;

    if (parameters.poultry_quantity && parameters.poultry_quantity !== "")
        newParams.poultry_quantity = parameters.poultry_quantity;
    else
        newParams.poultry_quantity = contextParams.poultry_quantity;

    conv.user.storage.lastParams = newParams;

    if (!conv.user.storage.noPermission)
        return poultry.processRequest(conv, newParams, true);
    else
        return poultry.processRequest(conv, newParams, false);
});


app.intent('land_intent', (conv, parameters, option) => {
    if (parameters.land_type === "") {
        if (conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
            var items = land_utils.getLandTypes();
            conv.ask('This is the list of land types Please choose one So, that I can provide you the exact value of the emission.');
            conv.ask(new List({
                title: "Land Types List",
                items: items
            }));
        }
        conv.user.storage.lastParams = parameters;
    } else {
        if (!conv.user.storage.noPermission)
            return land.processRequest(conv, parameters, true);
        else
            return land.processRequest(conv, parameters, false);
    }
});

app.intent('land_intent_followup', (conv, parameters, option) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};
    if (parameters.land_region && parameters.land_region !== "")
        newParams.land_region = parameters.land_region;
    else
        newParams.land_region = contextParams.land_region;

    if (parameters.land_type && parameters.land_type !== "")
        newParams.land_type = parameters.land_type;
    else if (option && contextParams.land_type == "")
        newParams.land_type = option;
    else
        newParams.land_type = contextParams.land_type;
    conv.user.storage.lastParams = newParams;
    option = '';
    if (!conv.user.storage.noPermission)
        return land.processRequest(conv, newParams, true);
    else
        return land.processRequest(conv, newParams, false);
});

app.intent('food_intent', (conv, parameters, option) => {
    if (parameters.food_type === "") {
        if (conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
            var items = food_utils.getFoodTypes();
            conv.ask('This is the list of food types Please choose one So, that I can provide you the exact value of the emission.');
            conv.ask(new List({
                title: "Food Types List",
                items: items
            }));
        }
        conv.user.storage.lastParams = parameters;
    } else {
        if (!conv.user.storage.noPermission)
            return food.processRequest(conv, parameters, true);
        else
            return food.processRequest(conv, parameters, false);
    }
});

app.intent('food_intent_followup', (conv, parameters, option) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};

    if (parameters.food_region && parameters.food_region !== "")
        newParams.food_region = parameters.food_region;
    else
        newParams.food_region = contextParams.food_region;

    if (parameters.food_type && parameters.food_type !== "")
        newParams.food_type = parameters.food_type;
    else if (option && contextParams.food_type == "")
        newParams.food_type = option;
    else
        newParams.food_type = contextParams.food_type;

    conv.user.storage.lastParams = newParams;
    option = '';
    if (!conv.user.storage.noPermission)
        return food.processRequest(conv, newParams, true);
    else
        return food.processRequest(conv, newParams, false);
});

app.intent('sector_intent', (conv, parameters, option) => {
    conv.user.storage.lastParams = parameters;
    if (parameters.sector_type === ""){
        if (conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
            var items = sector_utils.getSectorTypes();
            conv.ask('This is the list of sector types Please choose one So, that I can provide you the exact value of the emission.');
            conv.ask(new List({
                title: "Sector Types List",
                items: items
            }));
        }
        conv.user.storage.lastParams = parameters;
    } else {
        if (!conv.user.storage.noPermission)
            return sector.processRequest(conv, parameters, true);
        else
            return sector.processRequest(conv, parameters, false);
    }
});

app.intent('sector_intent_followup',(conv,parameters,option) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};
    if (parameters.sector_region && parameters.sector_region !== "")
        newParams.sector_region = parameters.sector_region;
    else
        newParams.sector_region = contextParams.sector_region;

    if (parameters.sector_type && parameters.sector_type !== "")
        newParams.sector_type = parameters.sector_type;
    else if(option && contextParams.sector_type == "")
        newParams.sector_type = option;
    else
        newParams.sector_type = contextParams.sector_type;
    option = '';
    conv.user.storage.lastParams = newParams;
    if (!conv.user.storage.noPermission)
        return sector.processRequest(conv, newParams, true);
    else
        return sector.processRequest(conv, newParams, false);
});

app.intent('agriculture_intent', (conv, parameters, option) => {
    if (parameters.agriculture_type === ""){
        if (conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
            var items = agriculture_utils.getAgricultureTypes();
            conv.ask('This is the list of agriculture types Please choose one So, that I can provide you the exact value of the emission.');
            conv.ask(new List({
                title: "Agriculture Types List",
                items: items
            }));
        } else if(!conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
            conv.ask(`This is the list of agriculture types please choose one so that I can provide you the exact value of the emission. 1.Enteric fermentation, It is a digestive process by which carbohydrates are broken down by microorganisms into simple molecules for absorption into the bloodstream of an animal. 2.Manure management, it refers to capture, storage, treatment, and utilization of animal manures. 3.Rice cultivation, it is one of the largest source of the potent greenhouse gas methane. 4.Synthetic fertilizers, these are the man-made combinations of chemicals and inorganic substances. 5.Cultivation of organic soils. Organic soil is a complex combination of decomposed organic matter, minerals and beneficial microorganisms. 6.Crop residues, these are the materials left in an agricultural field or orchard after the crop has been harvested. 7.Manure left on pasture. Emissions from manure left on pastures consist of direct and indirect nitrous oxide emissions from manure nitrogen left on pastures. 8.Manure applied to soils, it speeds up decomposition, and lowers the soil's acidity level, less than chemical fertilizers. 9.Burning crop residues, crop residue is burnt 'on-farm' primarily to clean the field for sowing the next crop. 10.Burning Savanna, tropical savanna fires make a significant contribution to the nation's accountable greenhouse gas emissions.`);
        }
        conv.user.storage.lastParams = parameters;
    } else {
        if (!conv.user.storage.noPermission)
            return agriculture.processRequest(conv, parameters, true);
        else
            return agriculture.processRequest(conv, parameters, false);
    }
});

app.intent('agriculture_intent_followup',(conv,parameters,option) => {
    let contextParams = conv.user.storage.lastParams;
    let newParams = {};
    if (parameters.agriculture_region && parameters.agriculture_region !== "")
        newParams.agriculture_region = parameters.agriculture_region;
    else
        newParams.agriculture_region = contextParams.agriculture_region;

    if (parameters.agriculture_type && parameters.agriculture_type !== "")
        newParams.agriculture_type = parameters.agriculture_type;
    else if(option && contextParams.agriculture_type == "")
        newParams.agriculture_type = option;
    else
        newParams.agriculture_type = contextParams.agriculture_type;
    conv.user.storage.lastParams = newParams;
    option = '';
    if (!conv.user.storage.noPermission)
        return agriculture.processRequest(conv, newParams, true);
    else
        return agriculture.processRequest(conv, newParams, false);
});

// The default fallback intent has been matched, try to recover (https://dialogflow.com/docs/intents#fallback_intents)
app.intent('Default Fallback Intent', (conv) => {
    // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
    sendGoogleResponse(conv, `I'm having trouble, can you try that again?`);
});

// Function to send correctly formatted Google Assistant responses to Dialogflow which are then sent to the user
function sendGoogleResponse(conv, responseToUser) {
    conv.ask(responseToUser); // Google Assistant response
}

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);