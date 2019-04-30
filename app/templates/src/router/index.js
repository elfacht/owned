import Vue from 'vue'
import Router from 'vue-router'
import Meta from 'vue-meta'
import Home from '@/components/Home'
import BreweriesList from '@/components/BreweriesList'
import BreweriesDetail from '@/components/BreweriesDetail'
import Create from '@/components/Create'
import OwnersList from '@/components/OwnersList'
import OwnersDetail from '@/components/OwnersDetail'
import NotFound from '@/components/NotFound'
import Header from '@/components/AppHeader'
import Login from '@/components/Login'

Vue.use(Router)
Vue.use(Meta)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '*',
      component: NotFound
    },

    /**
     * Login
     */
    {
      path: '/login',
      name: 'Login',
      components: {
        default: Login
      },
      props: {
        default: true
      }
    },

    /**
     * Homepage
     */
    {
      path: '/',
      name: 'Home',
      components: {
        default: Home,
        header: Header
      }
    },

    {
      path: '/breweries/page/:id',
      name: 'BreweriesPaged',
      components: {
        default: BreweriesList,
        header: Header
      }
    },

    /**
     * Brands List
     */
    {
      path: '/breweries/',
      name: 'BreweriesList',
      components: {
        default: BreweriesList,
        header: Header
      }
    },

    /**
     * Brand detail
     */
    {
      path: '/breweries/:slug',
      name: 'BreweriesDetail',
      components: {
        default: BreweriesDetail,
        header: Header
      }
    },

    /**
     * Brand detail
     */
    {
      path: '/create/:type',
      name: 'CreateBrewery',
      components: {
        default: Create
      }
    },

    /**
     * Owners
     */
    {
      path: '/owners/',
      name: 'OwnersList',
      components: {
        default: OwnersList,
        header: Header
      }
    },

    /**
     * Brand detail
     */
    {
      path: '/owners/:slug',
      name: 'OwnersDetail',
      components: {
        default: OwnersDetail,
        header: Header
      }
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
    }
  }

})
