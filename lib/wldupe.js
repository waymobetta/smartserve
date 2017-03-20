// springserve api whitelist for demand tag in node.js

const request = require('request');
const fs = require('fs');
const auth = require('./auth');
const _ = require('lodash');
const CLI = require('clui');
const Spinner = CLI.Spinner;
const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');
const program = require('commander');

// intro ascii

clear();
console.log(
	chalk.green(
		figlet.textSync('WL-dupe', {horizontalLayout: 'full'})
	)
);

program
	.version('0.0.1')
	.usage('-d [date] -b [demand] -s [supply] -f [fill rate] -i [id]') // \n\n\u00A0
	.description('Used for creating a WL on a duplicate demand tag for a particular supply tag')
	.option('-d, --date [date]', 'Add date range: Today, Yesterday, Last 7 Days')
	.option('-b, --demand [demand]', 'Input demand tag ID (e.g. 12345)')
	.option('-s, --supply [supply]', 'Input supply tag ID (e.g. 23456)')
	.option('-f, --fill [fill rate]', 'Minimum fill rate (e.g. 0.0100)')
	.option('-m, --imps [impressions]', 'Minimum number of impressions (e.g. 250)')
	.option('-i, --id [id]', 'Specify domain list ID (e.g. 789)')
	.parse(process.argv)

// add if statements for colored console log detailing report
//
//

// api call body

function domainReport(token) {
	let status = new Spinner('Generating whitelist. Please wait..');
	status.start();
		return new Promise((resolve, reject) => {
		const options = {
			method: 'POST',
			url: 'https://video.springserve.com/api/v0/report',
			headers: {
				'cache-control': 'no-cache',
				authorization: token,
				'content-type': 'application/json'
			},
			body: {
				date_range: program.date,
				interval: 'cumulative',
				timezone: 'UTC',
				dimensions: ['declared_domain'],
				demand_tag_ids: [program.demand],
				supply_tag_ids: [program.supply]
			},
			json: true
		};

		request(options, (error, response, body) => {
			if(error) throw new Error(error);
			let stringify = JSON.stringify(body, null, 2);
			fs.writeFile('wldupe.json', stringify, err => {
				if(err) return console.log(err);
				fs.readFile('wldupe.json', (error, data) => {
					if (err) return console.log(err);
					let domains = _(JSON.parse(data))
					.filter(item => item.fill_rate >= program.fill && item.demand_requests >= 1000 && item.impressions >= program.imps)
					.map(item => {
						return item.declared_domain
					})
					.value();
					status.stop();
					console.log(domains);
					resolve(domains);
				});
			});
		});
	});
};	

// append domains to domain list

function appendWL(token, domains) {					// test WL -> 34287
	const link = `https://video.springserve.com/api/v0/domain_lists/${program.id}/domains/bulk_create`
	const options = {													
		method: 'POST',
		url: link,
		headers: {
			'cache-control': 'no-cache',
			authorization: token,
			'content-type': 'application/json'
		},
		body: {
			"names": domains
		},
		json: true
	};

	request(options, (error, response, body) => {
		if(error) return console.log(error);
		console.log(body);
	});
};

auth()
.then(token => {
	return domainReport(token)
	.then(domains => {
		return appendWL(token, domains)
	});
})
.catch(error);

function error(err) {
	console.error(err);
}

