"use strict";

const redis = require("redis");
const client = redis.createClient();

const ORDERING_SCORE = 1; // set all sorted-set values to the same score for alphabetical ordering

//////////////////////
//HASH
//////////////////////

const createMessage = (subkey, field1, value1, field2, value2) => {
	return new Promise((resolve, reject) => {
		client.hmset(subkey, field1, value1, field2, value2, (err, data) => {
			if (err) reject(err);
			resolve(data);
		});
	});
};

//results returned in an array
const getMessage = subkey => {
	return new Promise((resolve, reject) => {
		client.hgetall(subkey, (err, data) => {
			if (err) reject(err);
			resolve(data);
		});
	});
};

const setCounter = (subkey, field, value) => {
	return new Promise((resolve, reject) => {
		client.hset(subkey, field, value, (err, data) => {
			if (err) reject(err);
			resolve(data);
		});
	});
};

//results returned in an array
const getCounter = (subkey, field) => {
	return new Promise((resolve, reject) => {
		client.hvals(subkey, field, (err, data) => {
			if (err) reject(err);
			resolve(data);
		});
	});
};

const incrementCounter = (subkey, field, amount) => {
	return new Promise((resolve, reject) => {
		client.hincrby(subkey, field, amount, (err, data) => {
			if (err) reject(err);
			resolve(data);
		});
	});
};

//////////////////////
//SORTED SETS
//////////////////////

const addSortedItem = (key, item) => {
	return new Promise((resolve, reject) => {
		client.zadd(key, ORDERING_SCORE, item, (err, data) => {
			if (err) reject(err);
			resolve(data);
		});
	});
};

//checks existance
//returns score if exists, else nil
//I've set all scores = 1
//thus just check for score > 0 for existance
const checkSortedItemExists = (key, item) => {
	return new Promise((resolve, reject) => {
		client.zscore(key, item, (err, data) => {
			if (err) reject(err);
			resolve(data);
		});
	});
};

//results returned in an arary
const getSortedItems = key => {
	return new Promise((resolve, reject) => {
		//from 0 to -1 gets *all* items
		client.zrange(key, 0, -1, (err, data) => {
			if (err) reject(err);
			resolve(data);
		});
	});
};

const getCount = key => {
	return new Promise((resolve, reject) => {
		client.zcount(key, ORDERING_SCORE, ORDERING_SCORE, (err, data) => {
			if (err) reject(err);
			resolve(data);
		});
	});
};

const removeSortedItem = (key, member) => {
	return new Promise((resolve, reject) => {
		client.zrem(key, member, (err, data) => {
			if (err) reject(err);
			resolve(data);
		});
	});
};

//////////////////////
//SETS
//////////////////////

const addItem = (key, item) => {
	return new Promise((resolve, reject) => {
		client.sadd(key, item, (err, data) => {
			if (err) reject(err);
			resolve(data);
		});
	});
};

//returns 1 if exists, else 0
const checkItemExists = (key, item) => {
	return new Promise((resolve, reject) => {
		client.sismember(key, item, (err, data) => {
			if (err) reject(err);
			resolve(data);
		});
	});
};

//results returned in an array
const getItems = key => {
	return new Promise((resolve, reject) => {
		client.smembers(key, (err, data) => {
			if (err) reject(err);
			resolve(data);
		});
	});
};

module.exports = {
	createMessage,
	getMessage,
	setCounter,
	getCounter,
	incrementCounter,
	addSortedItem,
	checkSortedItemExists,
	getSortedItems,
	addItem,
	checkItemExists,
	getItems,
	getCount,
	removeSortedItem
};
