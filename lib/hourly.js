// springserve api hourly report in node.js

const request = require('request');
const fs = require('fs');
const auth = require('./auth');
require('console.table');
const commafy = require('commafy');
const _ = require('lodash');
const program = require('commander');
const colors = require('colors');
const chalk = require('chalk');
const clear = require('clear');
const CLI = require('clui');
const Spinner = CLI.Spinner;
const figlet = require('figlet');
const math = require('mathjs');

/*
clear();
console.log(
	chalk.green(
		figlet.textSync('hourly', { horizontalLayout: 'full' })
	)
);
*/

clear();

program
	.version('0.0.1')
	.usage('-d [date]')
	.option('-d, --date [date]', 'Add date range: Today, Yesterday, Last 7 Days')
	.parse(process.argv);

function report(token) {
	// let status = new Spinner('Running report..');
	// status.start();
	const options = {
		method: 'POST',
		url: 'https://video.springserve.com/api/v0/report',
		headers: {
			'cache-control': 'no-cache',
			authorization: token,
			'content-type': 'application/json'
		},
		body: {
			date_range: program.date,			// Today, Yesterday, Last 7 Days
			interval: 'hour',
			timezone: 'UTC',
		},
		json: true
	};

	request(options, (error, response, body) => {
		if (error) throw new Error(error);
		let stringify = JSON.stringify(body, null, 2);
		fs.writeFile('hourly.json', stringify, err => {
			if (err) return console.log(err);
			fs.readFile('hourly.json', (err, data) => {
				if (err) return console.log(err);
				let dataArr = JSON.parse(data);
				let json = _(dataArr)
					.orderBy("date", ["desc"])
					.map(item => {
						let {date, usable_requests, fill_rate, total_impressions, revenue, margin} = item;

						/*

						function color(text) {
							if (fill_rate <= 0.0005 || revenue <= 500) {
								return colors.red(text);
							} else if (fill_rate >= 0.0050) {
								return colors.green(text);
							} else
								return;
						}

						*/

						return {
							"Date": date,
							"Requests": commafy(usable_requests),
							"Impressions": commafy(total_impressions),
							"Fill Rate": `${parseFloat(fill_rate * 100).toFixed(2)}%`,
							"Revenue": `$${commafy(revenue)}`,
							"Margin (Gross)": `${parseFloat(margin * 100).toFixed(2)}%`
						}
					})
					.value();
					let totals = {
						"Revenue": `$${commafy(_.sumBy(dataArr, "revenue").toFixed(2))}`,
						"Impressions": commafy(_.sumBy(dataArr, "total_impressions")),
						"Requests": commafy(_.sumBy(dataArr, "usable_requests")),
						"Fill Rate": `${_.meanBy(dataArr, ("total_impressions" / "usable_requests")).toFixed(2)}%`,
						"Date": "Total:"
					}
					let table = json.concat(totals);
					// status.stop();
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

