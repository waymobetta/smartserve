// node script to update slack channel with vitals of network
// currently running in digital ocean droplet

const config = require('./config.json');
const request = require('request');
const fs = require('fs');
const clear = require('clear');
const auth = require('./auth');
const commafy = require('commafy');
const _ = require('lodash');
const moment = require('moment');

// const now = moment().format('HH:mm');

// SLACK CREDENTIALS:
// login to team (slack.com) -> team.slack.com
// browse apps -> custom integrations -> incoming webhooks
// obtain: webhook url and add to config.json

// slack api call

function slackMessage(payload) {
	let channel_name = '@jon';	// e.g. @operations
	let bot_name = 'spring_bot';
	let icon = ':robot_face:';
  
	const options = {
		method: 'POST',
		url: config['SLACK_URL'], 
		headers: {
			'content-type': 'application/json'
		},
		body: {
			'username': bot_name,
			'icon_emoji': icon,
			'link_names': 1,
			'response_type': 'in_channel',
			'channel_name': channel_name,
			'text': `Network vitals from *${bot_name}*: \n${payload}`
		},
		json: true
	}

	request(options, (error, response, body) => {
		if (error) {
			console.error(error);
		} else {
			console.log('Payload delivered.');
		}
	});
};

// springserve api call

function report(token) {
	return new Promise((resolve, reject) => {
		const options = {
			method: 'POST',
			url: 'https://video.springserve.com/api/v0/report',
			headers: {
				'content-type': 'application/json',
				authorization: token,
				'cache-control': 'no-cache'
			},
			body: {
				date_range: 'Today',
				interval: 'cumulative',
				timezone: 'UTC'
			},
			json: true
		};

		request(options, (error, message, body) => {
			if (error) throw new Error(error);
			let stringify = JSON.stringify(body, null, 2);
			fs.writeFile('slack.json', stringify, err => {
				if (err) return console.log(err);
				fs.readFile('slack.json', (err, data) => {
					if (err) return console.log(err);
					// console.log(data);
					let vitals = _(JSON.parse(data))
					.map(item => {
						let {usable_requests, fill_rate, total_impressions, revenue, net_margin, profit} = item;
						return {
							'Requests': commafy(usable_requests),
							'Impressions': commafy(total_impressions),
							'Fill Rate': `${parseFloat(fill_rate * 100).toFixed(2)}%`,
							'Revenue': `$${commafy(revenue)}`,
							'Profit': `$${commafy(profit)}`,
							'Margin': `${parseFloat(net_margin * 100).toFixed(2)}%`
						}
					})
					.value();
					let payload = JSON.stringify(vitals[0], null, 2);
					console.log(payload);
					resolve(payload);
				});
			});
		});
	});
};



auth()
.then(token => {
	return report(token)
	.then(payload => {
	return slackMessage(payload)
	})
})
.catch(error);

function error(err) {
	console.error(err);
}

