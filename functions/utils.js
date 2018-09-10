const {
    SimpleResponse, Suggestions
} = require('actions-on-google');

exports.roundWithPrecision = (value, precision) => {
    var multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
}

exports.getRandomNumber = (minimum, maximum) => {
    return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
}

exports.richResponse = (conv, display, toSpeak) => {
    conv.ask(new SimpleResponse({
        speech: toSpeak,
        text: display
    }));
}

exports.responseWithSuggestions = (conv, display, suggestions) => {
	console.log("Sending response: "+display);
	console.log("Sending suggestion: "+suggestions);
    conv.ask(new SimpleResponse({
        speech: display,
        text: display
    }),
	new Suggestions(suggestions));
}