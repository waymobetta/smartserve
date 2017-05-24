# smartserve

Simple CLI for programmatic reporting and network optimization on SpringServe AdServer

### installation

install using node package manager -> https://www.npmjs.com/package/smartserve
```bash
$ npm install smartserve
```

or clone repository
```bash
$ git clone https://github.com/waymobetta/smartserve.git
$ npm install
$ update config.json with credentials
```

### usage
Example: Maestro (displays potential demand tags for supply tag [ID: 55173])

<img width="468" alt="screen shot 2017-05-24 at 10 01 42 am" src="https://cloud.githubusercontent.com/assets/17755587/26415905/f2963c58-4068-11e7-8903-4408e82dc73e.png">

```bash
$ node maestro.js -d Today -s 55173
```

Example: Synopsis (displays top supply tag, demand tag, pair (supply/demand), and domain for date range [Today] by parameter [fill_rate])

<img width="471" alt="screen shot 2017-05-24 at 10 01 55 am" src="https://cloud.githubusercontent.com/assets/17755587/26415862/c4c6edf4-4068-11e7-8073-801045e5ab8f.png">

```bash
SORT BY FILL RATE: $ node synopsis.js -d Today -p fill_rate
SORT BY REVENUE: $ node synopsis.js -d Today -p revenue
```

Example: Domain (displays top [50] domains for date range [Today] sorted by parameter [fill_rate])

<img width="530" alt="screen shot 2017-05-24 at 10 02 08 am" src="https://cloud.githubusercontent.com/assets/17755587/26415765/76f342ee-4068-11e7-8d1f-209077da513f.png">

```bash
$ node domain.js -d Today -n 50 -p fill_rate
```

### resources
SpringServe API Docs: https://springserve.atlassian.net/wiki/pages/viewpage.action?pageId=12517384

* needs refinement, organization, documentation, and usage examples
