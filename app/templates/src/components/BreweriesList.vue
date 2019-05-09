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
              brewery.ownership.is_independent ? $style.isPrivate : ''
            ]"
          >
            <td data-label="Brewery">
              <router-link
                :class="$style.item"
                :to="{path: '/breweries/' + brewery.slug}"
              >
                <span :class="$style.tableValue">
                  {{brewery.title}}
                </span>
              </router-link>
            </td>
            <td :class="$style.secondary" data-label="Owned by">
              <div
                v-if="brewery.ownership.is_independent"
                :class="$style.item"
              >
                <strong>{{statusIndependent}}</strong>
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
      title: 'Home',
      statusIndependent: 'independent'
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
  /* @mixin font 26, 32, var(--copy-font); */
  @mixin font 14, 16, var(--heading-font);
  @mixin baseline 3, margin-bottom;
  /* border: 1px solid #916f34; */
  /* box-shadow: 0 4px 20px rgba(108, 122, 137, .3); */
  border-collapse: separate;
  position: relative;
  max-width: 100%;
  width: 100%;

  thead {
    display: none;
  }

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

  tr {
    @mixin baseline 4, margin-bottom;
    float: left;
    width: 100%;
    /* position: relative; */
    transition: all .01s ease-in-out;

    &:hover td {
      background-color: var(--color-alto);
    }

    &:nth-child(odd):not(.isPrivate):not(:hover) {
      td {
        background-color: #fff;
      }
    }

    &:nth-child(even):not(.isPrivate):not(:hover) {
      td {
        background-color: var(--color-sand);
      }
    }
  }

  td {
    background-color: #fff;
    box-shadow: 0 4px 20px rgba(108, 122, 137, .3);
    display: block;
    /* float: left; */
    width: 100%;

    &:before {
      @mixin font 10, 16, var(--heading-font);
      @mixin baseline 2, padding;
      background-color: #2c5c7c;
      color: var(--color-sand);
      content:attr(data-label);
      display: block;
      font-weight: normal;
      text-transform: uppercase;
      letter-spacing: .1rem;
      word-wrap: break-word;
      width: 100%;
    }

    &:last-child:before {
      background-color: var(--color-tundora);
    }

    a {
      text-decoration: none;
    }
  }
}

@media (--lg) {
  .table {
    @mixin font 26, 32, var(--copy-font);

    thead {
      display: table-header-group;
    }

    tr {
      float: none;
    }

    td {
      box-shadow: none;
      display: table-cell;
      hyphens: auto;
      width: auto;

      &:before {
        display: none;
      }
    }
  }
}

.item {
  /* @mixin baseline 3, padding; */
  @mixin baseline 2, padding;
  display: block;
  /* float: left; */
  /* display: block; */
}

@media (--lg) {
  .item {
    @mixin baseline 3, padding;
  }
}

tr.isPrivate {
  &:nth-child(odd) {
    td {
      background-color: var(--color-primrose);
    }
  }

  &:nth-child(even) {
    td {
      background-color: var(--color-zombie);
    }
  }

  &:hover {
    td {
      background: var(--color-alto);
    }
  }
}

.secondary {
  color: var(--color-boulder);

  a {
    color: inherit;
  }
}

.tableValue {
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
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
