<img src="https://i.imgur.com/MXb1jv6.png" align="center" width="500" height="100"/>

# GSoC 2019 Work Product - Siwani Agrawal

**Student** : [Siwani Agrawal](https://gitlab.com/siwaniagrawal)

**Organisation** : [AOSSIE](http://aossie.org/)

**Project Repository** : [CarbonAssistant - Function](https://gitlab.com/aossie/CarbonAssistant-Function)

## About the Project 

*CarbonAssistant-Function is a Google Assistant Action. The project aims to empower the CarbonFootprint-API by facilitating conversational access to its plethora of features. The aim is to raise awareness about the various ways in which carbon emissions are generated in our day-to-day lives and alert millions of people around the world in a more engaging and interactive way. This action project will enable people to keep a check on their carbon footprint by providing access to the emission-related information through voice on practically any device that may run Google Assistant and hence will further motivate them to control it.*

I have identified the following tasks in the project at the starting of the project.
1. A comparative emission results for flights section - **Done**
2. Improving the error handling while making post requests to API - **Done** 
3. A support for wizard-like experience for users - **Done** 
4. Adding buttons linking to visualizations in the emission response basic cards - **Done** 
5. A guidance system to help users to reduce the Carbon FootPrint  - **Done** 
6. Incorporating Daily Updates feature in the guidance system  - **Done** 
7. Adding unit-testing for all the intents and categories - **Done** 
8. Adding automated testing to use gitlab pipelines to run tests - **Done** 


## Work Details

 Our aim was to increase the standards, scope, features and versatility of the existing Google Assistant Action. The project was evenly divided into three phases. In the first phase, a user-friendly conversational support for all the categories like, appliances, trains, flights, vehicles, electricity, fuels, land, food, agriculture, sectors, and poultry was added. I have added support for a wizard-like experience for the user to make this platform more convenient and user-friendly. Followup intents linking all the parameters were added. A menu support was added to provide a [list](https://developers.google.com/actions/assistant/responses#list) of categories that we support. Suggestion chips, followup intents, rich-response lists, slot-filing feature, event triggering of intents and basic cards with buttons linking to [visualizations](https://carbonhub.org/) were added to enhance the user-experience and to provide the user with a piece of more varied and detailed information. 
 The ReverseLookup support for trees, vehicles, and trains are already present. A ReverseLookup support for flights has been added in the [CarbonFootprint-API](https://gitlab.com/aossie/CarbonFootprint-API). First, a number of airports, nearest to the current location of the user, is being found out, then the nearest airport is being assigned as the “source” airport for further calculations. An array containing some of the most famous airports is being used. This array is being linearly parsed to check if the source airport is connected to one or more famous airports. If it is indeed connected, all the valid pairs are being considered as possible “source-destination” pairs. The distance between all such source-destination pairs, is being calculated. For all the source-destination pairs, data such as emission per passenger and subsequently the number of passengers for a standard plane type corresponding to the total emission given is being found out. Then randomly, one of the source-destination pairs along with all the other parameters learned is being picked and sent as the ReverseLookup comparative emission result in terms of a flight going from a source airport to a destination airport carrying a certain number of passengers that will give out the same amount of emissions.

During the second phase, a support was build, strictly following Google’s design guidelines, to educate the users about the various methods by which one can reduce the amount of carbon emissions that one produces. When the user asks for the various ways in which one can reduce carbon emissions, a list of categories like, `Food and Composting`, `NGO`, `Tree`, `Transportation`, `Air Travel`, `Clothes and Shopping`, and `Home Appliances` is displayed on a BasicCard for output-screen displays and a monologue is sent as the response for google-home. If the user then queries about a specific category, detailed information, regarding the various methods involved to reduce carbon emissions under that particular category is provided in the format of a BasicCard and [button with links](https://cotap.org/reduce-carbon-emissions/) for output-screen displays and in the form of monologue for google home. In addition to this, daily updates has been incorporated for a more intimate interaction with the users. With [daily updates](https://developers.google.com/actions/assistant/updates/daily) users will receive daily notifications about a particular emission reduction category or method of their liking at the time they want. The detailed information about guidance support was added in the help intent and the menu intent.  

In the final phase, unit tests for the google actions project using [Bespoken](https://read.bespoken.io/unit-testing/guide-google/) has been implemented. The unit testing makes sure the voice app code is working correctly. Unit test scripts have been written to verify each intent and each major piece of functionality. The tests cover all the major functions used across the Web application and makes use of gitlab pipelines to run the tests. The syntax is based on [YAML](https://yaml.org/) and is meant to be easy to read and write. The tests are actually run with a specialized version of [Jest](https://jestjs.io/). Again, error handling has been improved and the action now fails gracefully with a proper error response. The test scripts cover basic-card response, lists, suggestion-chips, daily updates, and all the intents and followups. The test scripts run using [bespoken’s Virtual Google Assistant](https://github.com/bespoken/virtual-google-assistant) component to generate JSON requests and emulate Google Assistant behavior

I would like to thank every AOSSIE member, especially my mentors, for being so nice and helpful. I have learnt a lot in the past 3 months and it has been a great experience to be a part of this wonderful community.


## Merge Requests

1. [Merge Request !50](https://gitlab.com/aossie/CarbonAssistant-Function/merge_requests/50) - Wizard-Support for Land related emission queries
    *  Adds the menu support which gives a list of categories for the user to choose one.
    *  Adds slot filling feature for `Region`
    *  Adds a list of `Land Types`
    *  Adds both comparative and number based response along with context-management       support.

2. [Merge Request !51](https://gitlab.com/aossie/CarbonAssistant-Function/merge_requests/51) - Wizard support for Food related emission queries
    *  Menu support added for `Food`
    * Adds slot filling feature for `Region`
    * Adds a list of `Food Types`
    * Adds both comparative and number based response along with context-management support.

3. [Merge Request !52](https://gitlab.com/aossie/CarbonAssistant-Function/merge_requests/52) -  Wizard support for Sector related emission queries
    * Adds the menu support which gives a list of categories for the user to choose one.
    * Adds slot filling feature for `Region`
    * Adds a list of `Sector Types`
    * Adds both comparative and number based response along with context-management support.

4. [Merge Request !53](https://gitlab.com/aossie/CarbonAssistant-Function/merge_requests/53) -  Wizard support for Agriculture related emission queries
    * Adds menu support for `Agriculture`
    * Adds slot filling feature for `Region`
    * Adds a list of `Agriculture Types`
    * Adds both comparative and number based response along with context-management support.

5. [Merge Request !54](https://gitlab.com/aossie/CarbonAssistant-Function/merge_requests/54) -  Script updated to remove the required parameters
    * Removes updated parameters from the intents' JSON files.
    * Removes lastUpdate parameters from the intents' JSON files.

6. [Merge Request !56](https://gitlab.com/aossie/CarbonAssistant-Function/merge_requests/56) -  Wizard support for electricity related emission queries
    * Suggests parameter Region i.e the consumption country
    * Suggests parameter Quantity i.e the consumption quantity
    * Added both comparative and number based response along with context-management support.

7. [Merge Request !57](https://gitlab.com/aossie/CarbonAssistant-Function/merge_requests/57) -  Updated the Carbon-Assistant-Agent folder
    * Removed the parameter updated from the JSON files.
    * Removed the parameter lastUpdate from the JSON files.

8. [Merge Request !58](https://gitlab.com/aossie/CarbonAssistant-Function/merge_requests/58) -  Enhancing the emission-response
    * In the emission-related response, a BasicCard with a button linking to [visualizations](https://www.carbonhub.org/) has been added.

9. [Merge Request !59](https://gitlab.com/aossie/CarbonAssistant-Function/merge_requests/59) -  Wizard Support for Trains related emission queries
    * Menu support added for `Trains`
    * Slot filling feature added for `origin` i.e. the source city
    * Slot filling feature added for `destination` i.e. the destination city
    * Suggests parameter `passengers` i.e the number of passengers traveling
    * Adds context-management support.

10. [Merge Request !60](https://gitlab.com/aossie/CarbonAssistant-Function/merge_requests/60) -  Wizard support for Flights related emission queries
    * Menu support added for `Flights`
    * Slot filling feature added for `origin` i.e. the source city
    * Slot filling feature added for `destination` i.e. the destination city
    * Suggests parameter `passengers` i.e the number of passengers traveling
    * Adds context-management support.

11. [Merge Request !61](https://gitlab.com/aossie/CarbonAssistant-Function/merge_requests/61) -  Error handling of the intents' JS files

12. [Merge Request !62](https://gitlab.com/aossie/CarbonAssistant-Function/merge_requests/62) -  Wizard support for fuels related emission queries
    * Menu support added for `Fuels`
    * Suggests parameter `Emission Type`
    * Suggests parameter `Consumption Quantity`
    * Adds a list of `Fuel Types`. Adds both images and description in the list.
    * Google home response added
    * Adds context-management support.

13. [Merge Request !63](https://gitlab.com/aossie/CarbonAssistant-Function/merge_requests/63) -  Wizard support for Poultry related emission queries
    * Menu support added for `Poultry`
    * Suggests parameter `Region`
    * Suggests parameter `Quantity`
    * Adds a list of `Poultry Types`. Adds both images and description in the list.
    * Adds a list of `Poultry Region`.
    * Adds context-management support.
    * Google home response added for non-display screen devices.

14. [Merge Request !64](https://gitlab.com/aossie/CarbonAssistant-Function/merge_requests/64) -  Wizard support for vehicles related emission queries
    * Adds the menu support which gives a list of categories for the user to choose one.
    * Adds slot filling feature for `Origin`
    * Adds slot filling feature for `Destination`
    * Adds a list of `Fuel Types`
    * Suggests parameter `emission type` and `mileage`. 
    * Adds support for both, querying directly and through the wizard system.
    * Adds both comparative and number based response along with context-management support.

15. [Merge Request !65](https://gitlab.com/aossie/CarbonAssistant-Function/merge_requests/65) - Wizard support for appliances related emission queries
    * Adds the menu support which gives a list of categories for the user to choose one.
    * Adds slot filling feature for `Region`
    * Adds a list of `Appliances`
    * Suggests parameter `quantity`
    * Suggests parameter `duration`
    * Adds support for both, querying directly and through the wizard support.
    * Adds both comparative and number based response along with context-management support.

16. [Merge Request !66](https://gitlab.com/aossie/CarbonAssistant-Function/merge_requests/66) -  Indentation of JS files

17. [Merge Request !67](https://gitlab.com/aossie/CarbonAssistant-Function/merge_requests/67) -  Menu feature for reducing emissions' guidance system
    * Details about Reducing Emissions added in help intent for google home support and display screen devices.
    * A Basic card along with button and description of different categories is added
    * Menu support is added for this guidance system
    * Google Home response is added
    * Suggestion chips for different categories is added

18. [Merge Request !68](https://gitlab.com/aossie/CarbonAssistant-Function/merge_requests/68) -  Support for fields under reduce emission guidance system
    * Support for all the categories, `NGO`, `Food`, `Air Travel`, `Transportation`, `Clothes and Shopping`, `Trees` and `Home Appliances` added under the reduce emission guidance

19. [Merge Request !69](https://gitlab.com/aossie/CarbonAssistant-Function/merge_requests/69) -  Unit test for land intents

20. [Merge Request !70](https://gitlab.com/aossie/CarbonAssistant-Function/merge_requests/70) -  Unit-test for Food Intents

21. [Merge Request !71](https://gitlab.com/aossie/CarbonAssistant-Function/merge_requests/71) -  Adds unit-test for flight intents

22. [Merge Request !72](https://gitlab.com/aossie/CarbonAssistant-Function/merge_requests/72) -  Adds unit-test for trains intent

23. [Merge Request !73](https://gitlab.com/aossie/CarbonAssistant-Function/merge_requests/73) -  Unit test for help and menu intents
    * Adds unit test for both display screens and google home support
    * Adds unit test for menu and help intents
    * Covers the test for suggestion chips in the help intent
    * Covers the test for the list of categories in the menu intent    

24. [Merge Request !74](https://gitlab.com/aossie/CarbonAssistant-Function/merge_requests/74) -  Google home response added for [land+food+flights+train+appliances]

25. [Merge Request !75](https://gitlab.com/aossie/CarbonAssistant-Function/merge_requests/75) -  Unit-test for appliances
    * Added test for appliances intents
    * Added test for suggestion Chips, Basic Card, button and lists
    * Adds automated testing 
    * Added .env file and support to read environment variables.    
  

26. [Merge Request !76](https://gitlab.com/aossie/CarbonAssistant-Function/merge_requests/76) -  Support to include comparative response for flights
    * Adds support for comparative responses of flights in the `reverseLookupManager`   

27. [Merge Request !77](https://gitlab.com/aossie/CarbonAssistant-Function/merge_requests/77) -  Unit-test for Sectors Intents
    * Added button feature for the sector intent's response which links to the visualization 
    * Added test for sector intents   

28. [Merge Request !78](https://gitlab.com/aossie/CarbonAssistant-Function/merge_requests/78) -  Unit-test for Electricity Intent

29. [Merge Request !79](https://gitlab.com/aossie/CarbonAssistant-Function/merge_requests/79) -  Google home responses added for [Sectors + Electricity]

30. [Merge Request !80](https://gitlab.com/aossie/CarbonAssistant-Function/merge_requests/80) -  Unit-test for fuels intents
    * Added test for fuels intents   
    * Indented index.js file

31. [Merge Request !81](https://gitlab.com/aossie/CarbonAssistant-Function/merge_requests/81) -  Unit-test for vehicles intents

32. [Merge Request !82](https://gitlab.com/aossie/CarbonAssistant-Function/merge_requests/82) -  Unit-test for Poultry Intents

33. [Merge Request !83](https://gitlab.com/aossie/CarbonAssistant-Function/merge_requests/83) -  Adding error response and improving error handling
    * Added error response for status code 400 when error is null   

34. [Merge Request !84](https://gitlab.com/aossie/CarbonAssistant-Function/merge_requests/84) -  Unit-test script for Agriculture Intent

35. [Merge Request !85](https://gitlab.com/aossie/CarbonAssistant-Function/merge_requests/85) -  Updated the usage documentation

36. [Merge Request !86](https://gitlab.com/aossie/CarbonAssistant-Function/merge_requests/86) -  Unit-test script for Reducing_Emission Support
    * Test for menu Intent for Reducing Emission
    * Test for all the categories under Reducing Emission i.e. Food and Composting, NGO, Transportation, Air Travel, Clothes and Shopping, Home Appliances, and Trees.
    * Test for basic Card, suggestion chips, buttons, and Daily Updates.
    * Path to .env file added in all the JS files

37. [Merge Request !163](https://gitlab.com/aossie/CarbonFootprint-API/merge_requests/163) -  Adds support for comparative response for flights
    * Adds support for the comparative response for flights in the `reverseLookupController`


## Few Screenshots

<img src="https://i.imgur.com/14StcCN.png" align="center" width="480" height="400"/>

<img src="https://i.imgur.com/yN8S50H.png" align="center" width="700" height="350"/>

<img src="https://i.imgur.com/TlIylEu.png" align="center" width="350" height="600"/>

<img src="https://i.imgur.com/Dhthu0p.png" align="center" width="350" height="600"/>

<img src="https://i.imgur.com/j4fgKGW.png" align="center" width="350" height="600"/>



## Future Work

1. Using mocha testing framework and firebase-functions-test package unit tests can be written for firebase-functions, which will cover both non-HTTP and HTTP functions.

2. In the ReverseLookup controller for the flights section in the CarbonFootprint-API project,the source and famous airport pairs can be stored in the database if a famous airport exists for the specific source airport. This can save some computation so, whenever the source airport is same the famous airport if exists can be provided as the destination airport. This can be further extended for the trains section too.