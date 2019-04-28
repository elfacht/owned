// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import VueResource from 'vue-resource'
import VeeValidate from 'vee-validate'
import App from './App'
import store from './store'
import router from './router'
import NProgress from 'nprogress'
import axios from 'axios'
import { stringify } from 'qs'

import '@/assets/app.css'

Vue.config.productionTip = false

Vue.use(require('vue-moment'))
Vue.use(VeeValidate)
Vue.use(VueResource)
// Vue.http.options.root = '/'
Vue.http.options.emulateJSON = true
Vue.http.options.emulateHTTP = true

const axiosInstance = axios.create({
  headers: {
    'X-CSRF-Token': window.csrfTokenValue,
    'X-Requested-With': 'XMLHttpRequest',
    'Content-Type': 'application/json'
  },
  transformRequest: [
    function (data) {
      return stringify(data)
    }
  ],
  method: 'POST'
})

Vue.prototype.$axios = axiosInstance

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
