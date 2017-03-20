// springserve api supply partner report in node.js

const request = require('request');
const fs = require('fs');
const auth = require('./auth.js');
require('console.table');
const commafy = require('commafy');
const _ = require('lodash');
const colors = require('colors');
const math = require('mathjs');

/*

const partners = {
	IronSource: 236,
	AdKarma: 113,
	YellowHammer: 286,
	SpartaCS: 128,
	Tersertude: 154,
	Matomy: 126,
	DivisionD: 470,
	Avid: 467,
};

const id = partners[i]; 

*/

colors.setTheme({
	title: 'green',
	zeros: 'red'
});


// api call to retrieve partner information

function partnerReport(token) {
	const date = process.argv[2];
	const int = process.argv[3];
	const id = process.argv[4];
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
				date_range: date, 					// Today, Yesterday, Last 7 Days
				interval: int,							// hour, day, cumulative
				timezone: 'UTC',						
				dimensions: ['supply_partner_id'],
				supply_partner_ids: [id]		// substitute out ID for specific parnter report
			},
			json: true
		};

		request(options, (error, response, body) => {
			if (error) throw new Error(error);
			const stringify = JSON.stringify(body, null, 2);
			fs.writeFile('partner.json', stringify, err => {
				if (err) throw new Error(err);
				fs.readFile('partner.json', (error, data) => {
					if (err) return console.log(err);
					const json = _(JSON.parse(data))
					// .orderBy("date", ["desc"])
					.orderBy(int === "hour" ? "hour" : "usable_requests", ["desc"])
					.map(item => {
						let {usable_requests, supply_partner, fill_rate, total_impressions, revenue, date} = item;
						return {
							"Date": date,
							"Supply Partner": supply_partner,
							// "Supply Tag": supply_tag_name,
							"Requests": commafy(usable_requests),
							"Impressions": commafy(total_impressions),
							"Fill Rate": `${parseFloat(fill_rate * 100).toFixed(2)}%`,
							"Revenue": `$${commafy(revenue)}`
						}
					})
					.value();
					resolve(json);
					console.table(json);
					// console.table(_.sumBy(json, revenue));
				});
			});
		});
	});
}

// promise chain 

auth()
.then(partnerReport)
// .then(json => {
	// return sumTotal(json)
// })
.catch(error)

function error(err) {
	console.error(err);
}

