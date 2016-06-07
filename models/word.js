var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

var WordSchema = new mongoose.Schema({
	text: String,
	keys: [{
		keyword: { type: ObjectId, ref: 'Keyword' },
		occ: [{
			sidewords: [],
			time: Number
		}]
	}]
});

module.exports = mongoose.model('Word', WordSchema);