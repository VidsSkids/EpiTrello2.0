const fs = require('fs');
const path = require('path');

module.exports = function (config) {
  const braveWin = 'C:\\\\Program Files\\\\BraveSoftware\\\\Brave-Browser\\\\Application\\\\brave.exe';
  const braveWinX86 = 'C:\\\\Program Files (x86)\\\\BraveSoftware\\\\Brave-Browser\\\\Application\\\\brave.exe';

  if (!process.env.CHROME_BIN) {
    if (fs.existsSync(braveWin)) {
      process.env.CHROME_BIN = braveWin;
    } else if (fs.existsSync(braveWinX86)) {
      process.env.CHROME_BIN = braveWinX86;
    }
  }

  const isHeadless = process.env.KARMA_HEADLESS === 'true';

  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
    ],
    client: {
      jasmine: { random: false },
      clearContext: false,
    },
    coverageReporter: {
      dir: path.join(__dirname, './coverage'),
      subdir: '.',
      reporters: [{ type: 'html' }, { type: 'text-summary' }],
    },
    reporters: ['progress', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: [isHeadless ? 'BraveHeadless' : 'Brave'],
    customLaunchers: {
      Brave: {
        base: 'Chrome',
        flags: [],
      },
      BraveHeadless: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-gpu'],
      },
    },
    singleRun: false,
    restartOnFileChange: true,
  });
};
