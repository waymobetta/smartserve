// springserve api upload domains report 

const fs = require('fs');
const _ = require('lodash');
const auth = require('.././auth');
const request = require('request');
const commafy = require('commafy');
const program = require('commander');
const figlet = require('figlet');
const CLI = require('clui');
const Spinner = CLI.Spinner;
const chalk = require('chalk');
const clear = require('clear');
require('console.table');

clear();
console.log(
	chalk.green(
		figlet.textSync('source', {horizontalLayout: 'full'})
	)
);

program
	.version('0.0.1')
	.usage('-d [date], -l [list name]') // \n\n\u00A0
	.description('Description: Load domain list for inventory evaluation')
	.option('-d, --date [date]', 'Add date range: Today, Yesterday, Last 7 Days')
	.option('-l, --list [list name]', 'Sitelist name to upload')
	.parse(process.argv);

function readFile() {
	return new Promise((resolve, reject) => {
		fs.readFile(`/Users/XXXX/Desktop/${program.list}.csv`, 'utf8', (err, data) => {
			let domains = data.toString().split('\r'); // (/[\n\r]/);
			console.log(chalk.cyan(`Domain list: ${program.list}`));
			resolve(domains);
		});
	});
}

function sourceReport(token, domains) {
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
				dimensions: ['supply_tag_id'],
				declared_domains: domains
			},
			json: true
		}

		request(options, (error, response, body) => {
			if (error) throw new Error(error);
			let stringify = JSON.stringify(body, null, 2);
			fs.writeFile('sourceReport.json', stringify, err => {
				if (err) return console.log(err);
				fs.readFile('sourceReport.json', (error, data) => {
					if (err) return console.log(err);
						let supply = _(JSON.parse(data))
						.orderBy('usable_requests', ['desc'])
						.filter(item => item.usable_requests >= 1000)
						.map(item => {
							let {usable_requests, supply_tag_id, supply_tag_name, total_impressions, fill_rate, cpm, revenue} = item;
							return {
								"ID": supply_tag_id,
								"Supply Tag": supply_tag_name,
								"CPM": cpm,
								"Reqs": commafy(usable_requests),
								"Imps": commafy(total_impressions),
								"Fill": `${parseFloat(fill_rate * 100).toFixed(2)}%`,
								"Revenue": `$${commafy(revenue)}`
							}
						})
						.value();
						status.stop();
						console.table(supply);
					});
			});
		});
	});
}



auth()
	.then(token => {
		return readFile()
		.then(domains => {
			return sourceReport(token, domains)
		})
	})
.catch(error);

function error(err) {
	console.error(err);
}

