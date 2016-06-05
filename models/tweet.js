var mongoose = require('mongoose');

var TweetSchema = new mongoose.Schema({
	created_at: String,
	lang: String,
	text: String,
	source: String,
	entities: [{
		hashtags: [],
		user_mentions: []
	}],
	timestamp_ms: Number,
	user: [{
		created_at: String,
		lang: String,
		favourites_count: Number,
		followers_count: Number,
		friends_count: Number,
		location: String,
		time_zone: String
	}]
});

TweetSchema.methods.printText = function() {
	console.log(this.text);
}

module.exports = mongoose.model('Tweet', TweetSchema);