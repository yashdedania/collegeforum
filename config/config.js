const path = require("path");
const rootPath = path.normalize(__dirname + "/..");
const DB = process.env.DB;
const clientID = process.env.GITHUB_CLIENT_ID;
const clientSecret = process.env.GITHUB_CLIENT_SECRET;


module.exports = {
  development: {
    db: "mongodb://localhost/ntwitter",
    root: rootPath,
    app: {
      name: "Node Twitter"
    }
  },
  test: {
    db: "mongodb://vide:videbuki0@ds217131.mlab.com:17131/demo909",
    root: rootPath,
    app: {
      name: "Nodejs Express Mongoose Demo"
    }
  },
  production: {
    db: DB,
    root: rootPath,
    app: {
      name: "Nodejs Express Mongoose Demo"
    }
  }
};
