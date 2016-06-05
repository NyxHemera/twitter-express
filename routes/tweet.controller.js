/*import Dataset from '../models/dataset';
import Keyword from '../models/keyword';
import Word from '../models/word';
import Tweet from '../models/tweet';*/
var Twit = require('twit');
var KEYS = require('../secrets/keys');

var stream = null;

exports.start = function(req, res) {
	stream = KEYS.stream('statuses/filter', { track: 'trump' });
	stream.on('tweet', function(tweet) {
		console.log(tweet);
	});
	res.json({msg: 'started'});
};

exports.stop = function(req, res) {
	stream.stop();
	res.json({msg: 'stopped'});
};

function handleError(res, err, msg) {
	console.log(err);
	return res.send(500, err);
}