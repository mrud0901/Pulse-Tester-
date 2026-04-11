const puppeteerService = require('../services/puppeteerService');
const seleniumService  = require('../services/seleniumService');

// POST /api/test  — runs Puppeteer + Selenium in parallel
exports.runTest = async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required.' });
        }

        // Add protocol if missing
        let validUrl = url;
        if (!/^https?:\/\//i.test(url)) {
            validUrl = 'http://' + url;
        }

        console.log(`Starting full test (Puppeteer + Selenium) for: ${validUrl}`);

        // Run both engines in parallel for speed
        const [puppeteerResults, seleniumResults] = await Promise.all([
            puppeteerService.runDetailedTest(validUrl),
            seleniumService.runSeleniumTest(validUrl),
        ]);

        res.json({
            ...puppeteerResults,
            selenium: seleniumResults,
        });

    } catch (error) {
        console.error('Error running test:', error);
        res.status(500).json({ error: 'Failed to run test on the provided URL. Make sure it is reachable.' });
    }
};

// POST /api/selenium-test  — runs Selenium only
exports.runSeleniumOnly = async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required.' });
        }

        let validUrl = url;
        if (!/^https?:\/\//i.test(url)) {
            validUrl = 'http://' + url;
        }

        console.log(`Starting Selenium-only test for: ${validUrl}`);

        const results = await seleniumService.runSeleniumTest(validUrl);
        res.json(results);

    } catch (error) {
        console.error('Error running Selenium test:', error);
        res.status(500).json({ error: 'Failed to run Selenium test on the provided URL.' });
    }
};
