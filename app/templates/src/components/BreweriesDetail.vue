<template lang="html">
  <div :class='$style.container'>
    <div v-if="loading">
      loading …
    </div>
    <div v-else :class="$style.card">
      <Ownership v-if="brewery.ownership" v-bind:ownership="brewery.ownership" />

      <div :class="$style.inner">
        <h1 :class="$style.title">{{brewery.title}}</h1>

        <p v-if="brewery.country">
          {{brewery.city}}, {{brewery.country.title}}
        </p>

        <div v-if="brewery.category">
          {{brewery.category.title}}
        </div>

        <div v-if="brewery.note" v-html="brewery.note"></div>
      </div>

    </div>

  </div>
</template>

<script>
import { mapState } from 'vuex'
import Ownership from './Ownership'

export default {
  name: 'BreweriesDetail',
  components: {
    Ownership
  },
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

.card {
  background-color: #fff;
  box-shadow: 0 4px 20px rgba(108, 122, 137, .3);
  width: 100%;
}

.inner {
  @mixin baseline 5, padding-top;
  @mixin baseline 3, padding-bottom;
  @mixin baseline 5, padding-left;
  @mixin baseline 5, padding-right;
}

.title {
  @mixin font 64, 72, var(--heading-font);
  font-weight: 200;
  margin: 0;
  transform: translateX(-7px);
}
</style>
