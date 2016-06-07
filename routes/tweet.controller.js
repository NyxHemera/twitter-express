var Dataset = require('../models/dataset');
var Keyword = require('../models/keyword');
var Word = require('../models/word');
var Tweet = require('../models/tweet');

var Twit = require('twit');
var KEYS = require('../secrets/keys');

var currentDS;
var currentKW;

var tweets = [];
var words = [];

var stream = null;

exports.start = function(req, res) {
	Dataset.findById(req.params.id)
	.populate('keywords')
	.exec(function(err, ds) {
		console.log(ds);
		currentDS = ds;
		currentKW = ds.keywords[0];
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
	saveTweetsArr();
	saveWordsArr();
	res.json({msg: 'stopped'});
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

function logTweet(tweet, ptweet) {
	tweets.push(tweet);

	//log ptweets
	for(var i=0; i<ptweet.length; i++) {
		var obj = {
			text: ptweet[i],
			keys: [{
				keyword: currentKW,
				occ: [{
					sidewords: [ptweet[i-1], ptweet[i+1]],
					time: tweet.timestamp_ms
				}]
			}]
		};
		var found = false;
		for(var j=0; j<words.length; j++) {
			if(ptweet[i].toLowerCase() === words[j].text.toLowerCase()) {
				// If found, push to that word
				// Needs to be altered for multiple keys in Word Model
				words[j].keys[0].occ.push(obj.keys[0].occ[0]);
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

function saveTweetsArr() {
	Tweet.create(tweets, function(err, savedTweets) {
		// Add new tweets to the dataset
		currentDS.tweets = savedTweets;
		currentDS.save();

		// Add to keyword, eventually needs to do a check to see which keyword it applies to.
		currentKW.tweets = savedTweets;
		currentKW.save();
	});
}

function saveWordsArr() {
	Word.create(words, function(err, savedWords) {
		currentKW.words = savedWords;
		currentKW.save();
	});
}

/*function saveTweet(tweet, ptweet) {
	console.log(ptweet);
	Tweet.create([tweet], function(err, savedTweet) {
		// Add Tweet to current Dataset
		currentDS.tweets.push(savedTweet[0]);
		currentDS.save();
		currentKW.tweets.push(savedTweet[0]);
		currentKW.save();
		//console.log(savedTweet);
		for(var i=0; i<ptweet.length; i++) {
			var loopi = i;
			Word.findOne({'text': ptweet[loopi]}, function(err, word) {
				console.log(word);
				if(word) {
					// If Word exists, add to keyword
					console.log('word found');
					console.log(word);
					currentKW.words.push(word);
					currentKW.save();

					// Check if keyword exists in Word.keys
					var foundKey = false;
					var index;
					for(var j=0; j<word.keys.length; j++) {
						if(word.keys[j].keyword === currentKW) {
							foundKey = true;
							index = j;
							break;
						}
					}

					if(foundKey) {
						// If found, add new occurance
						var obj = {
							sidewords: [ptweet[loopi-1], ptweet[loopi+1]]
						};
						word.keys[index].occ.push(obj);
					}else {
						// If not found, add new key with occurance
						var obj = {
							keyword: currentKW,
							occ: [{
								sidewords: [ptweet[loopi-1], ptweet[loopi+1]]
							}]
						};
						word.keys.push(obj);
					}

				}else {
					// If Word doesn't exist, create new Word
					console.log('else');
					console.log(ptweet[i]);
					var newWord = {
						text: ptweet[loopi],
						keys: [{
							keyword: currentKW,
							occ: [{
								sidewords: [ptweet[loopi-1], ptweet[loopi+1]]
							}]
						}]
					};
					Word.create([newWord], function(err, savedWord) {
						console.log('saved word');
						console.log(savedWord.text);
						currentKW.words.push(savedWord[0]);
						currentKW.save();
					});
				}
			});
		}
	});
}*/

function handleError(res, err, msg) {
	console.log(err);
	return res.send(500, err);
}