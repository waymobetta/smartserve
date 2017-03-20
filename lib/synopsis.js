// springserve api call for synopsis of network

const fs = require('fs');
const request = require('request');
const CLI = require('clui');
const Spinner = CLI.Spinner;
const auth = require('./auth');
const chalk = require('chalk');
const clear = require('clear');
const program = require('commander');
const figlet = require('figlet');
const commafy = require('commafy');
const moment = require('moment')
const _ = require('lodash');
require('console.table');

// v1
// top supply tag
// top demand tag 
// top domain

// v2
// top geo
// top pair
// top underperforming domains
// top performing domains

clear();

/*

console.log(
	chalk.white(
		figlet.textSync('Synopsis', {horizontalLayout: 'full'})
	)
);

*/

const now = chalk.cyan(moment.utc().format('YYYY-MM-DD'));

program
	.version('0.0.1')
	.usage('-d [date] -p [parameter]')
	.description('Description: provides current synopsis of network top performing: \n\n   Supply Tag \n   Demand Tag \n   Domain \n   Pair')
	.option('-d, --date [date]', 'Input date range: Today, Yesterday')
	.option('-p, --param [parameter]', 'Input sort parameter (e.g. revenue, fill_rate')
	.parse(process.argv);

if (program.date == 'Yesterday') {
	console.log(chalk.white(`\n${program.date}'s synopsis of top performing, sorted by ${program.param}\n`));
} else {
	console.log(chalk.white(`\n ${now} synopsis of top performing, sorted by ${program.param}\n`));
}

// supply tag, supply partner

function supplyReport(token) {
	let status = new Spinner('Running supply report..');
	status.start();
	// console.time('supply');
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
				interval: 'cumulative', 		// program.int
				timezone: 'UTC',
				dimensions: ['supply_tag_id', 'supply_partner_id']
			},
			json: true
		}

		request(options, (error, response, body) => {
			if (error) throw new Error(error);
			let stringify = JSON.stringify(body, null, 2);
			fs.writeFile('synopsisSupply.json', stringify, err => {
				if (err) console.log(err);
				fs.readFile('synopsisSupply.json', (err, data) => {
					if (err) console.log(err);
					let supplyArr = JSON.parse(data);
					let supply = _(supplyArr)
						.orderBy(program.param, ['desc'])
						.filter(item => item.usable_requests >= 1000)
						.take([1])
						.map(item => {
							let {total_impressions, usable_requests, fill_rate, revenue, supply_partner_id, supply_partner, supply_tag_name, supply_tag_id, date} = item;
							return {
								// 'Date': date,
								'ID': supply_tag_id,
								'Supply Tag': supply_tag_name,
								// 'Supply Partner': supply_partner, 
								'Requests': commafy(usable_requests),
								'Impressions': commafy(total_impressions),
								'Fill Rate': `${parseFloat(fill_rate * 100).toFixed(2)}%`,
								'Revenue': `$${commafy(revenue)}`
							}
						})
						.value();
						status.stop(); 
						// console.timeEnd('supply');
						resolve(supply);
						console.table(supply);
				});
			});
		});
	}); 
}

// demand tag, demand partner

function demandReport(token) {
	let status = new Spinner('Running demand report..');
	status.start();
	// console.time('demand');
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
			dimensions: ['demand_tag_id', 'demand_partner_id'],
		},
		json: true,
	}

	request(options, (error, repsonse, body) => {
		if (error) throw new Error(error);
		let stringify = JSON.stringify(body, null, 2);
		fs.writeFile('synopsisDemand.json', stringify, err => {
			if (err) console.log(err);
			fs.readFile('synopsisDemand.json', (err, data) => {
				if (err) console.log(err);
					let demand = _(JSON.parse(data))
						.orderBy(program.param, ['desc'])
						.filter(item => item.demand_requests >= 1000)
						.take([1])
						.map(item => {
							let {impressions, demand_requests, demand_tag_id, demand_partner, demand_tag_name, revenue, fill_rate, date} = item;
							return {
								// 'Date': date,
								'Demand Tag': demand_tag_name,
								// 'Demand Partner': demand_partner,
								'Requests': commafy(demand_requests),
								'Impressions': commafy(impressions),
								'Fill Rate': `${parseFloat(fill_rate * 100).toFixed(2)}%`,
								'Revenue': `$${commafy(revenue)}`
							}
						})
						.value();
						status.stop();
						// console.timeEnd('demand');
						resolve(demand);
						console.table(demand);
				});
			});
		});
	});
}

// domain

function domainReport(token) {
	let status = new Spinner('Running domain report..');
	status.start();
	// console.time('domains');
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
			dimensions: ['declared_domain']
		},
		json: true,
	}

	request(options, (error, response, body) => {
		if (error) throw new Error(error);
		let stringify = JSON.stringify(body);
		fs.writeFile('synopsisDomain.json', stringify, err => {
			if (err) console.log(err);
			fs.readFile('synopsisDomain.json', (error, data) => {
				if (err) console.log(err);
					let domains = _(JSON.parse(data))
						.orderBy(program.param, ['desc'])
						.filter(item => item.usable_requests >= 1000)
						.take([1])
						.map(item => {
							let {declared_domain, date, usable_requests, total_impressions, fill_rate, revenue} = item;
							return {
								// 'Date': date,
								'Domain': declared_domain,
								'Requests': commafy(usable_requests),
								'Impressions': commafy(total_impressions),
								'Fill Rate': `${parseFloat(fill_rate * 100).toFixed(2)}%`,
								'Revenue': `$${commafy(revenue)}`
							}
						})
						.value();
						status.stop();
						// console.timeEnd('domains')
						resolve(domains);
						console.table(domains);
				});
			});
		});
	});
}

// top pair

function pairs(token) {
	let status = new Spinner('Running supply tag x demand tag report..');
	status.start();
	// console.time('pairs');
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
				dimensions: ['supply_tag_id', 'demand_tag_id']
			},
			json: true,
		}

		request(options, (error, response, body) => {
			if (error) throw new Error(error);
			let stringify = JSON.stringify(body);
			fs.writeFile('synopsisPairs.json', stringify, err => {
				if (err) console.log(err);
				fs.readFile('synopsisPairs.json', (error, data) => {
					if (err) console.log(err);
						let pairs = _(JSON.parse(data))
							.orderBy(program.param, ['desc'])
							.filter(item => item.demand_requests >= 1000)
							.take([1])
							.map(item => {
								let {supply_tag_id, supply_tag_name, demand_tag_id, demand_tag_name, revenue, demand_requests, impressions, fill_rate} = item;
								return {
									'ID': supply_tag_id,
									'Supply Tag': supply_tag_name,
									'Demand Tag': demand_tag_name,
									'Requests': commafy(demand_requests),
									'Impressions': commafy(impressions),
									'Fill Rate': `${parseFloat(fill_rate * 100).toFixed(2)}%`,
									'Revenue': `$${commafy(revenue)}`
								}
							})
							.value();
							status.stop();
							// console.timeEnd('pairs');
							resolve(pairs);
							console.table(pairs);
				});
			});
		});
	});
}

auth()
.then(token => {
	return supplyReport(token)
	.then(demandReport(token))
	.then(domainReport(token))
	.then(pairs(token))
})
.catch(error)

function error(err) {
	console.error(err);
}

