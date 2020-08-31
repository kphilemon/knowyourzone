# KnowYourZone
[![Build Status](https://travis-ci.com/kphilemon/knowyourzone.svg?branch=master)](https://travis-ci.com/kphilemon/knowyourzone)
[![Coverage Status](https://coveralls.io/repos/github/kphilemon/knowyourzone/badge.svg?branch=master)](https://coveralls.io/github/kphilemon/knowyourzone?branch=master)
[![Website](https://img.shields.io/badge/website-live-brightgreen.svg)](https://knowyourzone.xyz)
[![GitHub issues](https://img.shields.io/github/issues/kphilemon/knowyourzone)](https://github.com/kphilemon/knowyourzone/issues)
[![License](https://img.shields.io/github/license/kphilemon/knowyourzone)](LICENSE.md)

KnowYourZone is a progressive web application to visualize the **COVID-19 zone classification** of each state and district in **Malaysia**.

[![Screenshot](public/img/readme-screenshot.png?raw=true)](https://raw.githubusercontent.com/kphilemon/knowyourzone/master/public/img/readme-screenshot.png)

This repository contains the **full-stack** source files for the website that is available at [**knowyourzone.xyz**](https://knowyourzone.xyz).
The front-end is built with Bootstrap while the backend is built with Express.js.


## Motivation
As the COVID-19 pandemic continues to rage in Malaysia, staying vigilant is a must, especially in hotspots. 
KnowYourZone is therefore designed to enable you to quickly lookup for your zone's COVID-19 severity, in terms of **active cases**.

Unlike other dashboards, KnowYourZone focuses on presenting the zone classification of your area in an intuitive and 
interactive manner, **without the clutters of figures and graphs** that you might not even care about, enabling you to 
**know your zone** within split seconds, if you know your geography well :)


## Getting Started
These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Installation
To get started, you will need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) 
installed on your machine.
```bash
# Clone the repository
git clone https://github.com/kphilemon/knowyourzone.git

# Go into the repository
cd knowyourzone

# Install dependencies
npm install
```

### Configuration
Next, you will need to configure the application. The detailed usage of each environment variable is documented in the [`.env.example`](.env.example) file.
```bash
# make a copy of the .env.example file
cp .env.example .env

# edit the variables using a text editor and save
nano .env
```

### Starting the Server
Once the server **starts listening**, you should be able to view the website at [`localhost:3000`](http://localhost:3000) or any 
alternative port number that you have configured previously. 
```bash
npm start

# console output
info: Data update started
info: Data update successful
info: Server is listening on port 3000
```

### Testing
Make sure all the dependencies are installed before running the test suite.
```bash
npm install
npm test
```

### Important Note
You might encounter `Failed to launch chrome` error while starting the server or running tests on Ubuntu machines.
This is due to missing dependencies as mentioned in this [puppeteer installation guide](https://github.com/puppeteer/puppeteer/issues/3443).
To fix this, simply install them by running:
```bash
sudo apt-get install gconf-service libasound2 libatk1.0-0 libatk-bridge2.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget libgbm-dev
```


## How Does It Work?
The application flow diagram below illustrates the flow of data retrieval and update for this project. The entire process is 
**automated** using [node-cron](https://www.npmjs.com/package/node-cron) and is scheduled during the [app start](https://github.com/kphilemon/knowyourzone/blob/3c3429033338414979d5f2d0959e69717a936634/app.js#L45). 
For knowyourzone.xyz, the cron job is scheduled to be run twice daily on 10AM and 10PM.
 
<p align="center">
 <a href="https://raw.githubusercontent.com/kphilemon/knowyourzone/master/public/img/readme-app-flow.png">
 <img src="public/img/readme-app-flow.png?raw=true" width="600"></a>
</p> 

1. `Data scraping` - The server launches a headless browser using [Puppeteer](utilities/data-scraper.js) to 
scrape data from the [data source](#data-source). Puppeteer is needed as the data is dynamically rendered at the source website.

2. `Rendering index.html` - Once the retrieved data is validated, the main page of the website
is re-rendered with fresh data using [Handlebars.js](utilities/hbs-renderer.js) and it is then stored 
under the [web root](public). (`index.html` is git-ignored for this reason)

3. `Updating the cache` - The data is then cached in [memory-cache](https://www.npmjs.com/package/memory-cache) for 
[**data API**](https://github.com/kphilemon/knowyourzone/wiki/Data-API) clients to consume.

4. `Notifying the admin` - A copy of the data is sent to the admin via email using [nodemailer](utilities/mailer.js) for
validation.

<p align="center">
 <a href="https://developers.google.com/speed/pagespeed/insights/?url=https%3A%2F%2Fknowyourzone.xyz%2F&tab=desktop">
 <img src="public/img/readme-lighthouse-report.png?raw=true" width="600"></a>
</p>

When a user visits the website, the fully-rendered static index.html with up-to-date data will be served. This **reduces 
the server load** and **improves the page loading speed** significantly as we have eliminated the need to perform API 
calls and client-side rendering for every page loads.

### What if the data scraping fails?
One of the challenges of web scraping is the **dynamic nature** of the internet as a result of active development. A small 
tweak on the site's structure affecting our targeted HTML element could potentially render our data scraping script **useless**. 

In the event of failed data scraping, the [data scraping script](utilities/data-scraper.js) will trigger an alert to
be sent to the admin's email. The rendering of index.html and data caching will be aborted on the spot to prevent bad 
data from reaching the public, thus **preventing the spread of misinformation**.

While the project maintainer fixes the data scraping script, the data of the application could be outdated, if the data 
source updates the data. Well, fret not as this project comes with a handy **admin API** that allows you to keep the data 
up-to-date by manually updating the data. Tedious, but it works ;)

The [**admin API**](https://github.com/kphilemon/knowyourzone/wiki/Admin-API) is basically a "forced update" trigger 
secured with API key authentication and rate limiting. Be sure to configure a *secure* `ADMIN_API_KEY` in the .env file 
to prevent the API from being misused.


## API Reference
For detailed API documentation (both admin and data APIs), please refer the [Github Wiki](https://github.com/kphilemon/knowyourzone/wiki).  


## FAQ
<details>
  <summary>I found a bug / have a cool idea. How can I contribute?</summary>
  Feel free to file an issue with a respective title and description using the <a href="https://github.com/kphilemon/knowyourzone/issues">issue tracker</a> and thank you for your passion!
</details>

<details>
  <summary>Why does it only show data for Malaysia?</summary>
  Each country has its own zoning system and probably more states/districts than Malaysia. I am incapable of studying and validating all the data, unfortunately.
</details>

<details>
  <summary>Can I use this project for other visualization? (COVID-19 in other countries/other data)</summary>
  Feel free to do so if it fits your requirement. Please refer the <a href="#license">license</a> section for more details.
</details>

<details>
  <summary>I still have questions. Where do I ask?</summary>
  Shoot me an email at <a href="mailto:kphilemon0529@gmail.com">kphilemon0529@gmail.com</a>. 
</details>


## License
This project is licensed under the [MIT License](LICENSE.md). While you are free to use and/or redeploy the codes as a 
service/website, it **must not**:

- identify itself as being part of `knowyourzone.xyz`
- use the brand name and [logo](https://raw.githubusercontent.com/kphilemon/knowyourzone/master/public/img/og-image.png) of KnowYourZone

All the associating image assets under the [public/img](public/img) directory and the brand name, `KnowYourZone` are 
copyrighted and therefore excluded from the MIT License. You should not include/use them as part of your service as you 
might confuse or mislead people if you do.


## Author
Connect with me on [LinkedIn](https://www.linkedin.com/in/philemon-khor) or follow me on [Github](https://github.com/kphilemon).


## Data source
The data is sourced from the awesome [Malaysiakini COVID-19 Tracker](https://newslab.malaysiakini.com/covid-19).

*Disclaimer: knowyourzone.xyz is not affiliated, associated, maintained by, or in any way officially connected with malaysiakini.com.*