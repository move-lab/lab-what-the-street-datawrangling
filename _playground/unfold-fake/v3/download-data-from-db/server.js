var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var _ = require('underscore');
var path = require("path");

var mongojs = require('mongojs');


// Here we find an appropriate database to connect to, defaulting to
// localhost if we don't find one.  
var MONGOCONNECTION = 
  process.env.MONGOLAB_URI || 
  process.env.MONGOHQ_URL || 
  'mongodb://root:BfgD0KdI8yTN@52.213.47.165:27017/berlin_derived?authSource=admin';
var db = mongojs(MONGOCONNECTION);
// // CHANGE THE NAME OF THE DATABASE!!!
var PROJECTDB = db.collection('streets');


app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 
// app.use(express.json());       // to support JSON-encoded bodies
// app.use(express.urlencoded()); // to support URL-encoded bodies

function mongoError(res, err) {
    if (err) console.error('mongo error ->', err);
    return res.status(500).send('internal server error')
};

// function findAll(collection, query, res) {
//   collection.find(
//     //query, {"limit": 1000}, function(err, docs) {
//     query, {}, function(err, docs) {
//       if (err) { return mongoError(res, err); };
//       // if nothing is found (doc === null) return empty array
//       res.send(docs === null ? [] : docs);
//     }
//   );
// };

app.use('/', express.static('static'));


// make sure to change the name of the db
app.get('/api/projectdb', function(req, res) {
    PROJECTDB.find({}, {}, {}, function(err, docs) {
      if (err) { return mongoError(res, err); };
      // if nothing is found (doc === null) return empty array
      res.send(docs === null ? [] : docs);
    }
  );
});


// A post
app.post('/static/mypost', function(req, res) {
    // res.send('Username: ' + req.body);
    console.log(req.body.username)
    // res.send({ status: 'SUCCESS' });
    // res.end('It worked!');
    res.sendFile(__dirname+'/static/page1/index.html');
});


app.get('/static/page1', function (req, res) {
  // res.send('Hello World!');
  res.sendFile(__dirname+'/static/page1/index.html');
});

app.get('/static/page2', function (req, res) {
  // res.send('Hello World!');
  res.sendFile(__dirname+'/static/page2/index.html');
});


app.set('port', (process.env.PORT || 5000));
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
