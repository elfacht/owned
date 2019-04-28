<template>
  <div id="app">
    <app-header>
      <Search />
      <Navigation />
    </app-header>
    <router-view :key="$route.fullPath"/>
  </div>
</template>

<script>
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
</style>
