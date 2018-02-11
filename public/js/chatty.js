"use strict";

$(() => {
	const socket = io();
	const loginArea = $("#loginArea");
	const loginForm = $("#loginForm");
	const loginField = $("#loginField");

	const chatArea = $("#chatArea");
	const chatForm = $("#chatForm");
	const chatField = $("#chatField");

	const loginSignout = $("#loginSignout");
	const chatTrail = $("#chatTrail");
	const whoseOnline = $("#whoseOnline");
	const onlineCount = $("#onlineCount");
	const eraserIcon = $("#eraserIcon");

	let _socketLogin = event => {
		event.preventDefault();
		socket.emit("new login", loginField.val(), flag => {
			if (flag) {
				loginArea.hide();
				chatArea.css("display", "flex");
			}
		});
		let html = "Not <strong>" + loginField.val() + "</strong>? Sign Out";
		loginSignout.html(html);
		loginField.val("");
		return false;
	};

	//Handle login form submit 1 of 2: pressing enter key
	loginForm.keypress(event => {
		const ENTER_KEY = 13;
		if (event.which === ENTER_KEY) {
			_socketLogin(event);
		}
	});

	//Handle login form submit 2 of 2: clicking submit button
	loginForm.submit(event => {
		_socketLogin(event);
	});

	let _socketMessage = event => {
		event.preventDefault();
		socket.emit("new message", chatField.val());
		chatField.val("");
		return false;
	};

	//Handle chat form submit 1 of 2: pressing enter key
	chatForm.keypress(event => {
		const ENTER_KEY = 13;
		if (event.which === ENTER_KEY) {
			_socketMessage(event);
		}
	});

	//Handle chat form submit 2 of 2: clicking submit button
	chatForm.submit(event => {
		_socketMessage(event);
	});

	//clear chat trail when logout
	loginSignout.on("click", () => {
		chatTrail.html("");
	});

	//clear chat trail when user clicks eraser icon
	eraserIcon.on("click", () => {
		chatTrail.html("");
	});

	//write message item
	socket.on("new message", (message, username) => {
		chatTrail.prepend($("<hr>"));
		chatTrail.prepend(
			$('<h6 class="card-subtitle mb-2 text-muted"></h6>').text(message)
		);
		chatTrail.prepend($('<h5 class="card-title"></h5>').text(username));
	});

	//update online COUNT
	socket.on("get count", data => {
		let count = data;
		let html = "";
		html =
			"Online  <span class='badge badge-pill badge-success'>" +
			count +
			"</span>";
		onlineCount.html(html);
	});

	//update online ROSTER
	socket.on("get logins", data => {
		let roster = data;
		let html = "";
		for (let i = 0; i < data.length; i++) {
			html +=
				"<a href='#' class='list-group-item list-group-item-action flex-column align-items-start'> <div class='d-flex w-100 justify-content-between'> <h5 class='mb-1'>" +
				roster[i] +
				"</h5> </div> </a>";
		}
		whoseOnline.html(html);
	});
});
