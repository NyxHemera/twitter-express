/*import Dataset from '../models/dataset';
import Keyword from '../models/keyword';
import Word from '../models/word';
import Tweet from '../models/tweet';*/
/*var Dataset = require('../models/dataset');
var Keyword = require('../models/keyword');
var Word = require('../models/word');
var Tweet = require('../models/tweet');*/

exports.index = function(req, res) {

};

exports.getById = function(req, res) {
	Dataset.findById(req.params.id)
	.populate('keywords')
	.populate('tweets')
	.exec(function(err, dataset) {
		Dataset.populate(dataset, {path: 'keywords.words', model: 'Word'})
		.then(function(err, dataset) {
			return res.json(dataset);
		});
	});
};

exports.editKeys = function(req, res) {

};

exports.newDS = function(req, res) {

};

function handleError(res, err, msg) {
	console.log(err);
	return res.send(500, err);
}