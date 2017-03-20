// springserve api demand tag report in node.js

const request = require('request');
const fs = require('fs');
const auth = require('./auth');
const commafy = require('commafy');
const _ = require('lodash');
require('console.table');
const program = require('commander');
const CLI = require('clui');
const Spinner = CLI.Spinner;
const clear = require('clear');
const chalk = require('chalk');

clear();

program
	.version('0.0.1')
	.usage('-d [date] -i [interval] -t [demand tag] -u [hour] -a [actual]')
	.option('-d, --date [date]', 'Add date range: Today, Yesterday, Last 7 Days')
	.option('-i, --int [interval]', 'Add interval: day, hour, cumulative')
	.option('-u, --hour [hour]', 'Input hour')
	.option('-t, --tag [demand tag]', 'Input demand tag (e.g. 12345)')
	.option('-a, --actual [actual]', 'Input domain')
	.parse(process.argv)

if (program.actual) {
	console.log(chalk.white(`\nRunning demand report on ${program.actual} for ${program.date} x ${program.int}\n`));
} else if (program.tag) {
	console.log(chalk.white(`\nRunning demand report on ${program.tag} for ${program.date} x ${program.int}\n`));
} else {
	console.log(chalk.white(`\nRunning demand report for ${program.date} x ${program.int}\n`));
}

function report(token) {
	let status = new Spinner('Running..');
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
			date_range: program.date,					// Today, Yesterday, Last 7 Days 
			interval: program.int,						// day, hour, cumulative
			timezone: 'UTC',
			dimensions: ['demand_tag_id'],
			declared_domains: [program.actual],
			demand_tag_ids: [program.tag]
		},
		json: true
	}

	request(options, (error, response, body) => {
		if (error) throw new Error(error);
			let stringify = JSON.stringify(body, null, 2);
			fs.writeFile('demand.json', stringify, err => {
				if (err) console.log(err);
				fs.readFile('demand.json', (error, data) => {
					if (err) console.log(err);
					let dataArr = JSON.parse(data);
					let demand = _(dataArr)
						.orderBy(program.int === "hour" ? "date" : "demand_requests", ["desc"])	
						// .filter(item => item.date === program.hour)			
						.map(item => {
							let {demand_requests, impressions, revenue, fill_rate, date, declared_domain, demand_tag_id, demand_tag_name} = item;
								return {
									"Date": date,
									"Demand Tag": demand_tag_name,
									"Requests": commafy(demand_requests),
									"Impressions": commafy(impressions),
									"Fill Rate": `${parseFloat(fill_rate * 100).toFixed(2)}%`,
									"Revenue": `$${commafy(revenue)}`
								}
						})
					.value();
					status.stop();
					let totals = {
						"Revenue": `$${commafy(_.sumBy(dataArr, "revenue"))}`,
						"Requests": commafy(_.sumBy(dataArr, "demand_requests")),
						"Impressions": commafy(_.sumBy(dataArr, "impressions")),
						"Fill Rate": _.meanBy(dataArr, "fill_rate"),							// needs fix
						"Date": "Total:"
					}
					let table = demand.concat(totals);
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

