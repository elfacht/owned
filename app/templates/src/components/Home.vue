<template>
  <div :class='$style.container'>

  </div>
</template>

<script>
// import { mapState, mapGetters } from 'vuex'
// import Header from './Header'
import NProgress from 'nprogress'

export default {
  name: 'Home',
  components: {
  },
  metaInfo () {
    return {
      title: 'owned',
      titleTemplate: null
    }
  },
  mounted: function () {
    // Remove progress bar
    NProgress.done()
  }
}
</script>

<style lang='postcss' module>
@import '../assets/_mixins';
</style>
