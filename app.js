var express = require('express');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var url = 'mongodb://oly:piv188@ds135946.mlab.com:35946/snakegame';

MongoClient.connect(url, function(err, db) {

    console.log("Connected successfully to server");
    var db = db.db("snakegame");

    //add player to players table
    app.post('/players', function (req, res) {

        var winner = {
            name: req.body.name,
            score: req.body.score
        };
        db.collection('players').insertOne(winner, function (err, result) {
            if(err) {
                return res.sendStatus(500);
            }
            res.send(result.ops[0]);
        });
    });

    //get top 7 players
    app.get('/players', function (req, res) {

        db.collection('players', function(err, collection) {
            if (err) {
                return res.sendStatus(500);
            }
            collection.find().sort([['score', -1]]).limit(7).toArray(function(err, items) {
                res.send(items);
            });
        });
    });

});

app.use('/', express.static(__dirname + '/'));

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});
app.listen(3000, function () {
    console.log('Game app listening on port 3000!');
});