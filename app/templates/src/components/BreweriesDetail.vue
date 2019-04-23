<template lang="html">
  <div :class='$style.container'>
    <div v-if="!loading">

      <h1>{{brewery.title}}</h1>

      <p v-if="brewery.country">
        {{brewery.country.title}}
      </p>

      <div v-if="brewery.category">
        {{brewery.category.title}}
      </div>

      <div v-if="brewery.note" v-html="brewery.note"></div>

      <h2>Owned by</h2>
      <ul v-if="brewery.corporation">
        <li v-for="item in brewery.corporation" :key="item.id">
          {{item.title}}
        </li>
      </ul>
    </div>

  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'BreweriesDetail',
  data () {
    return {
      errors: []
    }
  },
  computed: {
    ...mapState([
      'brewery',
      'loading'
    ])
  },
  mounted: function () {
    this.$store.dispatch('LOAD_BREWERIES_ITEM', {item: this.$route.params.slug})
    this.$store.state.loading = true
  },
  beforeUpdate: function () {
    this.title = this.brewery.title
  },
  destroyed: function () {
    this.$store.dispatch('RESET_BREWERY')
  },
  metaInfo () {
    return {
      title: this.title,
      titleTemplate: null
    }
  }
}
</script>

<style lang="postcss" module>
@import '../assets/_mixins';

.container {
  @mixin container-padding;
  lost-center: var(--grid-max-width);
}
</style>
