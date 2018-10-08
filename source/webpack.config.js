const path = require('path');

module.exports = [
  {
    name: 'develop',
    entry: '../app/templates/assets/js/main.js',
    mode: 'development',
    output: {
      path: path.resolve(__dirname, '../app/web/assets/js/'),
      filename: 'app.js'
    }
  },
  {
    name: 'production',
    entry: '../app/templates/assets/js/main.js',
    mode: 'production',
    output: {
      path: path.resolve(__dirname, '../app/web/assets/js/'),
      filename: 'app.min.js'
    }
  }
];
