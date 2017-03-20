// springserve api non-performing domain blocks in node.js
// domains list: 31297 -> Weekly Performance Blocks
// conditions:
// impressions equal 0

const request = require('request');
const fs = require('fs');
const auth = require('./auth');
const _ = require('lodash');
require('console.table');
const program = require('commander');
const CLI = require('clui');
const Spinner = CLI.Spinner;
const figlet = require('figlet');
const chalk = require('chalk');
const clear = require('clear');
const consuela = require('./consuela');

clear();
console.log(
	chalk.red(
		figlet.textSync('blocks', {horizontalLayout: 'full'})
		// consuela
	)
);

program
	.version('0.0.1')
	.usage('-d [date]')
	.option('-d, --date [date]', 'Add date range: Today, Yesterday')
	// .option('-i, --imps [impressions]', 'Minimum number of impressions (e.g. 250)')
	// .option('-f, --fill [fill rate]', 'Minimum fill rate (e.g. 0.0050)')
	// .option('-r, --reqs [requests]', 'Minimum number of requests (e.g. 5000)')
	.parse(process.argv)

function fullDomainReport(token) {
	let status = new Spinner('Running..');
	status.start();
	return new Promise((resolve, reject) => {
		let allDomains = [];
		let page = 0;

		function domainReport(token, page) {
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
						date_range: program.date, 		// Today, Yesterday, Last 7 Day
						interval: 'cumulative',
						timezone: 'UTC',
						page: 1,					// page 0 and 1 are the same; returns at most 10000 rows/page
						dimensions: ['declared_domain']
					},
					json: true
				};

				request(options, (error, response, body) => {
					if (error) throw new Error(error);
					// console.log(response);
					let stringify = JSON.stringify(body, null, 2);
					fs.writeFile('blocks.json', stringify, err => {
						if (err) return console.log(err);
						fs.readFile('blocks.json', (error, data) => {
							if (err) return console.log(err);
								let domains = _(JSON.parse(data))
								.orderBy("usable_requests", ["desc"])
								.filter(item => item.total_impressions <= 0)
								// .filter(item => item.total_impressions <= 0 && item.usable_requests >= program.reqs)
								.map(item => {
									return item.declared_domain
								})
								.value();
								// fs.writeFile('/Users/jonroethke/Desktop/Weekly\ Performance\ Blocks.csv', domains.join('\n'), err => {
									// if(err) return console.log(err);
								// })
								console.log(domains);
								resolve(domains);
						});
					});
				});
			});
		};

		function collect() {
			domainReport(token, page)
				.then(domains => {
					if (domains.length > 0) {
						allDomains = allDomains.concat(domains);
						page++;
						collect();
						console.log(page);
					} else {
						resolve(allDomains);
						fs.writeFile('/Users/XXXX/Desktop/Weekly\ Performance\ Blocks.csv', allDomains.join('\n'), err => {
							if(err) return console.log(err);
						})
						status.stop();
					}
				});
		}

		/*
		function blockedDomains(token, allDomains) {
			const options = {									// test BL -> 34977
				method: 'POST',									// weekly performance blocks -> 31297
				url: 'https://video.springserve.com/api/v0/domain_lists/34977/domains/bulk_create',	
				headers: {
					'cache-control': 'no-cache',
					authorization: token,
					'content-type': 'application/json'
				},
				body: {
					"names": allDomains
				},
				json: true
			};

			request(options, (error, response, body) => {
				if(error) return console.log(error)
				console.log(body);
			});
		};
		*/

		collect();
	});
}

auth()
	.then(token => {
		return fullDomainReport(token)
	})
.catch(error);

/*

	.then(fullDomainReport)
	.then(allDomains => {
		console.log(allDomains);
	})
.catch(error);


auth()
.then(token => {
	return domainReport(token)
	.then(domains => {
		return blockedDomains(token, domains)
	});
})
.catch(error);
*/

function error(err) {
	console.error(err);
}

