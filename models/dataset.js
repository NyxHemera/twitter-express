var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

var DatasetSchema = new mongoose.Schema({
	keywords: [{ type: ObjectId, ref: 'Keyword' }],
	keyText: String,
	dStart: Date,
	dEnd: Date,
	timeOpen: Number,
	tweets: [{ type: ObjectId, ref: 'Tweet' }]
});

module.exports = mongoose.model('Dataset', DatasetSchema);