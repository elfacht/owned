import Vue from 'vue'
import Router from 'vue-router'
import Meta from 'vue-meta'
import Home from '@/components/Home'
import BreweriesListing from '@/components/BreweriesListing'
import BreweriesDetail from '@/components/BreweriesDetail'
import CorporationsListing from '@/components/CorporationsListing'

Vue.use(Router)
Vue.use(Meta)

export default new Router({
  routes: [
    /**
     * Homepage
     */
    {
      path: '/',
      name: 'Home',
      component: Home
    },

    /**
     * Brands List
     */
    {
      path: '/breweries/',
      name: 'BreweriesListing',
      component: BreweriesListing
    },

    /**
     * Brand detail
     */
    {
      path: '/breweries/:slug',
      name: 'BreweriesDetail',
      component: BreweriesDetail
    },

    /**
     * Corporations
     */
    {
      path: '/corporations/',
      name: 'CorporationsListing',
      component: CorporationsListing
    }

    /**
     * Company detail
     */
    // {
    //   path: '/companies/:slug',
    //   name: 'CompaniesDetail',
    //   component: CompaniesDetail
    // },
  ]
})
