// springserve api supply tag report in node.js

const request = require('request');
const fs = require('fs');
const auth = require('./auth'); 		// auth.js -> import auth token
const commafy = require('commafy');
const _ = require('lodash');
const colors = require('colors');
require('console.table');
const program = require('commander');
const CLI = require('clui');
const Spinner = CLI.Spinner;
const clear = require('clear');
const chalk = require('chalk');

clear();

program
	.version('0.0.1')
	.usage('-d [date] -i [interval] -s [supply] -a [actual] -p [parameter]')
	.option('-d, --date [date]', 'Add date range: Today, Yesterday, Last 7 Days')
	.option('-i, --int [interval]', 'Add interval: day, hour, cumulative')
	.option('-s, --supply [supply]', 'Input supply tag ID (e.g. 12345)')
	.option('-a, --actual [actual]', 'Input domain')
	.option('-p, --param [parameter]', 'Input sort parameter (e.g. revenue, fill_rate)')
	.parse(process.argv)

if (program.actual) {
	console.log(chalk.white(`\nRunning supply report on ${program.actual} for ${program.date} x ${program.int} sorted by ${program.param}\n`));
} else {
	console.log(chalk.white(`\nRunning supply report for ${program.date} x ${program.int} sorted by ${program.param}\n`));
}

function report(token) {
	let status = new Spinner('Running..');
	status.start();
		const options = {
			method: 'POST',
			url: 'https://video.springserve.com/api/v0/report',
			headers: {
				'cache-control': 'no-cache',
				authorization: token,								// auth token
				'content-type': 'application/json'
			},
			body: {
				date_range: program.date,     	 // Today, Yesterday, Last 7 Days; -> moment.js   
				interval: program.int,					 // day, hour, cumulative
				timezone: 'UTC',
				dimensions: ['supply_tag_id'],
				declared_domains: [program.actual],
				supply_tag_ids: [program.supply]
			},
			json: true
		};

		request(options, (error, response, body) => {
			if (error) throw new Error(error);
			 // let actual = JSON.stringify(body);
			 	let stringify = JSON.stringify(body, null, 2);
				fs.writeFile('supply.json', stringify, err => {
					if (err) return console.log(err);
					fs.readFile('supply.json', (error, data) => {
						if (err) return console.log(err);
							const dataArr = JSON.parse(data);
							const supply = _(dataArr)
								// .filter(item => item.total_impressions > 0)
								.orderBy(program.int === "hour" ? "date" : "usable_requests", ["desc"])
								.orderBy(program.param, ['desc'])
								.map(item => {   // replaces function(item)
									const {usable_requests, supply_tag_id, supply_tag_name, fill_rate, total_impressions, revenue, date} = item;  
									return {
										"Date": date,
										"ID": supply_tag_id,
										"Supply Tag": supply_tag_name,
										"Requests": commafy(usable_requests),
										"Impressions": commafy(total_impressions),
										"Fill Rate": `${parseFloat(fill_rate * 100).toFixed(2)}%`,
										"Revenue": `$${commafy(revenue)}`
									}
								}) 
								.value();
								status.stop(); 
								let totals = {
									"Date": "Total:",
									"Requests": commafy(_.sumBy(dataArr, "usable_requests")),
									"Impressions": commafy(_.sumBy(dataArr, "total_impressions")),
									"Fill Rate": _.meanBy(dataArr, "fill_rate"),
									"Revenue": `$${commafy(_.sumBy(dataArr, "revenue").toFixed(2))}`
								}
								let table = supply.concat(totals);
								console.table(table);
					});
				});
		});
}

auth()
.then(report)
.catch(error)

function error(err) {
	console.error(err);
}

