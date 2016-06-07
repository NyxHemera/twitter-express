var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

var KeywordSchema = new mongoose.Schema({
	keyText: String,
	words: [{ type: ObjectId, ref: 'Word' }]/*,
	tweets: [{ type: ObjectId, ref: 'Tweet' }]*/
});

module.exports = mongoose.model('Keyword', KeywordSchema);