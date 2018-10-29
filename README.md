# CarbonFootprint Assistant Action

CarbonFootprint is a Google Assistant Action which brings conversational access to the data supplied by the parent project [CarbonFootprint-API](https://gitlab.com/aossie/CarbonFootprint-API). Project CarbonFootprint-API aims at providing carbon emission data for various usecases. That could be about your usage of some appliance, or taking a flight or train to somewhere.

The Google Assistant Action provides you access to this information through voice on practically any device that may run Google Assistant - be it an Android device, Google Home or an iPhone. The action is accessible everywhere.
The Dialogflow agent which handles NLP, is combined with the firebase function which forms the backend and obtains data from the API project. Together, Agent and the Function form the Action.

# Features:

  - Support for all kind of queries supported by Project CarbonFootprint
  - Support across all categories such as obtaining emissions caused due to a road trip to somewhere OR due to train journey between two stations AND even due to Flights between two airports along with specification of number of passengers (e.g: "How much emissions are produced after I take a flight from Mumbai to Dubai ?")
  - Support for appliance usage along with their types, region of usage and their counts. (e.g: How much emissions are caused by 2 CRT TVs used for 11 hours in Canada?")
  - Support for queries related to emissions caused by meat and poultry productions (e.g: "What emissions are released for 3 kg beef production ?")
  - Reverse lookup and provide user-relatable emission comparisons (Provides you real-life examples which produce similar emissions)
  - Context management support (Able to remember what you said last and continue conversation over it)
  - Slot filling support (Able to recognize and re-enquire missing pieces of required information in your query)

The deployment of the Google Assistant Action is done in two parts: Deployment of DialogFlow Agent and Deployment of Firebase Cloud Function.

# CarbonFootprint Dialogflow Agent

### Deploying

- Download the agent zip by clicking [here](https://gitlab.com/aossie/CarbonAssistant-Function/raw/master/carbon-assistant-agent.zip)
- Once you have a zip, head to [Actions on Google](https://console.actions.google.com/u/0/) and create a new project by entering a name and country for the project
- Once the project is created, you will be on the Onboarding screen. Select 'Education & Reference' on this screen.
- Fill in the basic details about your action such as invocation phrase, voice etc in the 'Quick Setup' section.
- In 'Build your Action' section, select 'Add new action' and select 'Custom Intent' in the consecutive dialog box and click 'Build'
- You will redirected to DialogFlow's project page. On this screen - select your timezone - don't change the language. Then select 'Create' and wait for the process to complete.
- Once done, select the Settings gear icon at the top left and then go to Export and Import tab.
- On this screen, select 'Restore from Zip' and restore the zip you downloaded!
- Go to the 'Fulfillment' tab and you will see a field 'Webhook', you have to enter your own https endpoint. You can create your webhook by following deployment guide of the Firebase Cloud Function.
- That's it, you are almost there! Next select the 'Integrations' tab and then under Google Assistant section click on 'Integration Settings' and click on Test! You are done!
- Now, the Google assistant action has been deployed only for your Gmail account. You can fire up your Google Assistant app using the Invocation phrase you defined earlier and test it!

# CarbonFootprint Firebase Function

CarbonFootPrint Firebase function forms the backend of the Google Assistant Action. The function handles REST requests to the CarbonFootprint API and serves to the agent through a webhook URL.

### Deploying

We will use firebase CLI to deploy our cloud function. Make sure you have node v6 installed on your machine since cloud functions work with node v6.

In command line:
- Clone this repository and `cd` to it.
- Create a config.js in the functions directory with following contents:
``` javascript
var config = {
    endpoint: 'https://www.carbonhub.org/v1',
    access_key: '<insert-your-carbonfootprint-key>'
};
module.exports = config;
```
You can get your CarbonFootprint key by signing up with https://www.carbonhub.org/

Now you need to install firebase tools.

For this you will need a node.js installation and npm. You can install node.js [here](https://nodejs.org/en/)

`npm install -g firebase-tools`

Next, we will need to initialize firebase cloud functions library

- If you haven't used firebase-tools on your computer, you'll need to login

`firebase login`

- Once you're logged in to firebase, run the next command

`firebase init functions`

- This command is a command-line wizard which will guide you through a process which will associate your firebase function with your Google Cloud project that gets created when you created 'Actions on Google' project in Part 1 of the deployment.

- The wizard will ask:

`Select a default Firebase project for this directory: <your directory>`

- Make sure you select the project ID correctly using the arrow keys. The project must be same as the one the agent is deployed to. 

- When asked what language to use, select `JavaScript` using the arrow keys

- The wizard will ask:

`File functions/package.json already exists. Overwrite?`

`File functions/index.js already exists. Overwrite?`

**MAKE SURE YOU ENTER NO FOR BOTH**

- If you select yes, the code will be overwritten with a default firebase function. If this happens, clone the repository again.

- It will then ask:

`Do you want to install dependencies with npm now?`

- Select `Yes` and wait for the wizard to finish.

- Once the association is done, next you deploy the cloud function. Execute the following command

`firebase deploy --only functions:dialogflowFirebaseFulfillment`

- Once deployed you will get a URL, this is your webhook endpoint that Dialogflow will use to make requests to. Paste the URL in the 'Fullfillment' section of your Dialogflow agent

References and How to report bugs
----
- Detailed deployment documentation [here](https://developers.google.com/actions/dialogflow/deploy-fulfillment)
- Actions on Google docs: https://developers.google.com/actions/
- If you find any issues, please open a bug here on Gitlab.

License
----
See [LICENSE](LICENSE).
