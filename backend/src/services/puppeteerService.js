const puppeteer = require('puppeteer');

exports.runDetailedTest = async (url) => {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();

        // Use a real browser user-agent to reduce bot-blocking false positives
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );

        // [FIX 3] Collect ALL console errors including async ones
        const consoleErrors = [];
        page.on('pageerror', (err) => {
            consoleErrors.push(`Page Error: ${err.message}`);
        });
        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });
        
        // 1. Availability and Performance
        const startTime = Date.now();
        const response = await page.goto(url, { waitUntil: 'load', timeout: 30000 });
        
        // [FIX 3] Wait 3 extra seconds after load to catch async/lazy JS errors
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const loadTime = Date.now() - startTime;
        const statusCode = response ? response.status() : 500;

        // Security Headers
        const headers = response ? response.headers() : {};
        const securityHeaders = {
            hsts: !!headers['strict-transport-security'],
            xFrameOptions: !!headers['x-frame-options'],
            xContentTypeOptions: !!headers['x-content-type-options']
        };
        
        // 2. SEO Checks
        const seoData = await page.evaluate(() => {
            const getMetaContent = (name) => {
                const el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
                return el ? el.getAttribute('content') : null;
            };
            return {
                title: document.title || null,
                metaDescription: getMetaContent('description') || getMetaContent('og:description'),
                missingAltTagsCount: document.querySelectorAll('img:not([alt]), img[alt=""]').length
            };
        });

        // 3. Desktop Screenshot
        await page.setViewport({ width: 1280, height: 800 });
        const desktopScreenshot = await page.screenshot({ encoding: 'base64', type: 'webp', quality: 60 });
        
        // 4. [FIX 2] Comprehensive Mobile Responsiveness Check
        await page.setViewport({ width: 375, height: 812, isMobile: true });
        await page.setUserAgent('Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36');
        await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });

        const responsiveness = await page.evaluate(() => {
            // Check 1: Viewport meta tag (required for mobile)
            const viewportMeta = document.querySelector('meta[name="viewport"]');
            const hasViewportMeta = !!viewportMeta;

            // Check 2: No horizontal overflow (content fits within screen)
            const noHorizontalOverflow = document.documentElement.scrollWidth <= window.innerWidth;

            // Check 3: No tiny unreadable text (< 12px font size)
            const textElements = document.querySelectorAll('p, span, li, a, h1, h2, h3, h4, h5, h6, td, th, label, button');
            let tinyTextCount = 0;
            textElements.forEach(el => {
                const fontSize = parseFloat(window.getComputedStyle(el).fontSize);
                if (fontSize > 0 && fontSize < 12) tinyTextCount++;
            });

            // Check 4: Touch targets are large enough for fingers (>= 44x44px recommended by Google)
            const touchTargets = document.querySelectorAll('a, button, input[type="submit"], input[type="button"]');
            let smallTargetCount = 0;
            touchTargets.forEach(el => {
                const rect = el.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
                    smallTargetCount++;
                }
            });

            const mobileFriendly = hasViewportMeta && noHorizontalOverflow && tinyTextCount === 0;

            return {
                mobileFriendly,
                hasViewportMeta,
                noHorizontalOverflow,
                tinyTextCount,
                smallTouchTargets: smallTargetCount
            };
        });

        // 5. [FIX 1] Check broken links — only flag real 4xx/5xx errors, not redirects
        const extractedLinks = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a'))
                .map(a => a.href)
                .filter(href => href && href.startsWith('http'));
        });

        const uniqueLinks = [...new Set(extractedLinks)].slice(0, 15);
        const brokenLinks = [];

        await Promise.all(
            uniqueLinks.map(async (linkUrl) => {
                try {
                    const newPage = await browser.newPage();
                    // Use real browser user-agent for each link check
                    await newPage.setUserAgent(
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    );
                    const linkResp = await newPage.goto(linkUrl, {
                        waitUntil: 'domcontentloaded',
                        timeout: 8000
                    });
                    const status = linkResp ? linkResp.status() : 0;

                    // [FIX 1] Only 4xx and 5xx are truly broken. 3xx redirects are valid links.
                    // Also ignore 429 (Too Many Requests) and 403 (Forbidden) which are usually bot-protection, not real broken links
                    if (status >= 400 && status !== 429 && status !== 403) {
                        brokenLinks.push({ url: linkUrl, status: `${status} Error` });
                    }
                    await newPage.close();
                } catch (e) {
                    // Silently skip timeouts/bot-blocked pages to avoid false positives.
                    // A timeout does NOT mean a link is broken for real users.
                }
            })
        );
        
        return {
            status: statusCode,
            responseTime: `${loadTime}ms`,
            brokenLinks,
            linksChecked: uniqueLinks.length,
            functional: {
                consoleErrors
            },
            security: securityHeaders,
            seo: {
                title: seoData.title,
                hasDescription: !!seoData.metaDescription,
                missingAltTags: seoData.missingAltTagsCount
            },
            responsiveness,
            desktopScreenshot: `data:image/webp;base64,${desktopScreenshot}`
        };

    } catch (error) {
        console.error(`Error processing ${url}:`, error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};
