var main = function (triviaObjects) {
	"use strict";

	var socket = io.connect("http://localhost:3000"),
		answerId = 1,
		usersList = [];

	var TriviaViewModel = {
		username: ko.observable(" "),
		displayQuestion: ko.observable(),
		correctPoints: ko.observable(0),
		wrongPoints: ko.observable(0),
		userList: ko.observableArray()
	};

	ko.applyBindings(TriviaViewModel);

	var updateScore = function (socket) {
		socket.on("updateScore", function(data) {
			$("#correct-score").remove();
			$("#wrong-score").remove();
			$("#right").prepend('<div class="value" id="correct-score">' + data.right + '</div>');
			$("#wrong").prepend('<div class="value" id="wrong-score">' + data.wrong + '</div>');
		});
	};

	var updatePlayers = function (socket) {
		socket.on("get users", function(data) {
			TriviaViewModel.userList([]);
			for (var i = 0; i < data.length; i++) {
				TriviaViewModel.userList.push(data[i].username);
			}
		});
	};

	$("#game").hide();
	$("#question").hide();
	$("#score").hide();

	$("#login").on("click", function(event) {
		event.preventDefault();
		var username = TriviaViewModel.username();
		var existingUser = false;

		for(var i = 0; i < usersList.length; i++) {
			if (usersList[i].username == username) {
				$("#existing-user").text("Sorry, that username is not available.");
				existingUser = true;
			}
		}

		if(!existingUser)
		{
			$("#users").show();
			$("#trivia-game h2 span").html("Welcome " + username);
			socket.emit("newUser", {username: TriviaViewModel.username()});
		}
		$("#username").val("");
	});

	$("#game-tab").on("click", function(event) {
		event.preventDefault();
		$("#trivia-header").hide();
		$("#game").show();
		$("#question").hide();
		$("#score").hide();
	});

	$("#question-tab").on("click", function(event) {
		event.preventDefault();
		$("#trivia-header").hide();
		$("#game").hide();
		$("#question").show();
		$("#score").hide();
	});

	$("#score-tab").on("click", function(event) {
		event.preventDefault();
		$("#trivia-header").hide();
		$("#game").hide();
		$("#question").hide();
		$("#score").show();
	});

	var getQuestion = function() {
		$.get("/questions", function(data) {
			console.log(data);
			if(data) {
				$("#question-retrieved").html(data.question);
				answerId = data.answerId;
			}
			else {
				console.log("There is no question in the database.");
			}
		});
	};

	$("#getQuestionButton").on("click", function() {
		getQuestion();
	});

	var getAnswer = function() {
		var jsonData,
			result;

		if($("#answer").val() !== " ") {
			jsonData = JSON.stringify({answer:answer, answerId:answerId});
		}

		$.ajax({
			type: "POST",
			url: "/answer",
			dataType: "json",
			data: jsonData,
			success: function(response) {
				console.log(response);
				result = response.correct ? "True":"False";
				$("#getAnswer").html(result);
			},
			contentType: "application/json"
		});
		$("#answer").val("");
	};

	$("#getAnswerButton").on("click", function() {
		getAnswer();
	});

	$("#getAnswerButton").on("keypress", function(event) {
		if(event.keyCode === 13) {
			getAnswer();
		}
	});

	var makeUpQuestion = function() {
		var qstn = $("#makeQuestion").val(),
			ans = $("#createAnswer").val(),
			jsonData = JSON.stringify({question:qstn, answer:ans});

		$.ajax({
			type: "POST",
			url: "/questions",
			dataType: "json",
			data: jsonData,
			success: function(response) {
				console.log(response);
			},
			contentType: "application/json"
		});
	};

	$("#submitQuestion").on("click", function() {
		makeUpQuestion();
	});

	$("#submitQuestions").on("keypress", function(event) {
		if(event.keyCode === 13) {
			makeUpQuestion();
		}
	});

	var getScore = function() {
		$.ajax({
			type: "GET",
			url: "/score",
			dataType: "json",
			success: function(response) {
				console.log(response);
				$("#correcScore").append("Right: " + response.right);
				$("#wrongScore").append("Wrong: " + response.wrong);
			}
		});
	};

	$("#getTotalScore").on("click", function() {
		getScore();
	});

	//updateScore(socket);
	updatePlayers(socket);
};

$(document).ready(main);