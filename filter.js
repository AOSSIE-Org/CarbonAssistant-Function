module.exports = {
    onRequest: (test, body) => {
        //  console.log(body);

         body.queryResult.intent.name = body.queryResult.intent.displayName;
        
     },
     
}


