var Dataset = require('../models/dataset');
var Keyword = require('../models/keyword');
var Word = require('../models/word');
var Tweet = require('../models/tweet');

var Twit = require('twit');
var KEYS = require('../secrets/keys');

var currentDS;
var currentKWs;

var tweets = [];
var words = [];

var stream = null;

exports.start = function(req, res) {
	Dataset.findById(req.params.id)
	.populate('keywords')
	.exec(function(err, ds) {
		// Set up variables
		currentDS = ds;
		currentKWs = ds.keywords;
		for(var i=0; i<currentKWs.length; i++) {
			tweets.push([]);
		}
		currentDS.running = true;
		currentDS.save();
		// Start Stream
		stream = KEYS.stream('statuses/filter', { track: ds.keyText });
		stream.on('tweet', function(tweet) {
			ptweet = processTweet(tweet.text);
			tweet = scrapeTweet(tweet);
			logTweet(tweet, ptweet);
			//saveTweet(tweet, ptweet);
		});

		res.json({msg: 'started'});
	});
};

exports.stop = function(req, res) {
	stream.stop();
	currentDS.running = false;
	currentDS.hasRun = true;
	currentDS.save()
	.then(function() {
/*		for(var i=0; i<currentKWs.length; i++) {
			saveTweetsArr(i);
		}*/
		saveWordsArr();
		res.json({msg: 'stopped'});
	});
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
			arr[i].indexOf("@") != -1
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
	return tweet;
}

function scrapeTweet(tweet) {
  var data = {};
  data.created_at = tweet.created_at;
  data.lang = tweet.lang;
  data.text = tweet.text;
  data.source = tweet.source;
  data.entities = {};
  data.entities.hashtags = tweet.entities.hashtags;
  data.entities.user_mentions = tweet.entities.user_mentions;
  data.timestamp_ms = tweet.timestamp_ms;
  data.user = {};
  data.user.created_at = tweet.user.created_at;
  data.user.lang = tweet.user.lang;
  data.user.favourites_count = tweet.user.favourites_count;
  data.user.followers_count = tweet.user.followers_count;
  data.user.friends_count = tweet.user.friends_count;
  data.user.location = tweet.user.location;
  data.user.time_zone = tweet.user.time_zone;
  return data;
}

function scanTweetForKey(tweet) {
	var arr = [];
	for(var i=0; i<currentKWs.length; i++) {
		if(tweet.text.toLowerCase().indexOf(currentKWs[i].keyText.toLowerCase()) != -1) {
			arr.push(i);
		}
	}
	return arr;
}

// This really needs some work....Looks terrible and is unreadable
function logTweet(tweet, ptweet) {
	var index = scanTweetForKey(tweet);
	if(index.length != 0) {
		for(var q=0; q<index.length; q++) {
			tweets[index[q]].push(tweet);

			//log ptweets
			for(var i=0; i<ptweet.length; i++) {
				var obj = {
					text: ptweet[i],
					keys: [{
						keyword: currentKWs[index[q]],
						occ: [{
							sidewords: [ptweet[i-1], ptweet[i+1]],
							time: tweet.timestamp_ms
						}]
					}]
				};
				var found = false;
				for(var j=0; j<words.length; j++) {
					if(ptweet[i].toLowerCase() === words[j].text.toLowerCase()) {
						// If word exists, check for key existence
						var keyFound = false;
						for(var k=0; k<words[j].keys.length; k++) {
							// If the keyword in obj already exists in the words obj:
							if(words[j].keys[k].keyword._id === obj.keys[0].keyword._id) {
								words[j].keys[k].occ.push(obj.keys[0].occ[0]);
								keyFound = true;
								break;
							}
						}
						if(keyFound) {
							keyFound = false;
						}else {
							words[j].keys.push(obj.keys[0]);
						}
						found = true;
						break;
					}
				}
				if(found) {
					found = false;
				}else {
					words.push(obj);
				}
			}
		}
	}
}

function saveTweetsArr(index) {
	Tweet.create(tweets[index], function(err, savedTweets) {
		// Add new tweets to the respective Keyword
		for(var i=0; i<savedTweets.length; i++) {
			currentKWs[index].tweets.push(savedTweets[i]);
		}
		currentKWs[index].save();
	});
}

function saveWordsArr() {
	Word.create(words, function(err, savedWords) {
		for(var i=0; i<savedWords.length; i++) {
			for(var j=0; j<savedWords[i].keys.length; j++) {
				for(var k=0; k<currentKWs.length; k++) {
					if(currentKWs[k]._id === savedWords[i].keys[j].keyword._id) {
						currentKWs[k].words.push(savedWords[i]);
					}
				}
			}
		}

		for(var i=0; i<currentKWs.length; i++) {
			currentKWs[i].save();
		}
	});
}

function handleError(res, err, msg) {
	console.log(err);
	return res.send(500, err);
}