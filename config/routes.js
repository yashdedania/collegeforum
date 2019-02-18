const express = require('express');
const router = express.Router();
const log = require('./middlewares/logger');

const users = require("../app/controllers/users");
const apiv1 = require("../app/controllers/apiv1");
const chat = require('../app/controllers/chat');
const analytics = require("../app/controllers/analytics");
const tweets = require("../app/controllers/tweets");
const comments = require("../app/controllers/comments");
const favorites = require("../app/controllers/favorites");
const follows = require("../app/controllers/follows");
const activity = require('../app/controllers/activity');
const resources = require('../app/controllers/resources');
const news = require('../app/controllers/news');
const events = require('../app/controllers/events');
const bodyParser  = require('body-parser');
const sanitize = require("sanitize-filename");

const session = require('express-session');
var fs = require('fs');
var url = require('url');

const TEMPDIR = __dirname + '/../public/temp/';
const UPLOADDIR = __dirname + '/../public/files/';

const multer  = require('multer');
const mupload = multer({ dest: UPLOADDIR });

const path = require("path");

module.exports = (app, auth) => {

  //app.use(express.static(config.root + "/public"));

  app.use("/", router);
  //app.use('/css', express.static(__dirname + '/../justlogin/templateLogReg/css/'));

app.use(session({
  secret: 'workhard',
  resave: true,
  saveUninitialized: false
}));
  
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true
  }));

  /**
   * Main unauthenticated routes
   */

  //router.get("/login", users.login); 

  router.get('/', function (req, res) {
    console.log('home route');
    res.redirect('/login');
  }); 

  router.post("/users", users.create);
  router.get('/login', function (req, res, next) {
    if (req.session.user !== undefined){
      res.redirect('/users/'+req.session.user._id);
    }else{
      return res.sendFile(path.join(__dirname + '/../public/index.html'));
    }
  }); 
  //router.get("/signup", users.signup);

  /**
   * API routes
   */
  router.get("/apiv1/tweets", apiv1.tweetList);
  router.get("/apiv1/users", apiv1.usersList);

   router.post('/users/checklogin', users.checklogin); 

  /**
   * Authentication middleware
   * All routes specified after this middleware require authentication in order
   * to access
   */
  router.use(auth.requiresLogin)
  /**
   * Analytics logging middleware
   * Anytime an authorized user makes a get request, it will be logged into
   * analytics
   */
  router.get("/*", log.analytics)

  /**
   * Acivity routes
   */
  router.get("/activities", activity.index);
  /**
   * Home route
   */
  //router.get("/", tweets.index);
  
  /**
   * User routes
   */

  router.get("/users/:userId", tweets.index);
  router.get("/users/profile/:userId", users.show);
  router.get("/users/:userId/followers", users.showFollowers);
  router.get("/users/:userId/following", users.showFollowing);
  router.post("/users/:userId/follow", follows.follow);
  router.param("userId", users.user);

  router.get("/logout", users.logout);

  /**
   * User resources
   */

  router.get('/resources', resources.display);

router.get('/deleteFile/:file', function(req, res){
var targetPath = UPLOADDIR+req.param("file");
    
     fs.unlink(targetPath,function(err) {
       if(err) {
        res.send("Error to delete file: "+err);
        } else {
          if(req.session.user.role == "admin" && req.session.user._id.toString() != req.param("file").split("_id_")[3]){
              res.redirect('/chats/admin_msg/'+req.param("file").split("_id_")[3]+"/"+req.param("file").split("_id_")[4])
            }else{
              res.send("Files Deleted Successfully");
            }
        }
     })
  
});

router.get('/filelist', function(req, res) {
fs.readdir(UPLOADDIR,function(err, list) {
       if(err)
         throw err;
     res.render('pages/filelist',{fileList:list});
     });

});
router.get('/filelist_event', function(req, res) {
fs.readdir(UPLOADDIR,function(err, list) {
       if(err)
         throw err;
     res.render('pages/filelist_event',{fileList:list});
     });

});

router.post('/fileUpload', mupload.single('uploadfile'), function(req, res) {
console.log('file upload req : '+req.file.filename+' text: '+sanitize(req.body.myDescp));  
  var targetPath = UPLOADDIR+req.session.user.dept+'_id_'+req.session.user.name+'_id_'+req.session.user.pid+'_id_'+req.session.user._id+'_id_'+req.body.myDescp+"_id_"+req.session.user.role+"_id_"+req.file.originalname;
  var tempPath = req.file.path;
   fs.rename(tempPath, targetPath, function(err) {
     if(err) { 
        //res.send("Error found to upload file "+err);
        var msg = "Error found to upload file "+err;
        var type="error"; 
     } else {
        //res.send("<b>File uploaded to "+targetPath+" ("+req.file.size +" bytes)</b>");
        var fileSize = req.file.size/1024;
        var msg = "File uploaded to "+targetPath+" ("+(fileSize.toFixed(2)) +" kb)";
        var type="success";
        if (req.session.user.role == "commitee"){
          res.redirect('/events');
        }else{
          res.redirect('/resources');
        }
        
     }
    
  });
});

  /**
   * News routes
   */

   router.get('/news', news.display);
   router.post('/news/add', news.create);
  router.route("/news/:nid")
    .post(news.update)
    .delete(news.destroy)

  //outer.param("id", news.news);

    /**
   * Events routes
   */

   router.get('/events', events.display);

  /**
   * Chat routes
   */
  router.get('/chat', chat.index);
  router.get('/chat/:id', chat.show);
  router.get('/chat/get/:userid', chat.getChat);
  router.post('/chats', chat.create);

  router.get('/chats/admin_msg/:adm_id/:adm_file', chat.admin_msg);
  /**
  * Analytics routes
  */
  router.get("/analytics", analytics.index);

  /**
   * Tweet routes
   */
  router.route("/tweets")
    .get(tweets.index)
    .post(tweets.create)

  router.route("/tweets/:id")
    .post(auth.tweet.hasAuthorization, tweets.update)
    .delete(auth.tweet.hasAuthorization, tweets.destroy)

  router.param("id", tweets.tweet);

  /**
   * Comment routes
   */
  router.route("/tweets/:id/comments/")
    .post(comments.create)

  router.route("/tweets/:id/comments/:cid")
    .post(comments.update)
    .get(comments.update)
    .delete(comments.destroy)

    router.param("cid", comments.load);

  /**
   * Upvote routes
   */
   router.get('/tweets/:id/upvote', tweets.upvote);
   router.get('/tweets/:id/downvote', tweets.downvote);

  /**
   * Bookmark routes
   */
   router.get('/bookmarks', tweets.showbookmarks);
  router.get("/tweets/:id/bookmark", tweets.addbookmark);

  /**
   * Page not found route (must be at the end of all routes)
   */
  router.use((req, res) => {
    res.status(404).render("pages/404", {
      url: req.originalUrl,
      error: "Not found"
    });
  });
};
