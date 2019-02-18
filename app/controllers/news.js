const Mongoose = require('mongoose');
const News = Mongoose.model('News');
const User = Mongoose.model('User');
const Tweet = Mongoose.model('Tweet');
const Analytics = Mongoose.model('Analytics');
const logger = require('../middlewares/logger');
const utils = require("../../lib/utils");
const _ = require('underscore');

exports.create = (req, res) => {

  const news = new News(req.body);
  news.user = req.session.user;

  news.save()
    .catch(error => {
      console.log('error : '+error.errors)
      return res.redirect('/login');
    })
    .then(() => {
      return res.redirect('/users/'+req.session.user._id);
    })

};

exports.display = (req, res) => {

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

		const options = {

		};
		let news;
		News.list(options)
		.then(result => {
		  news = result;
		  console.log("result : "+result);
		  res.render('pages/news', {
		  	news: news,
			tweetCount: tweetCount,
			followerCount: followerCount,
			followingCount: followingCount,      	
		  });
		});
   
    })
    .catch(error => {
      return res.render('pages/500',  { errors: error.errors });
    });

};

exports.news = (req, res, next, id) => {
  News.load(id, (err, nnews) => {
    if (err) {
      return next(err);
    }
    if (!nnews) {
      return next(new Error('Failed to load news' + id));
    }
    req.news = nnews;
    next();
  });
};

exports.update = (req, res) => {

  News.findOne({ _id: req.params.nid }, function(err, result) {
    if (err){
      console.log('error finding news: '+err);
    }else{
       let tweet = result; console.log('update : '+result);
      tweet = _.extend(tweet, {'body': req.body.tweet});
      tweet.uploadAndSave({}, (err) => {
        if (err) {
          return res.render('pages/500', {error: err});
        }
        res.redirect('/users/'+req.session.user._id);
      });     
    }

  });

};

// ### Delete a tweet
exports.destroy = (req, res) => {

  News.findOne({ _id: req.params.nid }, function(err, result) {
    if (err){
      console.log('error finding news: '+err);
    }else{
    const tweet = result;
      tweet.remove(err => {
        if (err) {
          return res.render('pages/500');
        }
        res.redirect('/users/'+req.session.user._id);
      });    
    }

  });

};