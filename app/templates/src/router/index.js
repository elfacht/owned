import Vue from 'vue'
import Router from 'vue-router'
import Meta from 'vue-meta'
import Home from '@/components/Home'
import BreweriesList from '@/components/BreweriesList'
import BreweriesDetail from '@/components/BreweriesDetail'
import CreateBrewery from '@/components/CreateBrewery'
import CorporationsList from '@/components/CorporationsList'
import CorporationsDetail from '@/components/CorporationsDetail'

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
      name: 'BreweriesList',
      component: BreweriesList
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
     * Brand detail
     */
    {
      path: '/create/brewery',
      name: 'CreateBrewery',
      component: CreateBrewery
    },

    /**
     * Corporations
     */
    {
      path: '/corporations/',
      name: 'CorporationsList',
      component: CorporationsList
    },

    /**
     * Brand detail
     */
    {
      path: '/corporations/:slug',
      name: 'CorporationsDetail',
      component: CorporationsDetail
    }

    /**
     * Company detail
     */
    // {
    //   path: '/companies/:slug',
    //   name: 'CompaniesDetail',
    //   component: CompaniesDetail
    // },
  ],
  scrollBehavior (to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { x: 0, y: 0 }
    }
  }

})
