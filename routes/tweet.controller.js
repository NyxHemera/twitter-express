var Dataset = require('../models/dataset');
var Keyword = require('../models/keyword');

var Twit = require('twit');
var KEYS = require('../secrets/keys');
var APIKEY = require('../secrets/apikey');

var currentDS;
var currentKWs;

var words = [];

var stream = null;

exports.start = function(req, res) {
	if(req.query.key === APIKEY) {
		Dataset.findById(req.params.id)
		.populate('keywords')
		.exec(function(err, ds) {
			// Set up variables
			currentDS = ds;
			currentKWs = ds.keywords;
			for(var i=0; i<currentKWs.length; i++) {
				words.push([]);
			}
			currentDS.running = true;
			currentDS.save();
			// Start Stream
			stream = KEYS.stream('statuses/filter', { track: ds.keyText });
			stream.on('tweet', function(tweet) {
				ptweet = processTweet(tweet.text);
				logTweet(ptweet);
			});

			res.json({msg: 'started'});
		});
	}else {
		res.json({msg: 'Key Rejected'});
	}
};

exports.stop = function(req, res) {
	if(req.query.key === APIKEY) {
		stream.stop();
		currentDS.running = false;
		currentDS.hasRun = true;
		currentDS.save()
		.then(function() {
			words = filterWordsArr(words);
			saveWordsArr();
			res.json({msg: 'stopped'});
		});
	}else {
		res.json({msg: 'Key Rejected'});
	}
};

function splitFullTweet(str) {
	return str.split(' ');
}

function removeAbnorm(str) {
	var str = str.split('');

	for(var i=0; i<str.length; i++) {
		if(
		str[i] == '\'' ||
		str[i] == '\n' ||
		str[i] == ':' ||
		str[i] == '!' ||
		str[i] == '.' ||
		str[i] == '?' ||
		str[i] == ',' ||
		str[i] == '"'
		) {
			str.splice(i--, 1);
			continue;
		}
	}
	return str.join('');
}

function removeEmpty(arr) {
	for(var i=0; i<arr.length; i++) {
		arr[i] === '' ? arr.splice(i--,1) : '';
	}
	return arr;
}

function removeFillers(arr) {
	for(var i=0; i<arr.length; i++) {
		if(
			arr[i].indexOf("http") != -1 ||
			arr[i].indexOf("RT") != -1 ||
			arr[i].indexOf("…") != -1 ||
			arr[i].indexOf("@") != -1 ||
			arr[i].indexOf("&amp;") != -1
			) {
			arr.splice(i--, 1);
			continue;
		}
	}
	return arr;
}

function processTweet(tweet) {
	tweet = splitFullTweet(tweet);
	for(var i=0; i<tweet.length; i++) {
		tweet[i] = removeAbnorm(tweet[i]);
	}
	tweet = removeFillers(tweet);
	tweet = removeEmpty(tweet);
	for(var i=0; i<tweet.length; i++) {
		tweet[i] = tweet[i].toLowerCase();
	}
	return tweet;
}

function scanTweetForKey(ptweet) {
	var arr = [];
	for(var i=0; i<currentKWs.length; i++) {
		if(ptweet.join('').indexOf(currentKWs[i].keyText.toLowerCase()) != -1) {
			arr.push(i);
		}
	}
	return arr;
}

// This really needs some work....Looks terrible and is unreadable
function logTweet(ptweet) {
	var index = scanTweetForKey(ptweet);
	// If applies to one of the keywords
	console.log(index);
	for(var q=0; q<index.length; q++) {
		for(var i=0; i<ptweet.length; i++) {
			var found = false;
			for(var j=0; j<words[index[q]].length; j++) {
				if(ptweet[i] === words[index[q]][j].text) {
					words[index[q]][j].occ += 1;
					found = true;
					break;
				}
			}
			if(!found) {
				var obj = {
					text: ptweet[i],
					occ: 1
				};
				words[index[q]].push(obj);
			}else {
				found = false;
			}
		}
	}
}

function getWordsAvg(arr) {
	var sum = 0;
	for(var i=0; i<arr.length; i++) {
		sum += arr[i].occ;
	}
	return sum/arr.length;
}

function removeShortWords(arr) {
	console.log('Before removing short words: ' + arr.length);
	for(var i=0; i<arr.length; i++) {
		if(arr[i].text.length <= 3) {
			arr.splice(i--, 1);
		}
	}
	console.log('After removing short words: ' + arr.length);
	return arr;
}
// Could combine short and removeLowFreqWords in the future....
function removeLowFreqWords(arr) {
	console.log('Before removing low frequency words: ' + arr.length);
	for(var i=0; i<arr.length; i++) {
		if(arr[i].occ < 10) {
			arr.splice(i--, 1);
		}
	}
	console.log('After removing low frequency words: ' + arr.length);
	return arr;
}

function filterWordsArr(arr) {
	for(var i=0; i<arr.length; i++) {
		console.log('Before filtering: ' + arr[i].length);
		// Remove short words
		arr[i] = removeShortWords(arr[i]);
		// Remove low frequency words
		arr[i] = removeLowFreqWords(arr[i]);
		console.log('After filtering: ' + arr[i].length);
	}
	return arr;
}

function saveWordsArr() {
	for(var i=0; i<currentKWs.length; i++) {
		currentKWs[i].words = words[i];
		currentKWs[i].save();
	}
}

function handleError(res, err, msg) {
	console.log(err);
	return res.send(500, err);
}