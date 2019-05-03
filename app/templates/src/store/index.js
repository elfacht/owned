import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'
import createCache from 'vuex-cache'
import NProgress from 'nprogress'

Vue.use(Vuex)

const store = new Vuex.Store({
  state: {
    brewery: [],
    breweries: [],
    breweriesTotal: 0,
    latestBreweries: [],
    loadingLatestBreweries: { type: Boolean },

    ownersTotal: 0,
    owners: [],
    owner: [],

    pagination: [],
    user: [],
    loggedIn: { type: Boolean },
    loading: { type: Boolean },
    loadingUser: { type: Boolean }
  },
  actions: {
    LOAD_USER: function ({commit, state}) {
      let pageUrl = '/api/user'

      axios.get(pageUrl).then((response) => {
        commit('SET_USER', {
          user: response.data
        })

        NProgress.done()
      })
    },

    /**
     * Load default recipe list on Home
     * @param  {Function} commit
     * @param  {Object}   state
     * @param  {Number}   pageNum [current page number]
     * @return {Function}
     */
    LOAD_BREWERIES_LIST: function ({commit, state, getters}, {pageNum}) {
      pageNum = pageNum || 1
      let pageUrl = '/api/breweries?page=' + pageNum

      axios.get(pageUrl).then((response) => {
        commit('SET_BREWERIES_LIST', {
          list: response.data.data,
          meta: response.data.meta,
          pagination: response.data.meta.pagination
        }, getters)

        // Remove progress bar
        NProgress.done()

        // Scroll to top
        window.scrollTo(0, 0)
      }, (err) => {
        console.log(err)
      })
    },

    /**
     * Load brand single item
     * @param  {Function} commit
     * @param  {Object}   state
     * @param  {String}   item [item slug]
     * @return {Function}
     */
    LOAD_BREWERIES_ITEM: function ({commit, state}, {item}) {
      if (item) {
        axios.get('/api/breweries/' + item, item).then((response) => {
          commit('SET_BREWERIES_ITEM', {brewery: response.data})

          // Remove progress bar
          NProgress.done()
        }, (err) => {
          console.log(err)
        })
      }
    },

    /**
     * Load brand single item
     * @param  {Function} commit
     * @param  {Object}   state
     * @param  {String}   item [item slug]
     * @return {Function}
     */
    LOAD_LATEST_BREWERIES: function ({commit, state, getters}) {
      axios.get('/api/latest/breweries').then((response) => {
        commit('SET_LATEST_BREWERIES', {
          list: response.data.data
        })
      }, (err) => {
        console.log(err)
      })
    },

    /**
     * Load default recipe list on Home
     * @param  {Function} commit
     * @param  {Object}   state
     * @param  {Number}   pageNum [current page number]
     * @return {Function}
     */
    LOAD_OWNERS_LIST: function ({commit, state, getters}) {
      let pageUrl = '/api/owners'

      axios.get(pageUrl).then((response) => {
        commit('SET_OWNERS_LIST', {
          list: response.data.data,
          meta: response.data.meta,
          pagination: response.data.meta.pagination
        }, getters)

        // Remove progress bar
        NProgress.done()
      }, (err) => {
        console.log(err)
      })
    },

    /**
     * Load brand single item
     * @param  {Function} commit
     * @param  {Object}   state
     * @param  {String}   item [item slug]
     * @return {Function}
     */
    LOAD_OWNERS_ITEM: function ({commit, state}, {item}) {
      if (item) {
        axios.get('/api/owners/' + item, item).then((response) => {
          commit('SET_OWNERS_ITEM', {owner: response.data})

          // Remove progress bar
          NProgress.done()
        }, (err) => {
          console.log(err)
        })
      }
    },

    /**
     * Reset brand when leaving view
     * @param  {Function} commit
     * @return {Function}
     */
    RESET_BREWERY: function ({commit}) {
      commit('SET_BREWERY_RESET', {brewery: null})
    },

    /**
     * Reset brand when leaving view
     * @param  {Function} commit
     * @return {Function}
     */
    RESET_OWNER: function ({commit}) {
      commit('SET_OWNER_RESET', {owner: null})
    }
  },
  mutations: {
    SET_USER: (state, {user}) => {
      state.user = user
      state.loggedIn = user.loggedIn
      state.loadingUser = false
    },

    /**
     * Set recipe list states
     * @param {Array} state
     * @param {Array} list        [recipe item]
     * @param {Array} meta        [recipe meta data]
     * @param {Array} pagination  [recipe meta pagination]
     */
    SET_BREWERIES_LIST: (state, {list, meta, pagination, getters}) => {
      pagination = {
        total: pagination.total,
        current_page: pagination.current_page,
        next_page_url: pagination.links.next,
        prev_page_url: pagination.links.previous,
        total_pages: pagination.total_pages
      }

      state.breweries = list
      state.meta = meta
      state.loading = false
      state.pagination = pagination
      state.breweriesTotal = pagination.total
    },

    /**
     * Set brand states
     * @param {Array} state
     * @param {Array} brewery
     */
    SET_BREWERIES_ITEM: (state, {brewery}) => {
      state.brewery = brewery
      state.loading = false
    },

    /**
     * Set recipe list states
     * @param {Array} state
     * @param {Array} list        [recipe item]
     * @param {Array} meta        [recipe meta data]
     * @param {Array} pagination  [recipe meta pagination]
     */
    SET_LATEST_BREWERIES: (state, {list, getters}) => {
      state.latestBreweries = list
      state.loadingLatestBreweries = false
      state.loading = false
    },

    /**
     * Set recipe list states
     * @param {Array} state
     * @param {Array} list        [recipe item]
     * @param {Array} meta        [recipe meta data]
     * @param {Array} pagination  [recipe meta pagination]
     */
    SET_OWNERS_LIST: (state, {list, meta, pagination, getters}) => {
      pagination = {
        total: pagination.total,
        current_page: pagination.current_page,
        next_page_url: pagination.links.next,
        prev_page_url: pagination.links.previous,
        total_pages: pagination.total_pages
      }

      state.owners = list
      state.loading = false
      // state.pagination = pagination
      state.ownersTotal = pagination.total
    },

    /**
     * Set brand states
     * @param {Array} state
     * @param {Array} brewery
     */
    SET_OWNERS_ITEM: (state, {owner}) => {
      state.owner = owner
      state.loading = false
    },

    /**
     * Set brand reset states
     * @param {Array} state
     * @param {Array} brewery
     */
    SET_BREWERY_RESET: (state, {brewery}) => {
      state.brewery = {}
      state.loading = false
    },

    /**
     * Set brand reset states
     * @param {Array} state
     * @param {Array} brewery
     */
    SET_OWNER_RESET: (state, {owner}) => {
      state.owner = {}
      state.loading = false
    }
  },
  getters: {
    breweriesCount: state => {
      return state.breweriesTotal
    },
    ownersCount: state => {
      console.log('total', state.ownersTotal)
      return state.ownersTotal
    },
    latestBreweries: state => {
      return state.breweries
    }
  },
  plugins: [createCache()]
})

export default store
