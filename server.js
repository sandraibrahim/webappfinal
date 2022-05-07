// Dependencies
var express = require('express');
var connect = require("connect");
var logger = require("morgan");
var http = require("http");
const pug = require('pug');
var bodyParse = require("body-parser");

// Mongo Database
var MongoClient = require("mongodb").MongoClient;
var url = "mongodb://localhost:27017/";
var ObjectId = require('mongodb').ObjectID;
const bcrypt = require("bcrypt");

// Geocoding
const NodeGeocoder = require('node-geocoder');
const { response } = require('express');
const options = {
  provider: 'mapbox',
  apiKey: 'sk.eyJ1Ijoic2FuZHJhaWJyYWhpbSIsImEiOiJjbDI2djVrbTcwMnFpM29vN2N4eXdjNnl3In0.huPqSRQ9XL6oDZfJm6W0Aw',
};
const geocoder = NodeGeocoder(options);

// Express App Setup
var app = express();
const port = 8080;
const host = 'localhost';
const oneDay = 1000 * 60 * 60 * 24;
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
app.use(sessions({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false
}));
app.use(bodyParse.json() );       // to support JSON-encoded bodies
app.use(bodyParse.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

// Location and Template type.
app.set('views', './public');
app.set('view engine', 'pug');

// User Session
var session;

app.get('/mailer', (req, res, next) => {
	res.render('mailer');
});

app.get('/contacts', (req, res, next) => {
    session=req.session;
    if(session && session.userid == "cmps369"){
        MongoClient.connect(url, function (err, db) {
            if (err) throw err;
            var dbo = db.db("webappfinal");
            dbo
                .collection("contacts")
                .find({})
                .toArray(function (err, allcontacts) {
                    if (err) throw err;
                    db.close();
                    res.render("contacts", { contact_array: allcontacts });
                });
        });

    }else{
        res.render("login", { status_message: "User not authorized. :("});
    }
});

app.get('/login', (req, res, next) => {
	res.render('login');
});

app.get('/register', (req, res, next) => {
	res.render('register');
});

app.post('/thanks', (req, res) => {
	// Get Form Data.
    let contact_obj = {
        prefix: req.body.prefix,
        fname: req.body.fname,
        lname: req.body.lname,
        street: req.body.street,
        city: req.body.city,
        state: req.body.state,
        zip: req.body.zip,
        phone: req.body.phone,
        email: req.body.email,
        con_phone: req.body.con_phone,
        con_mail: req.body.con_mail,
        con_email: req.body.con_email,
        con_any: req.body.con_any,
    };
  
    // Get Geolocation
    let curr_address = contact_obj.street + " " + contact_obj.city + " " + contact_obj.state + " " + contact_obj.zip;

    // Library Call 
    geocoder.geocode(curr_address, function(err, res){

        // Get lat and long from obj
        let lat = res[0].latitude;
        let long = res[0].longitude;

        // Add Coords to contact.
        contact_obj.lat = lat;
        contact_obj.long = long;

    }).then(function(){
        //Print to Console to make sure it is correct

        // Store contact in database
        MongoClient.connect(url, function (err, db) {
            if (err) throw err;
            var dbo = db.db("webappfinal");
            dbo.collection("contacts").insertOne(contact_obj, function (err, res) {
                if (err) throw err;
                console.log("1 document inserted");
                db.close();
            });
        });

        // Redirecting.
        res.render("thanks", contact_obj);
    });
});

app.post('/edit', (req, res, next) => {
    // Retrieve ID from the form and convert to ObjectId for query
    let id = ObjectId(req.body.id);

    // Query Database for all customer information
    MongoClient.connect(url, function(err, db) {
        if (err) throw err; 
        var dbo = db.db("webappfinal");
        var query = { _id: id };
        dbo.collection("contacts").find(query).toArray(function(err, result) {
            if (err) throw err;
            db.close();
            res.render("edit", { contact_info: result[0]});
        });
      
    });
});

app.post('/update', (req, res, next) => {
    // Build query and update object.
    let id = ObjectId(req.body.id);
    var query = { _id: id };
    var updatedObject = {
        prefix: req.body.prefix,
        fname: req.body.fname,
        lname: req.body.lname,
        street: req.body.street,
        city: req.body.city,
        state: req.body.state,
        zip: req.body.zip,
        phone: req.body.phone,
        email: req.body.email,
        con_phone: req.body.con_phone,
        con_mail: req.body.con_mail,
        con_email: req.body.con_email,
        con_any: req.body.con_any,
    };

    // Get Geolocation
    let curr_address = updatedObject.street + " " + updatedObject.city + " " + updatedObject.state + " " + updatedObject.zip;

    // Library Call 
    geocoder.geocode(curr_address, function(err, geores){

        // Get lat and long from obj
        let lat = geores[0].latitude;
        let long = geores[0].longitude;

        // Add Coords to contact.
        updatedObject.lat = lat;
        updatedObject.long = long;

    }).then(function(){
        MongoClient.connect(url, function(err, db) {
            if (err) throw err;
            var dbo = db.db("webappfinal");
            var newValues = { $set: updatedObject };

            dbo.collection("contacts").updateOne(query, newValues, function(err, response) {
              if (err) throw err;
              console.log("1 document updated");
              db.close();
              res.redirect("/contacts");
            });
          });
    });
});

app.post('/delete', (req, res, next) => {
    // Retrieve ID from the form and convert to ObjectId for query
    let id = ObjectId(req.body.id);
    
    // Query Database for all customer information
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("webappfinal");
        var query = { _id: id };
        dbo.collection("contacts").deleteOne(query, function(err, obj) {
          if (err) throw err;
          console.log("1 document deleted");
          db.close();
          res.redirect("/contacts");
        }); 
    });
});

