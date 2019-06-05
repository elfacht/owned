<template lang="html">
  <transition name="fade">
    <div :class='$style.container'>
      <div v-if="loading">
        loading …
      </div>
      <div v-else :class="$style.card">
        <Ownership
          v-if="brewery.ownership"
          :ownership="brewery.ownership"
        />

        <div :class="$style.inner">
          <h1 :class="$style.title">
            {{brewery.title}}
          </h1>

          <div
            v-if="brewery.city || brewery.country"
            :class="$style.location"
          >
            <template v-if="brewery.city">
              {{brewery.city}},
            </template>
            <template v-if="brewery.country">
              {{brewery.country.title}}
            </template>

            <template v-if="brewery.founded">
              <template v-if="brewery.city || brewery.country">
                –
              </template>
              opened {{brewery.founded | moment('YYYY')}}
            </template>
          </div>

          <div v-if="brewery.category">
            {{brewery.category.title}}
          </div>

          <div v-if="brewery.note" v-html="brewery.note"></div>
        </div>

      </div>

    </div>
  </transition>
</template>

<script>
import { mapState } from 'vuex'
import Ownership from './BreweriesDetailOwnership'

export default {
  name: 'BreweriesDetail',

  components: {
    Ownership
  },

  data () {
    return {
      title: this.title
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
      title: this.title
    }
  }
}
</script>

<style lang="postcss" module>
@import '../assets/_mixins';

@media (--md) {
  .container {
    @mixin container-padding;
    lost-center: var(--grid-max-width);
  }
}

.card {
  @mixin baseline 5, margin-bottom;
  background-color: #fff;
  box-shadow: 0 4px 20px rgba(108, 122, 137, .3);
  border-radius: 3px;
  overflow: hidden;
  width: 100%;
}

.inner {
  @mixin baseline 3, padding;
  @mixin baseline 5, padding-bottom;
}

@media (--lg) {
  .inner {
    @mixin baseline 5, padding;
    @mixin baseline 4, padding-top;
  }
}

.location {
  @mixin baseline 1, margin-top;
  @mixin font 14, 24;
}

.title {
  @mixin font 32, 40, var(--heading-font);
  font-weight: 200;
  hyphens: auto;
  margin: 0;
}

@media (--lg) {
  .title {
    @mixin font 64, 72, var(--heading-font);
    transform: translateX(-5px);
  }
}

.subtitle {
  color: var(--color-bombay);
}
</style>
