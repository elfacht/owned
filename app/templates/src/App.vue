<template>
  <div id="app">
    <transition name="fade">
      <router-view name="header"></router-view>
    </transition>
      <!-- <app-header>
        <Search />
        <Navigation />
      </app-header> -->
    <transition name="fade">
      <router-view v-if="!loadingUser" :key="$route.fullPath" :loggedIn="loggedIn" />
    </transition>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import AppHeader from './components/AppHeader'
import Search from './components/AppSearch'
import Navigation from './components/AppNavigation'

export default {
  name: 'App',
  components: {
    AppHeader,
    Search,
    Navigation
  },
  metaInfo: {
    title: 'owned',
    titleTemplate: '%s | owned'
  },
  computed: {
    ...mapState([
      'user',
      'loggedIn',
      'loadingUser'
    ])
  },
  mounted: function () {
    this.$store.dispatch('LOAD_USER')
  },
  ready: function () {

  }
}
</script>

<style lang="postcss">
@import 'assets/_nprogress';

#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
  min-height: 100vh;
  width: 100%;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity .2s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
</style>
