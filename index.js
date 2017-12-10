"use strict";

const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);

const handlebars = require("express-handlebars");
const bodyParser = require("body-parser");
const expressSession = require("express-session");
const redis = require("./lib/redis-lib");

const favicon = require("serve-favicon");
const path = require("path");
const PORT = process.env.PORT || 3000;

//setup handlebars
app.set("views", __dirname + "/views");
app.engine("handlebars", handlebars({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

//setup middleware
app.use(favicon(path.join(__dirname, "public", "favicon.ico")));
console.log(path.join(__dirname, "public", "favicon.ico"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname + "/public"));
// this code may not be useful
// see here for app.use() usage: https://expressjs.com/en/api.html#path-examples
app.use(
	"/socket.io",
	express.static(__dirname + "node_modules/socket.io-client/dist/")
);
//nice to have / do later: store session in redis, not memory
//attaches session data to req.session
//to destroy session: req.session = null
//note: I created a session just for practice
//the session is not explicitly used for any functionality
app.use(
	expressSession({
		name: "chat-session",
		secret: "secret sauce", // normally this is secret
		saveUninitialized: true,
		resave: true,
		cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
	})
);

//register routes
app.get("/", (req, res) => {
	console.log("In route........................");
	//learn about the session here
	// if (req.session) {
	// 	console.log("session = " + req.session);
	// 	console.log("session id = " + req.sessionID);
	// 	console.log("session's cookie = " + req.session.cookie);
	// } else {
	// 	console.log("no session");
	// }
	res.render("results", {});
});

io.on("connection", socket => {
	console.log("In socket ........................");
	console.log("CONNECTION: username = " + socket.username);
	socket.on("disconnect", () => {
		console.log("--> DISCONNECTION: username = " + socket.username);

		//handle scenario when user refresh at login screen and no one is logged on. (specifically this handles deprecated redis call for zrem with undefined key)
		if (socket.username !== undefined) {
			redis
				.removeSortedItem("whoseOnline", socket.username)
				.then(data => {
					console.log(
						"result of promise removeSortedItem, num username removed = " + data
					);
					console.log(
						"in promise removeSortedItem, username = " + socket.username
					);
					return Promise.all([
						redis.getCount("whoseOnline"),
						redis.getSortedItems("whoseOnline")
					]);
				})
				.then(data => {
					let onlineCount = data[0];
					let whoseOnline = data[1];
					io.emit("get count", onlineCount);
					io.emit("get logins", whoseOnline);
				})
				.catch(err => {
					console.log(err);
				});
		}
	});

	socket.on("new login", (data, callback) => {
		callback(true);
		socket.username = data;
		console.log("NEW LOGIN: username = " + socket.username);
		redis
			.addSortedItem("whoseOnline", socket.username)
			.then(data => {
				console.log(
					"result of promise addSortedItem, num username added = " + data
				);
				return Promise.all([
					redis.getCount("whoseOnline"),
					redis.getSortedItems("whoseOnline")
				]);
			})
			.then(data => {
				let onlineCount = data[0];
				let whoseOnline = data[1];
				console.log("whoseOnline[] = ", whoseOnline);
				io.emit("new login", socket.username);
				io.emit("get logins", whoseOnline);
				io.emit("get count", onlineCount);
			})
			.catch(err => {
				console.log(err);
			});
	});

	socket.on("new message", data => {
		let message = data;
		console.log("NEW MESSAGE: from username = " + socket.username);
		io.emit("new message", message, socket.username);
	});
});

server.listen(PORT, () => {
	console.log(`Listening on localhost:${PORT}`);
});
