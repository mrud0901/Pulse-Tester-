const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');

// Full test: Puppeteer + Selenium in parallel
router.post('/test', testController.runTest);

// Selenium-only test
router.post('/selenium-test', testController.runSeleniumOnly);

module.exports = router;
