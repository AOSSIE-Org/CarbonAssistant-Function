// Require the nodejs file system library
var fs = require('fs');

// Calling function separately for intents and entities
readAgentPath("../carbon-assistant-agent/intents");
readAgentPath("../carbon-assistant-agent/entities");

function readAgentPath(path) {
	// Readdir reads a path and gives an array of filenames
	// to the callback handleFiles.
	fs.readdir(path,
		function (err, files) {
			if (err) throw err;
			var jsonFilePattern = /\.[json]+$/i;
			var fileName;
			var filePath;
			// Tells fs to read an utf-8 file.
			var fileReadOptions = {
				'encoding': 'utf-8'
			};
			for (var i = 0; i < files.length; ++i) {
				fileName = files[i];
				if (fileName.match(jsonFilePattern)) {
					filePath = path + '/' + fileName;
					handleData(filePath, fileReadOptions);
				}
			}
		});
}

function handleData(filePath, fileReadOptions) {
	// reads the json file
	fs.readFile(filePath, fileReadOptions,
		function (err, data) {
			if (err) throw err;
			var dataObject = JSON.parse(data);

			if (dataObject.length > 1) {
				for (var i = 0; i < dataObject.length; i++) {
					delete dataObject[i]['id'];
					delete dataObject[i]['updated'];
				}
			}
			else {
				// removes external id
				delete dataObject['lastUpdate'];
				delete dataObject['id'];
				delete dataObject['parentId'];
				delete dataObject['rootParentId'];
				if (dataObject.responses) {
					//removes id of attributes 
					dataObject['responses'].forEach(element => {
						element['parameters'].forEach(variables => {
							delete variables['id']

						});
					});
				}
			}
			// Updating the agent dir with files without id
			fs.writeFileSync(filePath, JSON.stringify(dataObject, null, 2), function (err) {
				if (err) {
					return console.log(err);
				}
			});
		});
}
