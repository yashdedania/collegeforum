
/**
 * Generic require login routing middlewares
 */

exports.requiresLogin = (req, res, next) => {
  console.log('authorization requireslogin');
  if (req.session) {
    next();
  }else{
    console.log("failed requiresLogin");
    return res.redirect('/login');
  }

  /*User.findById(req.session.userId)
    .exec(function (error, user) {
      if (error) {
        return next(error);
      } else {
        if (user === null) {
          var err = new Error('Not authorized! Go back!');
          err.status = 400;
          return res.redirect('/login');
        } else {
          next();
        }
      }
    });*/ 
};

/**
 * User authorization routing middleware
 */

exports.user = {
  hasAuthorization: (req, res, next) => {
    if (req.profile.id != req.session.user._id) {
      console.log("failed hasAuth");
      return res.redirect('/users'+req.profile.id);
    }
    next();
  }
};

exports.tweet = {
  hasAuthorization: (req, res, next) => {
    if(req.session.user.role == "admin"){
      next();
    }else{
       if (req.tweet.user._id != req.session.user._id) {
        return res.redirect('/tweets'+req.tweet.id);
      }
      next();     
    }

  }
};


/**
 * Comment authorization routing middleware
 */

exports.comment = {
  hasAuthorization: (req, res, next) => {
    // if the current user is comment owner or article owner
    // give them authority to delete
    if (req.session.user._id === req.comment.user._id || req.session.user._id === req.article.user._id || req.session.user.role=="admin") {
      next();
    } else {
      req.flash('info', 'You are not authorized');
      res.redirect('/articles/' + req.article.id);
    }
  }
};
