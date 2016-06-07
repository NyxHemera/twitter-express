var express = require('express');
var router = express.Router();
var Tweet = require('../models/tweet');
var tweetCtrl = require('./tweet.controller');
var datasetCtrl = require('./dataset.controller')

//---------------------------------------//
//	Return API Documentation						 //
//---------------------------------------//
router.route('/')
	.get(function(req, res, next) {
		res.send('This is a test');
	});

//---------------------------------------//
//	Dataset Routes			 								 //
//---------------------------------------//
router.get('/datasets', datasetCtrl.index);
router.get('/datasets/:id', datasetCtrl.getById);
router.put('/datasets/:id', datasetCtrl.editKeys);
router.post('/datasets/new', datasetCtrl.newDS);

//---------------------------------------//
//	Gathering Routes										 //
//---------------------------------------//
router.get('/start/:id', tweetCtrl.start);
router.get('/stop', tweetCtrl.stop);

module.exports = router;