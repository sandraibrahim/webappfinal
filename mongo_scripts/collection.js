var MongoClient = require("mongodb").MongoClient;
var url = "mongodb://localhost:27017/";

MongoClient.connect(url, function (err, db) {
  if (err) throw err;
  var dbo = db.db("webappfinal");
  // Create Contacts Collection
  dbo.createCollection("contacts", function (err, res) {
    if (err) throw err;
    console.log("Collection created!");
    db.close();
  });

  // Create Users Collection
  dbo.createCollection("users", function (err, res) {
    if (err) throw err;
    console.log("Collection created!");
    db.close();
  });
});