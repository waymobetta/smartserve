// springserve api domain list report

// step 1:
// supply tag domain report

// step 2:
// find top demand tags for the inventory
// pass domains to demand tag report

// step 3:
// recommend demand tags to assign to tag

const request = require('request');
const fs = require('fs');
const auth = require('./auth');
const _ = require('lodash');
const commafy = require('commafy');
const program = require('commander');
const CLI = require('clui');
const Spinner = CLI.Spinner;
const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');
const moment = require('moment');
const say = require('say');
require('console.table');

clear();
console.log(
	chalk.cyan(
		figlet.textSync('maestro', {horizontalLayout: 'full'})
	)
);

program
	.version('0.0.1')
	.usage('-d [date], -s [supply]') // \n\n\u00A0 
	.description('Description: Leverage maestro to find all available demand for a particular supply tag')
	.option('-d, --date [date]', 'Add date range: Today, Yesterday')
	.option('-s, --supply [supply]', 'Include supply tag ID (e.g. 12345)')
	.parse(process.argv);

console.log(chalk.green(`${program.supply}`));

function domainReport(token) {
	let status = new Spinner('Analyzing inventory..');
	status.start();

	/*

	say.speak('Maestro online. Anaylizing inventory as requested', 'Alex', err => {
		if (err) {
			return console.error(err);
		}
	});

	*/

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
				supply_tag_ids: [program.supply]
			},
			json: true
		};

		request(options, (error, response, body) => {
			if (error) throw new Error(error);
			let stringify = JSON.stringify(body, null, 2);
			fs.writeFile('domainReport.json', stringify, err => {
				if (err) return console.log(err);
				fs.readFile('domainReport.json', (error, data) => {
					if (err) return console.log(err);
						let domains = _(JSON.parse(data))
						.orderBy("usable_requests", ["desc"])
						.filter(item => item.usable_requests >= 1000)
						.map(item => {
								return item.declared_domain
						})
						.value();
						status.stop();
						// console.log(chalk.green('All done'));
						// console.log(domains);
						if (domains.length <= 0) {
							console.log(chalk.red('MAESTRO ERROR\!'));
							console.log(`No domains found behind tag ID: ${program.supply}`);
						} else {
							// console.log(domains);
							resolve(domains);
						}
				});
			});
		});
	});
};

function demandReport(token, domains) {
	let status = new Spinner('Retrieving eligible demand..');
	status.start();
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
			dimensions: ['demand_tag_id'],
			declared_domains: domains
		},
		json: true
	}

	request(options, (error, response, body) => {
		if (error) throw new Error(err);
		let stringify = JSON.stringify(body, null, 2);
		fs.writeFile('demandReport.json', stringify, err => {
			if (err) return console.log(err);
			fs.readFile('demandReport.json', (error, data) => {
				if (err) return console.log(err);
					let demand = _(JSON.parse(data))
					// .orderBy('demand_requests', ['desc'])
					.orderBy('fill_rate', ['desc'])
					.filter(item => item.demand_requests >= 1000)
					// .filter(item => item.cpm >= cpm)
					.take([10])
					.map(item => {
						let {demand_requests, demand_tag_id, demand_tag_name, impressions, revenue, fill_rate, cpm} = item;
						return {
							"ID": demand_tag_id,
							"Demand": demand_tag_name,
							"CPM": cpm,
							"Reqs": commafy(demand_requests),
							"Imps": commafy(impressions),
							"Fill": `${parseFloat(fill_rate * 100).toFixed(2)}%`
							// "Revenue": `$${commafy(revenue)}`
						}
					})
					.value();
					status.stop();
					console.table(demand);
			});
		});
	});
}

auth()
.then(token => {
	return domainReport(token)
	.then(domains => {
		return demandReport(token, domains)
	});
})
.catch(error);

function error(err) {
	console.error(err);
}

