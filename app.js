"use strict";

const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io").listen(server);

const handlebars = require("express-handlebars");
const bodyParser = require("body-parser");
const redis = require("./lib/redis-lib");

const favicon = require("serve-favicon");
const path = require("path");

//setup handlebars
app.set("views", __dirname + "/views");
app.engine("handlebars", handlebars({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

//setup middleware
app.use(favicon(path.join(__dirname, "public", "favicon.ico")));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname + "/public"));
app.use(
  "/socket.io",
  express.static(__dirname + "node_modules/socket.io-client/dist/")
);

// ----------------------------------------
// Sessions/Cookies
// ----------------------------------------
var cookieSession = require("cookie-session");

app.use(
  cookieSession({
    name: "session",
    keys: ["secretsauce123"],
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  })
);

app.use((req, res, next) => {
  res.locals.session = req.session;
  res.locals.currentUser = req.session.currentUser;
  next();
});
// ----------------------------------------

//register routes
app.get("/", (req, res) => {
  res.render("results", {});
});

io.on("connection", socket => {
  socket.on("disconnect", () => {
    if (socket.username === undefined) {
      console.log("--> DISCONNECTION: browser potentially closed");
    } else {
      console.log("--> DISCONNECTION: username = " + socket.username);
    }

    //handle scenario when user refresh at login screen and no one is logged on. (specifically this handles deprecated redis call for zrem with undefined key)
    if (socket.username !== undefined) {
      redis
        .removeSortedItem("whoseOnline", socket.username)
        .then(data => {
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
    redis
      .addSortedItem("whoseOnline", socket.username)
      .then(data => {
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
    io.emit("new message", message, socket.username);
  });
});

// ----------------------------------------
// Server
// ----------------------------------------
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
