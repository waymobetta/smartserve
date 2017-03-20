// springserve api blacklist for supply tag in node.js
// conditions:
// includes domains with <= 0 imps && x requests

const request = require('request');
const fs = require('fs');
const auth = require('./auth');
const _ = require('lodash');
const program = require('commander');
const CLI = require('clui');
const Spinner = CLI.Spinner;
const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');

clear();
console.log(
	chalk.red(
		figlet.textSync('blacklist', {horizontalLayout: 'full'})
	)
);

program
	.version('0.0.1')
	.usage('-d [date], -s [supply], -r [requests], -n [name]')
	.option('-d, --date [date]', 'Add date range: Today, Yesterday, Last 7 Days')
	.option('-s, --supply [supply]', 'Input supply tag ID (e.g. 12345)')
	.option('-r, --reqs [requests]', 'Minimum number of requests (e.g. 5000)')
	// .option('-f, --fill [fill rate]', 'Minimum fill rate (e.g. 0.0100)')
	.option('-n, --name [name]', 'Specify report name (e.g. IS10\ blocks)')
	.parse(process.argv)

/* 
specify below:
date = date range of report
supply = tag under the microscope
reqs = minimum request amount; block severity guage
*/

function domainReport(token) {
	let status = new Spinner('Running..');
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
				dimensions: ['declared_domain', 'supply_tag_id'],
				supply_tag_ids: [program.supply]
			},
			json: true
		}

		request(options, (error, response, body) => {
			if (error) throw new Error(error);
			let stringify = JSON.stringify(body, null, 2);
			fs.writeFile('blacklist.json', stringify, err => {
				if(err) return console.log(err);
				fs.readFile('blacklist.json', (error, data) => {
					if(err) return console.log(err);
					let domains = _(JSON.parse(data))
					// .filter(item => item.fill_rate === program.fill && item.usable_requests >= program.reqs)
					.filter(item => item.total_impressions <= 0 && item.usable_requests >= program.reqs)
					.map(item => {
						return item.declared_domain
					})
					.value();
					fs.writeFile(`/Users/XXXX/Desktop/${program.name}.csv`, domains.join('\n'), err => {
						if(err) return console.log(err);
					})
					status.stop();
					console.log(domains);
					resolve(domains);
				});
			});
		});
	});
}

auth()
.then(token => {
	return domainReport(token)
})
.catch(error);

function error(err) {
	console.error(err);
}

