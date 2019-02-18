//@ts-check
const utils = require('../../lib/utils');
const mongoose = require('mongoose');
const Activity = mongoose.model('Activity');
const logger = require('../middlewares/logger');
const _ = require('underscore');

var Filter = require('bad-words');
var filter = new Filter();


exports.load = (req, res, next, id) => {
  //console.log('load loading comment : '+req.tweet);
  const tweet = req.tweet;

  /*tweet.comments.forEach(function(entry) {
    if(entry["_id"] == id){
      req.comment = entry; //console.log('comment : '+req.comment);
      next();
    }
  });*/

  utils.findByParam(tweet.comments, { id: id }, (err, comment) => {
    if (err) {
      console.log("Error comment load : "+err);
      return next(err);
    }
    req.comment = comment; console.log("comment : "+comment);
    next();
  });  
};

// ### Create Comment
exports.create = (req, res) => {
  const tweet = req.tweet;
  const user = req.session.user;

  if (!req.body.body) {
    return res.redirect('/users/'+user._id);
  }

  if (filter.clean(req.body.body).includes("***")){
    res.render('pages/3003', {error: "Curse words detected !"});
  }else{
    tweet.addComment(user, req.body, err => {
      if (err) {
        logger.error(err);
        return res.render('pages/500');
      }
      const activity = new Activity({
        activityStream: 'added a comment  "'+req.body.body+'"  ',
        activityKey: tweet.id,
        sender: user,
        receiver: req.tweet.user,
      });
      logger.info(activity);
      activity.save((err) => {
        if (err) {
          logger.error(err);
          return res.render('pages/500');
        }
      });
      res.redirect('/users/'+user._id);
    });
  }


};

// ### Delete Comment
exports.destroy = (req, res) => {
  
  const tweet = req.tweet;
  const comment = req.comment;
tweet.removeComment(req.comment._id, err => {
      if (err) {
        logger.error(err); console.log("error : "+err)
        return res.render('pages/500');
      }
      /*const activity = new Activity({
        activityStream: 'added a comment  "'+req.body.body+'"  ',
        activityKey: tweet.id,
        sender: user,
        receiver: req.tweet.user,
      });
      logger.info(activity);
      activity.save((err) => {
        if (err) {
          logger.error(err);
          return res.render('pages/500');
        }
      });*/
      res.redirect('/users/'+req.session.user._id);
    });  
};


exports.update = (req, res) => {

  if (filter.clean(req.body.tweet).includes("***")){
    res.render('pages/3003', {error: "Curse words detected !"});
  }else{
    
  const tweet = req.tweet; 
  const comment = req.comment; console.log('twett :'+req.body.tweet);

  tweet.updateComment(comment._id, req.body.tweet, err => {
      if (err) {
        logger.error(err); console.log("error : "+err)
        return res.render('pages/500');
      }
      /*const activity = new Activity({
        activityStream: 'added a comment  "'+req.body.body+'"  ',
        activityKey: tweet.id,
        sender: user,
        receiver: req.tweet.user,
      });
      logger.info(activity);
      activity.save((err) => {
        if (err) {
          logger.error(err);
          return res.render('pages/500');
        }
      });*/
      res.redirect('/users/'+req.session.user._id);
    });    
  }
  
};