app.post('/login', (req, res, next) => {
    // Get Form Data.
    let user = req.body.username;
    let pass = req.body.password;

    // Search for User.
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db("webappfinal");
        dbo
            .collection("users")
            .find({username: user})
            .toArray(function (err, results) {
                if (err) throw err;
                db.close();

                // Check if user exists
                if (results.length == 0){
                    res.render("login", { status_message: "Username does not exist. :("});
                    return;
                }

                // Make sure password is same.
                bcrypt.compare(pass, results[0].password, function(err, result) {
                    if (result) {
                        // Passwords match
                        session=req.session;
                        session.userid=user;

                        console.log(session);

                        // Redirect to contacts.
                        res.redirect("/contacts");
                    } else {
                        // Passwords don't match
                        res.render("login", { status_message: "Incorrect Password. :("});
                        return;
                    }
                  });
            });
        });    
});

app.post('/register', (req, res, next) => {
    // Get Form Data
    let user = req.body.username;
    let pass = req.body.password;
    let confirmpass = req.body.confirmpassword;

    // Validate Form Data
    if(pass != confirmpass){
        res.render("register", { status_message: "Passwords do not match. :("});
        return;
    }

    // Search Database to see if username in use
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db("webappfinal");
        dbo
            .collection("users")
            .find({username: user})
            .toArray(function (err, results) {
                if (err) throw err;
                db.close();

                // Validate Unique Credentials
                if (results.length != 0){
                    res.render("register", { status_message: "Username is already in use. :("});
                    return;
                }

                // Hash Password
                bcrypt.hash(pass, 10, function(err, hash) {
                    // Store in Database
                    MongoClient.connect(url, function (err, db) {
                        if (err) throw err;
                        var dbo = db.db("webappfinal");
                        dbo.collection("users").insertOne({username:user, password:hash}, function (err, response) {
                            if (err) throw err;
                            console.log("1 User inserted");
                            db.close();

                            status_message = "User successfully created! :)";
                            res.render("login", { status_message: "User successfully created!"});
                            return;
                        });
                    });
                
                });   
            });
        });
});

app.get('/logout',(req,res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err)
            return next(err)
        }

        return res.redirect("/login");
    })
    
    
});

// Routing
app.get('*', (req, res, next) => {
	res.status(200).send('Sorry, page not found');
	next();
});

app.listen(port, () => {
	console.log(`Server started at port ${port}`);
});
