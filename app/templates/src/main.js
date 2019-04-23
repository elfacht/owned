// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import store from './store'
import router from './router'
import NProgress from 'nprogress'

import '@/assets/app.css'

Vue.config.productionTip = false

Vue.use(require('vue-moment'))

/**
 * Activate progress bar before resolving path,
 * stop it in store/index.js
 */
router.beforeResolve((to, from, next) => {
  if (to.name) {
    NProgress.start()
  }
  next()
})

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  components: { App },
  template: '<App/>'
})
