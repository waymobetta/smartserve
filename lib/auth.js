// springserve api authorization in node.js

const config = require('./config.json');
const request = require('request');

function auth() {
	return new Promise((resolve, reject) => {
		const options = {
			method: 'POST',
			url: 'https://video.springserve.com/api/v0/auth',
			headers: {
				'cache-control': 'no-cache',
				'content-type': 'application/json'
			},
			body: {
				email: config['SPRINGSERVE_EMAIL'],
				password: config['SPRINGSERVE_PASS']
			},
			json: true
		}

		request(options, (error, response, body) => {
			if (error) reject(error);
			resolve(body.token);
			// console.log(body.token);
		});
	});
}

module.exports = auth;

