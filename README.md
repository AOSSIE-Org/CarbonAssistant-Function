# CarbonFootprint Firebase Function


CarbonFootPrint Firebase function forms the backend of the Google Assistant Action. The function handles REST requests to the CarbonFootprint API and serves to the agent through a webhook URL.

### Deploying

This documentation will only guide through Deployement of DialogFlow Agent. For guide on deployment of Dialogflow agent, please refer the repository of the agent: [here](https://gitlab.com/aossie/CarbonAssistant-Agent)
#### Part 2 - Deploying Firebase Cloud Function:
We will use firebase CLI to deploy our cloud function. Make sure you have latest version of npm and node installed on your machine.

In command line:
- Clone this repository and `cd` to it.
- Create a config.js in the functions directory with following contents:
``` javascript
var config = {
    endpoint: 'https://www.carbonhub.xyz/v1',
    access_key: '<insert-your-carbonfootprint-key>'
};
module.exports = config;
```
- Now you need to install firebase tools 
`npm install -g firebase-tools`
- Next to initialize firebase cloud functions library
`firebase init functions`
This command is a command-line wizard which will guide you through a process which will associate your firebase function with your Google Cloud project that gets created when you created 'Actions on Google' project in Part 1 of the deployment. Make sure you select the project ID correctly. The project must be same as the one the agent is deployed to. The wizard will ask you if you want to replace package.json and index.js, **MAKE SURE YOU ENTER NO**, otherwise the code will be overwritten by a template firebase function.
- Once the association is done, next you deploy the cloud function. Execute the following command
`firebase deploy --only functions:dialogflowFirebaseFulfillment`
Once deployed you will get a URL, this is your webhook endpoint that Dialogflow will use to make requests to.
- Return to Part 1 of deployment and paste the URL in the 'Fullfillment' section of your Dialogflow agent.


License
----
Apache License 2.0
