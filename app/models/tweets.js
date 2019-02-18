const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const utils = require("../../lib/utils");

//  Getters and Setters
const getTags = tags => tags.join(",");

const setTags = tags => tags.split(",");

// Tweet Schema
const TweetSchema = new Schema({
  body: { type: String, default: "", trim: true, maxlength: 280},
  user: { type: Schema.ObjectId, ref: "User" },
  comments: [
    {
      body: { type: String, default: "", maxlength: 280},
      user: { type: Schema.ObjectId, ref: "User" },
      commenterName: { type: String, default: "" },
      commenterPicture: { type: String, default: ""},
      createdAt: { type: Date, default: Date.now },
      visible: {type:Number, default: 1}
    },
  ],
  tags: { type: [], get: getTags, set: setTags },
  bookmarks: [{ type: Schema.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
  upvotes : [{ type: Schema.ObjectId, ref: "User" }],
  downvotes : [{ type: Schema.ObjectId, ref: "User" }],
  tot_upvotes : {type:Number, default: 0},
  tot_downvotes : {type:Number, default: 0}
}, {usePushEach: true});


// Validations in the schema
TweetSchema.path("body").validate(
  body => body.length > 0,
  "Tweet body cannot be blank"
);

TweetSchema.methods = {
  uploadAndSave: function(images, callback) {
    // const imager = new Imager(imagerConfig, "S3");
    const self = this;
    if (!images || !images.length) {
      return this.save(callback);
    }
    imager.upload(
      images,
      (err, cdnUri, files) => {
        if (err) {
          return callback(err);
        }
        if (files.length) {
          self.image = { cdnUri: cdnUri, files: files };
        }
        self.save(callback);
      },
      "article"
    );
  },
  addComment: function(user, comment, cb) {
    if (user.pid) {
      this.comments.push({
        body: comment.body,
        user: user._id,
        commenterName: user.name + ',  ' +user.pid,
        //commenterPicture: user.github.avatar_url,
      });
      this.save(cb);
    } else {
      this.comments.push({
        body: comment.body,
        user: user._id,
        commenterName: user.name + ',  ' + user.pid,
        //commenterPicture: user.github.avatar_url,
      });

      
      this.save(cb);
    }
  },

  removeComment: function(commentId, cb) {
    let index = utils.indexof(this.comments, { _id: commentId });
    if (~index) {
      this.comments.splice(index, 1);
    } else {
      return cb("not found");
    }
    this.save(cb);
  },

  updateComment: function(commentId, new_body, cb) {
    let index = utils.indexof(this.comments, { _id: commentId });
    if (~index) {
      this.comments[index].body = new_body; console.log("comments body : "+this.comments[index]);
    } else {
      return cb("not found");
    }
    this.save(cb);
  },

  addUpvote: function(user, cb) {
    let index1 = this.upvotes.indexOf(user._id);
    let index2 = this.downvotes.indexOf(user._id);
    if (index1 !== -1) {
      //console.log("Voted already");
    } else {
       if(index2 !== -1){

          this.downvotes.splice(index2, 1);
          //this.save(cb);        
       }

      this.upvotes.push(user._id);
      //this.save(cb);     
    }
    this.tot_upvotes = this.upvotes.length;
    this.tot_downvotes = this.downvotes.length;
    this.save(cb);    
  },

  addDownvote: function(user, cb) {
    let index1 = this.upvotes.indexOf(user._id);
    let index2 = this.downvotes.indexOf(user._id);
    if (index2 !== -1) {
      //console.log("Voted already");
    } else {
       if(index1 !== -1){

          this.upvotes.splice(index2, 1);
          //this.save(cb);        
       }

      this.downvotes.push(user._id);
      //.save(cb);     
    }

    this.tot_upvotes = this.upvotes.length;
    this.tot_downvotes = this.downvotes.length;
    this.save(cb);   
  },

  addBookmark: function(user, cb){
    let index = this.bookmarks.indexOf(user._id);
    if(index === -1){
      this.bookmarks.push(user._id);
    }else{
      this.bookmarks.splice(index, 1);
    }
    this.save(cb);
  }       
};

// ## Static Methods in the TweetSchema
TweetSchema.statics = {
  // Load tweets
  load: function(id, callback) {
    this.findOne({ _id: id })
      .populate("user", "name pid role")
      .populate("comments.user")
      .exec(callback);
  },
  // List tweets
  list: function(options) {
    const criteria = options.criteria || {};
    return this.find(criteria)
      .populate("user", "name pid role")
      .sort({ tot_upvotes: -1, tot_downvotes: 1, createdAt: -1 })
      .limit(options.perPage)
      .skip(options.perPage * options.page);
  },
  // List tweets
  limitedList: function(options) {
    const criteria = options.criteria || {};
    return this.find(criteria)
      .populate("user", "name username")
      .sort({ tot_upvotes: -1, tot_downvotes: 1, createdAt: -1 })
      .limit(options.perPage)
      .skip(options.perPage * options.page);
  },
  // Tweets of User
  userTweets: function(id, callback) {
    this.find({ user: ObjectId(id) }).toArray().exec(callback);
  },

  // Count the number of tweets for a specific user
  countUserTweets: function(id, callback) {
    return this.find({ user: id })
              .count()
              .exec(callback);
  },

  // Count the total app tweets
  countTotalTweets: function() {
    return this.find({})
               .count();
  }
};

mongoose.model("Tweet", TweetSchema);
