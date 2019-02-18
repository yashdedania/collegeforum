const mongoose = require("mongoose");
const Tweet = mongoose.model("Tweet");
const Schema = mongoose.Schema;
const crypto = require("crypto");
const authTypes = ["github"];

// ## Define UserSchema
const UserSchema = new Schema({
  name: String,
  dept: String,
  pid : String,
  role: String,
  email: String,
  username: String,
  provider: String,
  password: String,
  hashedPassword: String,
  salt: String,
  github: {},
  followers: [{ type: Schema.ObjectId, ref: "User" }],
  following: [{ type: Schema.ObjectId, ref: "User" }],
  tweets: Number
}, {usePushEach: true});  

/*UserSchema.virtual("password")
  .set(function(password) {
    this._password = password;
    this.salt = this.makeSalt();
    this.hashedPassword = this.encryptPassword(password);
  })
  .get(function() {
    return this._password;
  });*/

const validatePresenceOf = value => value && value.length;

UserSchema.path("pid").validate(function(pid) {
  if (authTypes.indexOf(this.provider) !== -1) {
    return true;
  }
  return pid.length;
}, "Name cannot be blank");

/*UserSchema.path("email").validate(function(email) {
  if (authTypes.indexOf(this.provider) !== -1) {
    return true;
  }
  return email.length;
}, "Email cannot be blank");

UserSchema.path("username").validate(function(username) {
  if (authTypes.indexOf(this.provider) !== -1) {
    return true;
  }
  return username.length;
}, "username cannot be blank");*/

UserSchema.path("hashedPassword").validate(function(hashedPassword) {
  if (authTypes.indexOf(this.provider) !== -1) {
    return true;
  }
  return hashedPassword.length;
}, "Password cannot be blank");

UserSchema.pre("save", function(next) {
  if (
    !validatePresenceOf(this.password)
  ) {
    next(new Error("Invalid password"));
  } else {
    next();
  }
});

UserSchema.methods = {
  authenticate: function(plainText) {
    return this.encryptPassword(plainText) === this.hashedPassword;
  },

  makeSalt: function() {
    return String(Math.round(new Date().valueOf() * Math.random()));
  },

  encryptPassword: function(password) {
    if (!password) {
      return "";
    }
    return crypto.createHmac("sha1", this.salt).update(password).digest("hex");
  }
};

UserSchema.statics = {
  addfollow: function(id, cb) {
    this.findOne({ _id: id }).populate("followers").exec(cb);
  },
  countUserTweets:  function (id, cb) {
    return Tweet.find({ user: id }).count().exec(cb);
  },
  load: function(options, cb) {
    options.select = options.select || "name pid role";
    return this.findOne(options.criteria).select(options.select).exec(cb);
  },
  list: function(options) {
    const criteria = options.criteria || {};
    return this.find(criteria)
      .populate("user", "pid role")
      .limit(options.perPage)
      .skip(options.perPage * options.page);
  },
  countTotalUsers: function() {
    return this.find({}).count();
  }
};

mongoose.model("User", UserSchema);
