// springserve api supply tag report in node.js

const request = require('request');
const fs = require('fs');
const auth = require('./auth');
require('console.table');
const commafy = require('commafy');
const colors = require('colors');
const _ = require('lodash');
const program = require('commander');
const chalk = require('chalk');
const clear = require('clear');
const CLI = require('clui');
const Spinner = CLI.Spinner;
const figlet = require('figlet');

clear();

// intro ascii

/*

clear();
console.log(
  chalk.cyan(
    figlet.textSync('domains', {horizontalLayout: 'full'})
  )
);

*/

// commander CLI

program
  .version('0.0.1')
  .usage('-d [date] -s [supply] -i [partner ID] -b [demand] -a [actual] -n [number] -p [parameter]')
  .description('Description: leverage for specific or general domain query')
  .option('-d, --date [date]', 'Add date range: Today, Yesterday, Last 7 Days')
  .option('-i, --id [partner ID]', 'Input supply partner ID (e.g. 0001)')
  .option('-s, --supply [supply]', 'Input supply tag ID [e.g. 12345]')
  .option('-b, --demand [demand]', 'Input demand tag ID (e.g. 54321')
  .option('-a, --actual [actual]', 'Add actual domain to search')
  .option('-n, --num [number]', 'Input number of domains to render')
  .option('-p, --param [parameter]', 'Input sort parameter (e.g. revenue, fill_rate, usable_requests)')
  // .option('-t, --time [hour]', 'Specify hour')
  .parse(process.argv);

// add if-else for params

// report titled generated based on commander input

if (program.demand && program.supply) {
  console.log(chalk.white(`\n${program.date}'s top ${program.num} domains buying from ${program.supply} sorted by ${program.param}\n`));
} else if (program.supply) {
  console.log(chalk.white(`\n${program.date}'s top ${program.num} domains for supply tag: ${program.supply} sorted by ${program.param}\n`));
} else if (program.demand) {
  console.log(chalk.white(`\n${program.date}'s top ${program.num} domains for demand tag: ${program.demand} sorted by ${program.param}\n`));
} else if (program.actual) {
  console.log(chalk.white(`\n${program.actual} x ${program.date} sorted by ${program.param}\n`));
} else if (program.id) {
  console.log(chalk.white(`\n${program.date}'s top ${program.num} domains for supply partner ${program.id} sorted by ${program.param}\n`));
} else {
  console.log(chalk.white(`\n${program.date}'s top ${program.num} domains sorted by ${program.param}\n`));
};

// sort output depending on query parameters

function sort() {
  if (program.int === "hour") {
    "Date", ["desc"]
  } else if (program.num) {
    "Fill Rate", ["desc"]
  } else {
    "Impressions", ["desc"]
  }
};

// api call body

function domainReport(token) {
  let status = new Spinner('Running report..');
  status.start();
    const options = {
      method: 'POST',
      url: 'https://video.springserve.com/api/v0/report',
      headers: {
        'cache-control': 'no-cache',
        authorization: token,
        'content-type': 'application/json',
      },
      body: {
        date_range: program.date,     
        interval: 'day',          // program.int
        timezone: 'UTC',
        dimensions: ['declared_domain'],  
        declared_domains: [program.actual],
        supply_tag_ids: [program.supply],
        demand_tag_ids: [program.demand],
        supply_partner_ids: [program.id]
      },
      json: true
    };

    request(options, (error, response, body) => {
      if (error) throw new Error(error);
       // let actual = JSON.stringify(body);
        let stringify = JSON.stringify(body, null, 2);
        fs.writeFile('domain.json', stringify, err => {
          if (err) return console.log(err);
          fs.readFile('domain.json', (error, data) => {
            if (err) return console.log(err);
              let domains = _(JSON.parse(data))
                .orderBy(program.int === "hour" ? "date" : "usable_requests", ["desc"])
                .orderBy(program.param, ['desc'])
                .filter(item => item.usable_requests >= 1000 || item.demand_requests >= 1000)
                .take([program.num])
                // .filter(item => item.date == `${program.time}`)
                .map(item => {   
                  let {usable_requests, impressions, demand_requests, supply_tag_id, supply_tag_name, demand_tag_id, demand_tag_name, declared_domain, fill_rate, total_impressions, revenue, date, cpm} = item;
                  
                  /*
                  function color(text) {
                    if (fill_rate <= 0.0005) {
                      return colors.red(text);
                    } else if (fill_rate >= 0.0050) {
                      return colors.green(text);
                    } else {
                      return text;
                    }
                  }
                  */

                  // if-else chain

                  if (program.demand && program.supply) {
                    return {
                      "Date": date,
                      // "Supply Tag": supply_tag_name,
                      // "Demand Tag": demand_tag_name,
                      "Domain": declared_domain,
                      "Requests": commafy(demand_requests),
                      "Impressions": commafy(impressions),
                      "Fill Rate": `${parseFloat(fill_rate * 100).toFixed(2)}%`,
                      "Revenue": `$${commafy(revenue)}`
                    }
                  } else if (program.demand) {
                    return {
                      "Date": date,
                      // "ID": demand_tag_id,
                      // "Demand Tag": demand_tag_name,
                      "Domain": declared_domain,
                      "Requests": commafy(demand_requests),
                      "Impressions": commafy(impressions),
                      "Fill Rate": `${parseFloat(fill_rate * 100).toFixed(2)}%`,
                      "Revenue": `$${commafy(revenue)}`,
                      "CPM": `$${cpm}`
                    }
                  } else if (program.supply) {
                    return {
                      "Date": date,
                      // "ID": supply_tag_id,
                      // "Supply Tag": supply_tag_name,
                      "Domain": declared_domain,
                      "Requests": commafy(usable_requests),
                      "Impressions": commafy(total_impressions),
                      "Fill Rate": `${parseFloat(fill_rate * 100).toFixed(2)}%`,
                      "Revenue": `$${commafy(revenue)}`,
                      "CPM": `$${cpm}`
                    }
                  } else {
                    return {
                      "Date": date,
                      "Domain": declared_domain,
                      "Requests": commafy(usable_requests),
                      "Impressions": commafy(total_impressions),
                      "Fill Rate": `${parseFloat(fill_rate * 100).toFixed(2)}%`,
                      "Revenue": `$${commafy(revenue)}`,
                      "CPM": `$${cpm}`
                    }
                  }
                })
                .value();
                status.stop(); 
                console.table(domains);
          });
        });
    });
}

auth()
.then(domainReport)
.catch(error)

function error(err) {
  console.error(err);
}

