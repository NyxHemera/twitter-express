var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

var DatasetSchema = new mongoose.Schema({
	keywords: [{ type: ObjectId, ref: 'Keyword' }],
	keyText: String,
	running: Boolean,
	hasRun: Boolean
});

module.exports = mongoose.model('Dataset', DatasetSchema);