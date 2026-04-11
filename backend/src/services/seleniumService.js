const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

exports.runSeleniumTest = async (url) => {
    let driver;
    try {
        // Configure Chrome headless options
        const options = new chrome.Options();
        options.addArguments('--headless=new');
        options.addArguments('--no-sandbox');
        options.addArguments('--disable-dev-shm-usage');
        options.addArguments('--disable-gpu');
        options.addArguments('--window-size=1280,800');
        options.addArguments(
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );

        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();

        // Navigate to the URL with a 30s page load timeout
        await driver.manage().setTimeouts({ pageLoad: 30000 });
        await driver.get(url);

        // Wait for the body to be present before querying
        await driver.wait(until.elementLocated(By.css('body')), 10000);

        // --- 1. Basic Page Info ---
        const pageTitle   = await driver.getTitle();
        const currentUrl  = await driver.getCurrentUrl();

        // --- 2. DOM Structure Counts ---
        const formCount   = (await driver.findElements(By.css('form'))).length;
        const inputCount  = (await driver.findElements(By.css('input'))).length;
        const buttonCount = (await driver.findElements(By.css('button'))).length;
        const linkCount   = (await driver.findElements(By.css('a'))).length;
        const imageCount  = (await driver.findElements(By.css('img'))).length;

        // --- 3. First H1 heading ---
        let h1Text = null;
        try {
            const h1 = await driver.findElement(By.css('h1'));
            h1Text = await h1.getText();
        } catch (_) {
            // No h1 element on page
        }

        // --- 4. Cookies ---
        const cookies     = await driver.manage().getCookies();
        const cookieCount = cookies.length;

        // --- 5. Meta Description via JS ---
        const metaDescription = await driver.executeScript(() => {
            const el = document.querySelector('meta[name="description"]');
            return el ? el.getAttribute('content') : null;
        });

        // --- 6. Check for viewport meta tag ---
        const hasViewportMeta = await driver.executeScript(() => {
            return !!document.querySelector('meta[name="viewport"]');
        });

        // --- 7. Check for inline scripts (potential XSS surface) ---
        const inlineScriptCount = await driver.executeScript(() => {
            return document.querySelectorAll('script:not([src])').length;
        });

        // --- 8. External script count ---
        const externalScriptCount = await driver.executeScript(() => {
            return document.querySelectorAll('script[src]').length;
        });

        return {
            engine: 'Selenium WebDriver (Chrome)',
            pageTitle,
            currentUrl,
            domStructure: {
                formCount,
                inputCount,
                buttonCount,
                linkCount,
                imageCount,
            },
            heading: {
                h1: h1Text || 'Not found',
            },
            cookies: {
                count: cookieCount,
                names: cookies.map(c => c.name),
            },
            seo: {
                metaDescription: metaDescription || 'Missing',
                hasViewportMeta,
            },
            scripts: {
                inlineScriptCount,
                externalScriptCount,
            },
        };

    } catch (error) {
        console.error(`[Selenium] Error testing ${url}:`, error.message);
        // Return a structured error so the overall test doesn't fail
        return {
            engine: 'Selenium WebDriver (Chrome)',
            error: error.message,
        };
    } finally {
        if (driver) {
            await driver.quit();
        }
    }
};
