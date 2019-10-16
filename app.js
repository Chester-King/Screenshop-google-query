const express = require('express');
const puppeteer = require('puppeteer');
const app = express();

const port = process.env.PORT || 3000;

app.use(express.json());

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

app.get('', (req, res) => {
  (async () => {
    const browser = await puppeteer.launch({
      headless: true,
      defaultViewport: null,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized']
    });
    const options = {
      path: `web${req.query.search}.pdf`,
      format: 'A4'
    };
    const page = await browser.newPage();
    let element, formElement, tabs;
    const navigationPromise = page.waitForNavigation();

    await page.evaluateOnNewDocument(() => {
      const originalQuery = window.navigator.permissions.query;
      return (window.navigator.permissions.query = parameters =>
        parameters.name === 'notifications'
          ? Promise.resolve({ state: Notification.permission })
          : originalQuery(parameters));
    });
    const userAgent =
      'Mozilla/5.0 (X11; Linux x86_64)' +
      'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.39 Safari/537.36';
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false
      });
    });
    await page.setUserAgent(userAgent);

    await page.goto(`https://www.google.com/`, { waitUntil: 'networkidle0' });

    console.log('Page Armed');

    element = await page.$x(`//*[@name="q"]`);
    await element[0].type(req.query.search);

    console.log('Query Entered');

    await page.keyboard.press(`Enter`);

    console.log('Reached the query');

    try {
      await page.waitForSelector(
        '.hdtb-mitem:nth-child(3) > .q > .HF9Klc > svg > path:nth-child(2)'
      );
      await page.click(
        '.hdtb-mitem:nth-child(3) > .q > .HF9Klc > svg > path:nth-child(2)'
      );

      console.log('Click code Ran ?');
      await navigationPromise;

      await sleep(4000);
    } catch (error) {
      console.log('Caught');
    }

    await page.pdf(options);

    console.log('PDF code Ran ?');

    await sleep(6000);

    await browser.close();
    res.send('Done');
  })();
});

app.listen(port, () => {
  console.log('Server is up on port ' + port);
});
