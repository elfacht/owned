<template lang="html">
  <div :class="$style.container">

    <div :class="$style.list">
      <div  v-if="loggedIn" :class="$style.menu">
        <base-link path="/create/brewery">
          Add brewery
        </base-link>
      </div>

      <table
        cellpadding="0"
        cellspacing="0"
        :class="$style.table"
      >
        <colgroup>
          <col style="width:60%" />
          <col style="width:40%" />
        </colgroup>
        <thead>
          <tr>
            <th>{{thBreweries}}</th>
            <th>{{thCorporation}}</th>
          </tr>
        </thead>
        <tbody>
          <div v-if="loading" :class="$style.loading" >
            <Spinner :class="$style.spinner" />
          </div>
          <tr
            v-for="brewery in breweries"
            :key="brewery.id"
            :class="[
              brewery.ownership.is_private ? $style.isPrivate : ''
            ]"
          >
            <td>
              <router-link
                :class="$style.item"
                :to="{path: '/breweries/' + brewery.slug}"
              >
                {{brewery.title}}
              </router-link>
            </td>
            <td :class="$style.secondary">
              <div
                v-if="brewery.ownership.is_private"
                :class="$style.item"
              >
                <strong>private</strong>
              </div>
              <div v-else :class="$style.item">
                <span v-for="corp in brewery.ownership.owners" :key="corp.id">
                  <router-link
                    :to="{path: '/owners/' + corp.slug}"
                  >
                    {{corp.title}}
                  </router-link>
                </span>
              </div>
            </td>
          </tr>

        </tbody>
      </table>

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
import Spinner from './BaseSpinner'
// import Observer from './Observer'

export default {
  name: 'BreweriesList',

  props: {
    loggedIn: Boolean
  },

  components: {
    // Observer
    Pagination,
    BaseLink,
    Spinner
  },

  data () {
    return {
      thBreweries: 'Brewery',
      thCountry: 'Country',
      thCorporation: 'Owned by',
      title: 'Home'
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
  @mixin container-padding;
  @mixin baseline 10, margin-bottom;
  lost-center: 2800px;
}

.menu {
  @mixin baseline 3, margin-bottom;
  text-align: right;
}

.list {
  width: 100%;
}

.table {
  @mixin font 26, 32, var(--copy-font);
  @mixin baseline 3, margin-bottom;
  /* border: 1px solid #916f34; */
  box-shadow: 0 4px 20px rgba(108, 122, 137, .3);
  border-collapse: separate;
  position: relative;
  width: 100%;

  tbody {
    position: relative;
  }

  th,
  td {
    transition: all .2s ease-in-out;

    &:not(:last-child) {
      border-right: 1px solid var(--color-concrete);
    }
  }

  th {
    @mixin font 16, 24, var(--heading-font);
    @mixin baseline 2, padding;
    background-color: #2c5c7c;
    color: var(--color-sand);
    letter-spacing: .2rem;
    text-transform: uppercase;

    &:first-child {
      border-top-left-radius: 3px;
    }

    &:last-child {
      border-top-right-radius: 3px;
    }
  }

  td {
    a {
      text-decoration: none;
    }
  }

  tr {
    position: relative;
    transition: all .01s ease-in-out;

    &:hover td {
      background-color: var(--color-alto) !important;
    }

    &:nth-child(odd) {
      td {
        background-color: #fff;
      }
    }

    &:nth-child(even) {
      td {
        background-color: var(--color-sand);
      }
    }
  }
}

.item {
  @mixin baseline 3, padding;
  display: block;
}

.isPrivate td {
  /* background-color: #e7e89b !important; */
  background: linear-gradient(180deg, rgba(231,232,155,1) 0%, rgba(226,227,155,1) 100%);
}

.secondary {
  color: var(--color-boulder);

  a {
    color: inherit;
  }
}

.loading {
  /* height: 0; */
}

.loading {
  /* @mixin baseline 6, padding; */
  background-color: rgba(255, 255, 255, .7);
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1;
  height: 100%;
  width: 100%;
}
</style>
