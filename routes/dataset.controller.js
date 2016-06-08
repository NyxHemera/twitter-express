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
	.exec(function(err, dataset) {
		return res.json(dataset);
	});
};

exports.editKeys = function(req, res) {

};

exports.newDS = function(req, res) {
	console.log('New Dataset Called');
	var objArr = [];
	var keyText = '';
	for(var i=0; i<req.body.keys.length; i++) {
		objArr.push({keyText: req.body.keys[i]});
		if(i>0) {
			keyText += ','+req.body.keys[i];
		}else {
			keyText += req.body.keys[i];
		}
	}
	Dataset.create({keyText: keyText, running: false, hasRun: false}, function(err, newDS) {
		console.log(newDS);
		Keyword.create(objArr, function(err, newKeywords) {
			for(var i=0; i<newKeywords.length; i++) {
				newDS.keywords.push(newKeywords[i]);
			}
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