<template lang="html">
  <div :class="$style.container">

    <div :class="$style.list">
      <div  v-if="loggedIn" :class="$style.menu">
        <base-link path="/create/brewery">
          Add brewery
        </base-link>
      </div>

      <base-table
        :cols="table.cols"
        :headers="table.headers"
        :items="breweries"
        :loading="loading"
        showStatus
      >
        <template
          slot="items"
          slot-scope="props"
        >
          <td>
            <router-link
              class="item"
              :to="{path: '/breweries/' + props.item.slug}"
            >
              <span class="tableValue">
                {{props.item.title}}
              </span>
            </router-link>
          </td>

          <td class="secondary">
            <div
              v-if="props.item.ownership.is_independent"
              class="item"
            >
              {{statusIndependent}}
            </div>
            <div v-else class="item">
              <span v-for="corp in props.item.ownership.owners" :key="corp.id">
                <router-link
                  :to="{path: '/owners/' + corp.slug}"
                >
                  {{corp.title}}
                </router-link>
              </span>
            </div>
          </td>

        </template>
      </base-table>

      <Pagination
        v-if='pagination.total_pages > 1'
        path="/breweries/page/"
        :pagination='pagination'
        :class='$style.pagination'
      />
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import Pagination from './Pagination'
import BaseLink from './BaseLink.vue'
import BaseTable from './BaseTable'
import Spinner from './BaseSpinner'

export default {
  name: 'BreweriesList',

  props: {
    loggedIn: Boolean
  },

  components: {
    // Observer
    Pagination,
    BaseLink,
    BaseTable,
    Spinner
  },

  data () {
    return {
      thBreweries: 'Brewery',
      thCountry: 'Country',
      thCorporation: 'Owned by',
      title: 'Home',
      statusIndependent: 'independent',
      table: {
        cols: [
          '60%',
          '40%'
        ],
        headers: [
          {
            name: 'Brewery'
          },
          {
            name: 'Owned by'
          }
        ]
      }
    }
  },

  computed: {
    ...mapState([
      'breweries',
      'meta',
      'pagination',
      'loading'
    ]),

    ...mapGetters(['recipe'])
  },

  mounted: function () {
    this.getBreweries()
  },

  destroyed: function () {
    /**
     * Destroy default list
     * @return {Callback}
     */
    if (!parseInt(this.$route.params.id)) {
      // this.$store.dispatch('LOAD_BREWERIES_LIST', {pageNum: 1})
    }
  },

  methods: {
    /**
     * Get recipes by type
     * @param  {String} type
     * @return {Callback}
     */
    getBreweries: function () {
      let id = this.$route.params.id ? parseInt(this.$route.params.id) : 1
      this.$store.dispatch('LOAD_BREWERIES_LIST', {pageNum: id})
      this.$store.state.loading = true
    }
  },

  metaInfo: {
    title: 'Breweries',
    titleTemplate: null
  }
}
</script>

<style lang="postcss" module>
@import '../assets/_mixins';

.container {
  @mixin baseline 10, margin-bottom;
}

@media (--md) {
  .container {
    @mixin container-padding;
    lost-center: 2800px;
  }
}

.menu {
  @mixin baseline 3, margin-bottom;
  text-align: right;
}

.list {
  width: 100%;
}

.pagination {
  @mixin baseline 3, margin-top;
}
</style>
