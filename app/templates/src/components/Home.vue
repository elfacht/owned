<template>
  <div :class='$style.container'>

    <h2 :class="$style.recently">
      Recently added
    </h2>

    <div :class="$style.widgets">
      <div :class="$style.widget">
        <h3 :class="$style.headline">
          Breweries
        </h3>

        <div :class="$style.body">
          <div v-if="loading">
            <Spinner />
          </div>
          <template v-else>
            <div v-for="item in latestBreweries" :key="item.id">
              {{item.title}}
            </div>
          </template>
        </div>
      </div>

      <!-- <div :class="$style.widget">

          <h3 :class="$style.headline">
            Breweries
          </h3>
          <div v-for="item in latestBreweries" :key="item.id">
            {{item.title}}
          </div>
      </div> -->
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import NProgress from 'nprogress'
import Spinner from './BaseSpinner'

export default {
  name: 'Home',

  components: {
    Spinner
  },

  computed: {
    ...mapState([
      'latestBreweries',
      'loading'
    ])
  },

  mounted: function () {
    this.getLatestBreweries()

    // Remove progress bar
    NProgress.done()
  },

  methods: {
    getLatestBreweries: function () {
      this.$store.dispatch('LOAD_LATEST_BREWERIES')
      this.$store.state.loading = true
    }
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

.container {
  @mixin container-padding;
  @mixin baseline 10, margin-bottom;
  lost-center: var(--grid-max-width);
}

.recently {
  @mixin font 18, 24, var(--heading-font);
  @mixin baseline 3, margin-bottom;
  color: var(--color-sand);
  lost-column: 2/2;
  letter-spacing: .1rem;
  margin-top: 0;
  opacity: .3;
  text-align: center;
  text-transform: uppercase;
}

.widgets {
  lost-center: 100%;
  width: 100%;
}

.widget {
  background-color: #fff;
  border-radius: 3px;
  box-shadow: 0 4px 20px rgba(108, 122, 137, .3);
  lost-column: 1/2;
}

.body {
  position: relative;
  min-height: 100px;
}
</style>
