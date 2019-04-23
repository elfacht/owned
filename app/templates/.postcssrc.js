// https://github.com/michael-ciniawsky/postcss-load-config

module.exports = {
  "plugins": {
    "postcss-import": {},
    "postcss-url": {},
    "postcss-nested": {},
    "postcss-preset-env": {
      stage: 1,
      // features: {
      //   'nesting-rules': true
      // }
    },
    "postcss-mixins": {},
    "postcss-math": {},
    "postcss-at-rules-variables": {
      atRules: ['mixin']
    },
    "postcss-grid-kiss": {},
    "css-mqpacker": {},
    "lost": {},
    // to edit target browsers: use "browserslist" field in package.json
    "autoprefixer": {},
  }
}
