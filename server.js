var express = require("express"),
	http = require("http"),
	redis = require("redis"),
	mongoose = require("mongoose"),
	app = express(),
	server = http.createServer(app).listen(3000),
	io = require("socket.io").listen(server),
	bodyParser = require("body-parser"),
	users = [],
	currentQuestion = " ",
	currentQuestionId = -1,
	connections = [];

app.use(express.static(__dirname + "/client"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

var redisClient = redis.createClient();
redisClient.on("connect", function() {
	"use strict";
	console.log("Connected to redis");
});
redisClient.set("right", 0);
redisClient.set("wrong", 0);

// connect to the data store in mongo
mongoose.connect("mongodb://localhost/trivia");
var db = mongoose.connection;
db.on("open", function () {
	"use strict";
	console.log("Connected to mongoDB");
});

var triviaSchema = mongoose.Schema( {
	"question" : String,
	"answerId" : Number,
	"answer" : String
});

var Trivia = mongoose.model("Trivia", triviaSchema);

app.get("/", function(req, res) {
	res.send(index.html);
});

io.sockets.on("connection", function(socket) {
	connections.push(socket);
	console.log("Connected sockets: %s", connections.length);

	//new user
	socket.on("newUser", function(data) {
		socket.username = data;
		users.push(socket.username);
		console.dir(socket.username);
		io.sockets.emit("get users", users);
	});

	socket.on("score", function () {
		var score = {};

		redisClient.mget(["right", "wrong"], function(err, result) {
			score.right = value[0];
			score.wrong = value[1];
			io.sockets.emit("updateScore", score);
		});
	});

	socket.on("disconnect", function(data) {
		users.splice(users.indexOf(socket.username), 1);
		console.log("Disconnect socket: %s", socket.username);
		io.sockets.emit("get users", users);
		connections.splice(connections.indexOf(socket), 1);
		console.log("Connected sockets: %s", connections.length);
	});
});

app.get("/questions", function(req, res) {
	Trivia.findOne({}, function(err, trivias) {
		console.log(trivias.question);
		res.json(trivias);
	});
});

app.post("/questions", function (req, res) {
	console.log("INSIDE POST /questions", req.body);
	var newQuestions = new Trivia({"question":req.body.question,
								   "answerId":req.body.answerId,
								   "answer":req.body.answer});

	newQuestions.save(function(err, result) {
		if(err !== null) {
			console.log(err);
			res.send("ERROR");
		}
		else {
			Trivia.find({}, function(err, result) {
				if(err !== null) {
					res.send("ERROR");
				}   
				res.json({result: "Question accepted."});
			});
		}
	});
});

app.post("/answer", function (req, res) {
	var jsonObject,
		answerId,
		answer;

	Trivia.findOne({"answerId":req.body.answerId}, function (err, result) {
		console.log(result.answer);
		if(err !== null) {
			console.log("ERROR");
		}
		else {
			if(req.body.answer === result.answer) {
				var correct = true;
				redisClient.incr("right", function(err, value) {
					if(err) {
						console.log("ERROR");
					}
					else {
						console.log("right: " + value);
					}
				});
			}
			else {
				correct = false;
				redisClient.incr("wrong", function(err, value) {
					if(err) {
						console.log("ERROR");
					}
					else {
						console.log("wrong: " + value);
					}
				});
			}
			return res.json({correct: correct});
		}
	});
});

app.get("/score", function(req, res) {
	var right,
		wrong;

	redisClient.mget(["right", "wrong"], function(err, result) {
		if(err !== null) {
			console.log("ERROR");
		}
		else {
			right = parseInt(result[0], 10) || 0;
			wrong = parseInt(result[1], 10) || 0;
		}
		return res.json({right: right, wrong: wrong});
	});
});

console.log("Server listening on port 3000");