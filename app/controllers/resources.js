const Mongoose = require('mongoose');
const Tweet = Mongoose.model('Tweet');
const User = Mongoose.model('User');
const Analytics = Mongoose.model('Analytics');
const logger = require('../middlewares/logger');

var fs = require('fs');

const TEMPDIR = __dirname + '/../../public/temp/';
const UPLOADDIR = __dirname + '/../../public/files/';

exports.display = (req, res) => {

	console.log("resources display");

  const user = req.session.user;
  const reqUserId = user._id;
  const userId = reqUserId.toString();
  const page = (req.query.page > 0 ? req.query.page : 1) - 1;
  const options = {
    perPage: 100,
    page: page,
    criteria: { user: userId }
  };
  let tweets, tweetCount;
  let followingCount = user.following.length;
  let followerCount = user.followers.length;

  Tweet.list(options)
    .then( result => {
      tweets = result;
      return Tweet.countUserTweets(reqUserId);
    })
    .then( result => {
      tweetCount = result;
    })
    .then( result => {
     
     	fs.readdir(UPLOADDIR,function(err, list) {
       		if(err)
         		throw err;

    		res.render('pages/resources', {
        		user: user,
        		tweets: tweets,
        		tweetCount: tweetCount,
        		followerCount: followerCount,
        		followingCount: followingCount,
        		fileList:list
      		});

     	}); 
   
    })
    .catch(error => {
      return res.render('pages/500',  { errors: error.errors });
    });

};