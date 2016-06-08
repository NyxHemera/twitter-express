var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

var KeywordSchema = new mongoose.Schema({
	keyText: String,
	color: String,
	words: [{
		text: String,
		occ: Number
	}]
});

module.exports = mongoose.model('Keyword', KeywordSchema);