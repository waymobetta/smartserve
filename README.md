# smartserve

Simple CLI for programmatic reporting and network optimization on SpringServe AdServer

### installation

install using node package manager
```bash
npm install smartserve
```

or clone repository
```bash
git clone https://github.com/waymobetta/smartserve.git
npm install
update config.json with credentials
```

### usage
Example: Maestro (displays potential demand tags for supply tag [ID: 55173])
```bash
node maestro.js -d Today -s 55173
```

Example: Synopsis (displays top supply tag, demand tag, pair (supply/demand), and domain for date range [Today] by parameter [fill_rate])
```bash
SORT BY FILL RATE: node synopsis.js -d Today -p fill_rate
SORT BY REVENUE: node synopsis.js -d Today -p revenue
```

Example: Domain (displays top [50] domains for date range [Today] sorted by parameter [fill_rate])
```bash
node domain.js -d Today -n 50 -p fill_rate
```

### resources
SpringServe API Docs: https://springserve.atlassian.net/wiki/pages/viewpage.action?pageId=12517384

* needs refinement, organization, documentation, and usage examples
