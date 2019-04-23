<template lang="html">
  <div :class="$style.container">

    <div :class="$style.list">
      <table cellpadding="0" cellspacing="0">
        <colgroup>
          <col style="width:60%" />
          <!-- <col style="width:100px" /> -->
          <col style="width:40%" />
        </colgroup>
        <thead>
          <tr>
            <th>{{thBreweries}}</th>
            <!-- <th>{{thCountry}}</th> -->
            <th>{{thCorporation}}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="brewery in breweries" :key="brewery.id"
              :class="[
                brewery.ownership.is_private ? $style.isPrivate : ''
              ]"
            >
            <td>
              <router-link :class="$style.item" :to="{path: '/breweries/' + brewery.slug}">
                {{brewery.title}}
              </router-link>
            </td>
            <!-- <td>{{brewery.country.slug}}</td> -->
            <td :class="$style.secondary">
              <div v-if="brewery.ownership.is_private" :class="$style.item">
                <strong>private</strong>
              </div>
              <div v-else :class="$style.item">
                <span v-for="corp in brewery.ownership.corporations" :key="corp.id">
                  <router-link :to="{path: '/corporations/' + corp.slug}">
                    {{corp.title}}
                  </router-link>
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'

export default {
  name: 'BreweriesListing',
  data () {
    return {
      thBreweries: 'Brewery',
      thCountry: 'Country',
      thCorporation: 'Owned by',
      title: 'Home',
      errors: []
    }
  },
  metaInfo: {
    title: 'Breweries',
    titleTemplate: null
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
  methods: {
    /**
     * Get recipes by type
     * @param  {String} type
     * @return {Callback}
     */
    getBreweries: function () {
      let id = this.$route.params.id ? parseInt(this.$route.params.id) : 1
      this.$store.dispatch('LOAD_BREWERIES_LIST', {pageNum: id})
    }
  },
  destroyed: function () {
    /**
     * Destroy default list
     * @return {Callback}
     */
    if (!parseInt(this.$route.params.id)) {
      this.$store.dispatch('LOAD_BREWERIES_LIST', {pageNum: 1})
    }
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

.list {
  width: 100%;
}

table {
  @mixin font 26, 32, var(--copy-font);
  /* border: 1px solid #916f34; */
  box-shadow: 0 4px 20px rgba(108, 122, 137, .3);
  border-collapse: separate;
  width: 100%;
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

.item {
  @mixin baseline 3, padding;
  display: block;
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

.isPrivate td {
  background-color: #e7e89b !important;
}

.secondary {
  color: var(--color-boulder);

  a {
    color: inherit;
  }
}
</style>
