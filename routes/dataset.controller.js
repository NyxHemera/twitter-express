var Dataset = require('../models/dataset');
var Keyword = require('../models/keyword');
var Word = require('../models/word');
var Tweet = require('../models/tweet');

exports.index = function(req, res) {
	Dataset.find()
	.then(function(datasets) {
		console.log(datasets);
		return res.json(datasets);
	});
};

exports.getById = function(req, res) {
	Dataset.findById(req.params.id)
	.populate('keywords')
	.populate('tweets')
	.exec(function(err, dataset) {
		Dataset.populate(dataset, {path: 'keywords.words', model: 'Word'})
		.then(function(dataset) {
			return res.json(dataset);
		});
	});
};

exports.editKeys = function(req, res) {

};

exports.newDS = function(req, res) {
	console.log('calling newDS');
	console.log(req.body);
	Dataset.create(req.body, function(err, newDS) {
		console.log(err);
		console.log(newDS);
		Keyword.create({keyText: newDS.keyText}, function(err, newKeyword) {
			console.log(newKeyword);
			newDS.keywords.push(newKeyword);
			newDS.save()
			.then(function(err, DS) {
				return res.json(DS);
			});
		});
	});
};

function handleError(res, err, msg) {
	console.log(err);
	return res.send(500, err);
}