const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const utils = require("../../lib/utils");

// News Schema
const NewsSchema = new Schema({
  body: { type: String, default: "", required: true, trim: true, maxlength: 280},
  user: { type: Schema.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now, required: true }
});


NewsSchema.methods = {
  uploadAndSave: function(callback) {
    // const imager = new Imager(imagerConfig, "S3");
    const self = this;
    self.save(callback);
  }
};

NewsSchema.statics = {
  load: function(id, callback) {
    this.findOne({ _id: id })
      .populate("user", "name pid role")
      .exec(callback);
  },
  list: function(options) {
    const criteria = options.criteria || {};
    return this.find(criteria)
      .populate("user", "name pid role")
      .sort({ createdAt: -1 })
      .limit(options.perPage)
      .skip(options.perPage * options.page);
  }
};

mongoose.model("News", NewsSchema);