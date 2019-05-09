<template>
  <div :class='$style.container'>

    <h2 :class="$style.recently">
      Recently added
    </h2>

    <div :class="$style.widgets">
      <div :class="$style.widget">
        <h3 :class="[
          $style.headline,
          $style.headlineLight
        ]">
          Breweries
        </h3>

        <div :class="$style.body">
          <div v-if="loading">
            <Spinner />
          </div>

          <base-table
            :cols="table.cols"
            :items="latestBreweries"
          >
            <template
              slot="items"
              slot-scope="props"
            >
              <td class="secondary">
                <div class="item">
                  {{ props.item.date_created | moment('YYYY-MM-DD') }}
                </div>
              </td>

              <td>
                <router-link
                  class="item"
                  :to="{path: '/breweries/' + props.item.slug}"
                >
                  {{props.item.title}}
                </router-link>
              </td>

            </template>
          </base-table>

        </div>
      </div>

      <div :class="$style.widgets">
        <div :class="$style.widget">
          <h3 :class="$style.headline">
            Owners
          </h3>

          <div :class="$style.body">
            <div v-if="loading">
              <Spinner />
            </div>

            <base-table
              :cols="table.cols"
              :items="latestOwners"
            >
              <template
                slot="items"
                slot-scope="props"
              >
                <td class="secondary">
                  <div class="item">
                    {{ props.item.date_created | moment('YYYY-MM-DD') }}
                  </div>
                </td>

                <td>
                  <router-link
                    class="item"
                    :to="{path: '/owners/' + props.item.slug}"
                  >
                    {{props.item.title}}
                  </router-link>
                </td>

              </template>
            </base-table>

          </div>
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
import BaseTable from './BaseTable'

export default {
  name: 'Home',

  components: {
    Spinner,
    BaseTable
  },

  data () {
    return {
      table: {
        cols: [
          '25%',
          '75%'
        ]
      }
    }
  },

  computed: {
    ...mapState([
      'latestBreweries',
      'latestOwners',
      'loading'
    ])
  },

  mounted: function () {
    this.getLatestEntries()

    // Remove progress bar
    NProgress.done()
  },

  methods: {
    getLatestEntries: function () {
      this.$store.dispatch('LOAD_LATEST_BREWERIES')
      this.$store.dispatch('LOAD_LATEST_OWNERS')
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

.headline {
  @mixin baseline 2, padding;
  @mixin font 14, 24, var(--heading-font);
  background: rgb(44,92,124);
  background: linear-gradient(138deg, rgba(44,92,124,1) 0%, rgba(23,56,78,1) 100%);
  color: #fff;
  letter-spacing: .1rem;
  margin: 0;
  text-align: center;
  text-transform: uppercase;
}

.headlineLight {
  background: rgb(219,220,132);
  background: linear-gradient(138deg, rgba(219,220,132,1) 0%, rgba(175,176,83,1) 100%);
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
  /* lost-center: 100%; */
  width: 100%;
}

.widget {
  @mixin baseline 5, margin-bottom;
  background-color: #fff;
  border-radius: 3px;
  box-shadow: 0 4px 20px rgba(108, 122, 137, .3);
  /* lost-column: 2/2; */
  overflow: hidden;
}

.body {
  position: relative;
  min-height: 100px;
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

/* .list {
  margin: 0;

  dt,
  dd {
    float: left;
  }

  dt {
    clear: both;
  }

  dd {
    margin: 0;
  }
}

.item {
  @mixin baseline 2, padding;
  display: inline-block;
} */
</style>
