<template>
  <div id="app">
    <Header />
    <router-view :key="$route.fullPath"/>
  </div>
</template>

<script>
import Header from './components/Header'

export default {
  name: 'App',
  components: {
    Header
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
