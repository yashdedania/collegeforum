const Mongoose = require('mongoose');
const Tweet = Mongoose.model('Tweet');
const User = Mongoose.model('User');
const Analytics = Mongoose.model('Analytics');
const logger = require('../middlewares/logger');

exports.authCallback = (req, res) => {
  res.redirect('/login');
};

exports.logout = (req, res) => {
  if (req.session) {
    // delete session object
    req.session.destroy(function (err) {
      if (err) {
        return next(err);
      } else {
        return res.redirect('/login');
      }
    });
  }
};


exports.checklogin = (req, res) => {
  //const user = new User(req.body);

  User.findOne({pid: req.body.pid.toString(), password: req.body.password.toString()}).exec((err, user) => {
    if (err) {
      console.log("error : "+err.toString());
      return next(err);
    }
    if (!user) {
      console.log("failed to load user");
      return res.redirect('/login');
    }
    req.profile = user;
    console.log("success"+user);
    req.session.user = user;
    res.redirect('/users/'+user._id);
  });

  //res.send(req.body);

};

exports.create = (req, res, next) => {
  const user = new User(req.body);
  user.provider = 'local';
  user.pid = req.body.pid.toString();
  user.password  = req.body.password.toString();
  user.role  = req.body.role.toString();
  user.name  = req.body.name.toString();
  user.dept  = req.body.dept.toString();

  user.save()
    .catch(error => {
      console.log('error : '+error.errors)
      return res.render('pages/login', { errors: error.errors, user: user });
    })
    .then(() => {
      return res.redirect('/login');
    })
    .then(() => {
      return res.redirect('/login');
    })
    .catch(error => {
      return next(error);
    });
};

exports.list = (req, res) => {
  const page = (req.query.page > 0 ? req.query.page : 1) - 1;
  const perPage = 5;
  const options = {
    perPage: perPage,
    page: page,
  };
  let users, count;
  User.list(options)
    .then( result => {
      users = result;
      return User.count();
    })
    .then( result => {
      count = result;
      res.render('pages/user-list', {
        title: 'List of Users',
        users: users,
        page: page + 1,
        pages: Math.ceil(count / perPage)
      });
    })
    .catch(error => {
      return res.render('pages/500',  { errors: error.errors });
    });
};

exports.show = (req, res) => {
  const user = req.profile; console.log("prof: "+req.profile);
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
      res.render('pages/profile', {
        title: 'Tweets from ' + user.name,
        user: user,
        tweets: tweets,
        tweetCount: tweetCount,
        followerCount: followerCount,
        followingCount: followingCount
      });
    })
    .catch(error => {
      return res.render('pages/500',  { errors: error.errors });
    });
};

exports.user = (req, res, next, id) => {
  /*User.findOne({ _id: id }).exec((err, user) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return next(new Error('failed to load user ' + id));
    }
    req.profile = user;
    next();
  });*/

User.findById(req.params.userId)
    .exec(function (error, user) {
      if (error) {
        return next(error);
      } else {
        if (user === null) {
          console.log("findbyid failed to load user");
          var err = new Error('Failed to load user');
          err.status = 400;
          return res.redirect('/login');
        } else {
          console.log("findbyid success");
          req.profile = user;
          next();
        }
      }
    });  
};

exports.showFollowers = (req, res) => {
  showFollowers(req, res, 'followers');
};

exports.showFollowing = (req, res) => {
  showFollowers(req, res, 'following');
};

function showFollowers(req, res, type) {
  let user = req.profile;
  let followers = user[type];
  let tweetCount;
  let followingCount = user.following.length;
  let followerCount = user.followers.length;
  let userFollowers = User.find({ _id: { $in: followers } }).populate(
    'user',
    '_id name pid role'
  );

  Tweet.countUserTweets(user._id)
    .then( result => {
      tweetCount = result;
      userFollowers.exec((err, users) => {
        if (err) {
          return res.render('pages/500');
        }
        res.render('pages/followers', {
          user: user,
          followers: users,
          tweetCount: tweetCount,
          followerCount: followerCount,
          followingCount: followingCount
        });
      });
    });
}

