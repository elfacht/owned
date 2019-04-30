<template>
  <div :class='$style.container'>
    HOME
  </div>
</template>

<script>
import NProgress from 'nprogress'

export default {
  name: 'Home',

  mounted: function () {
    // Remove progress bar
    NProgress.done()
  },

  metaInfo () {
    return {
      title: 'owned',
      titleTemplate: null
    }
  }
}
</script>

<style lang='postcss' module>
@import '../assets/_mixins';
</style>
