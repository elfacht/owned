<template lang="html">
  <div>
    <ul>
      <li v-for="item in corporations" :key="item.id">
        <router-link :to="{path: '/corporations/' + item.slug}">
          {{item.title}}
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'CorporationsListing',
  data () {
    return {
      errors: []
    }
  },
  metaInfo: {
    title: 'Corporations',
    titleTemplate: null
  },
  computed: {
    ...mapState([
      'corporations',
      'loading'
    ])
  },
  mounted: function () {
    this.getCorporations()
  },
  methods: {
    /**
     * Get recipes by type
     * @param  {String} type
     * @return {Callback}
     */
    getCorporations: function () {
      this.$store.dispatch('LOAD_CORPORATIONS_LIST')
    }
  }
}
</script>

<style lang="css" scoped>
</style>
