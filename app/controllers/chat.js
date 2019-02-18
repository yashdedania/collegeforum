const createPagination = require('./analytics').createPagination;
const mongoose = require('mongoose');
const Activity = mongoose.model('Activity');
const Chat = mongoose.model('Chat');
const User = mongoose.model('User');
const logger = require('../middlewares/logger');

var Filter = require('bad-words');
var filter = new Filter();

exports.chat = (req, res, next, id) => {
  Chat.load(id, (err, chat) => {
    if (err) {
      return next(err);
    }
    if (!chat) {
      return next(new Error('Failed to load chat' + id));
    }
    req.chat = chat;
    next();
  });
};

exports.index = (req, res) => {
  // so basically this is going to be a list of all chats the user had till date.
  const page = (req.query.page > 0 ? req.query.page : 1) - 1;
  const perPage = 10;
  const options = {
    perPage: perPage,
    page: page,
  };
  let users, count, pagination;
  User.list(options)
    .then( result => {
      users = result;
      return User.count();
    })
    .then( result => {
      count = result;
      pagination = createPagination(req, Math.ceil(result / perPage), page+1);
      res.render('chat/index', {
        title: 'Chat User List',
        users: users,
        page: page + 1,
        pagination: pagination,
        pages: Math.ceil(count / perPage)
      });
    })
    .catch(error => {
      return res.render('pages/500', { errors: error.errors });
    });
};


exports.show = (req, res) => {
  res.send(req.chat);
};

exports.getChat = (req, res) => {
  const options = {
    criteria: {'receiver': req.params.userid}
  };
  let chats;
  Chat.list(options)
    .then(result => {
      chats = result;
      res.render('chat/chat', {chats: chats});
    });
};

exports.create = (req, res) => {

  if (filter.clean(req.body.body).includes("***")){
    res.render('pages/3003', {error: "Curse words detected !"});
  }else{
    const chat = new Chat({
      message: req.body.body,
      receiver: req.body.receiver,
      sender: req.session.user._id,
    });
    logger.info('chat instance', chat);
    chat.save( (err) => {

      const activity = new Activity({
        activityStream: 'sent a message  "'+req.body.body+'"  to ',
        activityKey: chat.id,
        receiver: req.body.receiver,
        sender: req.session.user._id,
      });
      activity.save((err) => {
        if (err) {
          logger.error(err);
          res.render('pages/500');
        }
      });
      logger.error(err);
      if (!err) {
        res.redirect(req.header('Referrer'));
      }
    });
  }

};

exports.admin_msg = (req, res) => {

  User.findById(req.params.adm_id)
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

            const chat = new Chat({
              message: "Your resource "+req.params.adm_file+" have been deleted by the Admin",
              receiver: user,
              sender: req.session.user._id,
            });
            logger.info('chat instance', chat);
            chat.save( (err) => {

              logger.error(err);
              if (!err) {
                res.redirect('/resources');
              }
            });

          }
        }
      }); 

};
