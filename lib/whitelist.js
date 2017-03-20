// springserve api whitelist for supply tag in node.js
// conditions:
// includes domains with >= 1% fill rate

const request = require('request');
const fs = require('fs');
const auth = require('./auth');
const commafy = require('commafy');
const _ = require('lodash');
require('console.table');	
const program = require('commander');
var CLI = require('clui');
var Spinner = CLI.Spinner;
const figlet = require('figlet');
const chalk = require('chalk');
const clear = require('clear');

clear();
console.log(
	chalk.green(
		figlet.textSync('whitelist', {horizontalLayout: 'full'})
	)
);

program
	.version('0.0.1')
	.usage('-d [date] -s [supply] -f [fill rate] -i [impressions] -r [requests] -n [name]')
	.option('-d, --date [date]', 'Add date range: Today, Yesterday, Last 7 Days')
	.option('-s, --supply [supply]', 'Input supply tag ID (e.g. 12345)')
	.option('-f, --fill [fill rate]', 'Minimum fill rate (e.g. 0.0100)')
	.option('-i, --imps [imps]', 'Minimum impressions (e.g. 150)')
	.option('-r, --reqs [reqs]', 'Minimum requests (e.g. 1000)')
	.option('-n, --name [name]', 'Specify report name (e.g. IS10\ WL)')
	.parse(process.argv)

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
		};

		request(options, (error, response, body) => {
			if(error) throw new Error(error);
			let stringify = JSON.stringify(body, null, 2);
			fs.writeFile('whitelist.json', stringify, err => {
				if(err) return console.log(err);
				fs.readFile('whitelist.json', (error, data) => {
					if(err) return console.log(err);
					let domains = _(JSON.parse(data))
					.filter(item => item.fill_rate >= program.fill && item.total_impressions >= program.imps && item.usable_requests >= program.reqs)
					.map(item => {
						return item.declared_domain
					})
					.value();
					fs.writeFile(`/Users/XXXX/Desktop/${program.name}.csv`, domains.join('\n'), err => {
						if(err) return console.log(err);
						// let csv = ['domains'].concat(domains).join(',')
						// domains.join('\n')
					})
					status.stop();
					console.log(domains);
					resolve(domains);
				});
			});
		});
	});
};

auth()
.then(token => {
	return domainReport(token)
})
.catch(error);

function error(err) {
	console.error(err);
}

