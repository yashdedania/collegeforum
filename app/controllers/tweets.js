// ## Tweet Controller
const createPagination = require('./analytics').createPagination;
const mongoose = require('mongoose');
const Tweet = mongoose.model('Tweet');
const User = mongoose.model('User');
const Analytics = mongoose.model('Analytics');
const _ = require('underscore');
const logger = require('../middlewares/logger');

var Filter = require('bad-words');
var filter = new Filter();

exports.tweet = (req, res, next, id) => {
  Tweet.load(id, (err, tweet) => {
    if (err) {
      return next(err);
    }
    if (!tweet) {
      return next(new Error('Failed to load' + id));
    }
    req.tweet = tweet;
    next();
  });
};

// ### Create a Tweet
exports.create = (req, res) => {

  if (filter.clean(req.body.body).includes("***")){
    res.render('pages/3003', {error: "Curse words detected !"});
  }else{
    const tweet = new Tweet(req.body); 
    tweet.user = req.session.user;
    tweet.uploadAndSave({}, err => {
      if (err) {
        res.render('pages/500', {error: err});
      } else {
        res.redirect('/users/'+req.session.user._id);
      }
    });
  }

};

// ### Update a tweet
exports.update = (req, res) => {

  if (filter.clean(req.body.tweet).includes("***")){
    res.render('pages/3003', {error: "Curse words detected !"});
  }else{
   let tweet = req.tweet;
  tweet = _.extend(tweet, {'body': req.body.tweet});
  tweet.uploadAndSave({}, (err) => {
    if (err) {
      return res.render('pages/500', {error: err});
    }
    res.redirect('/users/'+req.session.user._id);
  });   
  } 

};

// ### Upvote a tweet
exports.upvote = (req, res) => {
  let tweet = req.tweet;

  tweet.addUpvote(req.session.user, err => {
    res.redirect('/users/'+req.session.user._id);
  }); 
};

// ### Downvote a tweet
exports.downvote = (req, res) => {
  let tweet = req.tweet;

  tweet.addDownvote(req.session.user, err => {
    res.redirect('/users/'+req.session.user._id);
  }); 
};

// ### Add Bookmark
exports.addbookmark = (req, res) => {
  let tweet = req.tweet;

  tweet.addBookmark(req.session.user, err => {
    res.redirect('/users/'+req.session.user._id);
    //res.sendStatus(200);
    //return 1;
  }); 
};

exports.showbookmarks = (req, res) => {
  console.log("bookmarks index");
  const page = (req.query.page > 0 ? req.query.page : 1) - 1;
  const perPage = 10;
  const options = {
    perPage: perPage,
    page: page
  };
  let followingCount = req.session.user.following.length;
  let followerCount = req.session.user.followers.length;
  let tweets, tweetCount, pageViews, analytics, pagination;
  User.countUserTweets(req.session.user._id).then(result => {
    tweetCount = result;
  });
  Tweet.list(options)
    .then(result => {
      tweets = new Array();
      result.forEach(function(entry) {
        if(entry.bookmarks.indexOf(req.session.user._id) !== -1){
          //tweets.slice(tweets.indexOf(entry), 1);
          tweets.push(entry); console.log(tweets);
        }
      });
      return Tweet.countTotalTweets();
    })
    .then(result => {
      pageViews = result;
      pagination = createPagination(req, Math.ceil(pageViews/ perPage),  page+1);
      return Analytics.list({ perPage: 15 });
    })
    .then(result => {
      analytics = result;
      res.render('pages/index', {
        title: 'List of Questions',
        tweets: tweets,
        analytics: analytics,
        page: page + 1,
        tweetCount: tweetCount,
        pagination: pagination,
        followerCount: followerCount,
        followingCount: followingCount,
        pages: Math.ceil(pageViews / perPage),
      });
    })
    .catch(error => {
      logger.error(error);
      res.render('pages/500');
    });
};


// ### Delete a tweet
exports.destroy = (req, res) => {
  const tweet = req.tweet;
  tweet.remove(err => {
    if (err) {
      return res.render('pages/500');
    }
    res.redirect('/users/'+req.session.user._id);
  });
};

exports.index = (req, res) => {
  console.log("Quesitons index");
  const page = (req.query.page > 0 ? req.query.page : 1) - 1;
  const perPage = 10;
  const options = {
    perPage: perPage,
    page: page
  };
  let followingCount = req.session.user.following.length;
  let followerCount = req.session.user.followers.length;
  let tweets, tweetCount, pageViews, analytics, pagination;
  User.countUserTweets(req.session.user._id).then(result => {
    tweetCount = result;
  });
  Tweet.list(options)
    .then(result => {
      tweets = result;
      return Tweet.countTotalTweets();
    })
    .then(result => {
      pageViews = result;
      pagination = createPagination(req, Math.ceil(pageViews/ perPage),  page+1);
      return Analytics.list({ perPage: 15 });
    })
    .then(result => {
      analytics = result;
      res.render('pages/index', {
        title: 'List of Questions',
        tweets: tweets,
        analytics: analytics,
        page: page + 1,
        tweetCount: tweetCount,
        pagination: pagination,
        followerCount: followerCount,
        followingCount: followingCount,
        pages: Math.ceil(pageViews / perPage),
      });
    })
    .catch(error => {
      logger.error(error);
      res.render('pages/500');
    });
};
