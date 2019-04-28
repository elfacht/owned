<template lang="html">
  <div :class='$style.container'>
    <div v-if="loading">
      loading …
    </div>
    <div v-else :class="$style.card">
      <div :class="$style.inner">
        <h1 :class="$style.title">{{corporation.title}}</h1>

        <p v-if="corporation.country">
          {{corporation.country.title}}
        </p>

        <div
          v-if="corporation.note"
          v-html="corporation.note"
        ></div>

      </div>

      <div
        v-if="corporation.breweries"
        :class="$style.listing"
      >
        <table
          :class="$style.table"
          cellpadding="0"
          cellspacing="0"
        >
          <thead>
            <tr>
              <th>Breweries ({{corporation.breweries.length}})</th>
              <th>Ownership since</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in orderedBreweries" :key="item.id">
              <td>
                <router-link
                  :to="{path: '/breweries/' + item.slug}"
                  :class="$style.item"
                >
                  {{item.title}}
                </router-link>
              </td>
              <td>
                <div v-if="item.owned_since">
                  {{ item.owned_since.date | moment('YYYY') }}
                </div>
                <div v-else :class="$style.na">
                  N/A
                </div>
              </td>
            </tr>
          </tbody>
        </table>

      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import _ from 'lodash'

export default {
  name: 'CorporationsDetail',

  data () {
    return {
      title: this.title
    }
  },

  computed: {
    ...mapState([
      'corporation',
      'loading'
    ]),

    orderedBreweries: function () {
      return _.orderBy(this.corporation.breweries, 'title')
    }
  },

  mounted: function () {
    this.$store.dispatch('LOAD_CORPORATIONS_ITEM', {item: this.$route.params.slug})
    this.$store.state.loading = true
  },

  beforeUpdate: function () {
    this.title = this.corporation.title
  },

  destroyed: function () {
    this.$store.dispatch('RESET_CORPORATION')
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

.container {
  @mixin container-padding;
  lost-center: var(--grid-max-width);
}

.card {
  @mixin baseline 10, margin-bottom;
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

.table {
  width: 100%;
}

table {
  @mixin font 26, 32, var(--copy-font);
  /* border: 1px solid #916f34; */
  /* box-shadow: 0 4px 20px rgba(108, 122, 137, .3); */
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
}

.item {
  @mixin baseline 3, padding;
  display: block;
}

td {
  &:last-child {
    text-align: center;
  }

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

.na {
  color: var(--color-bombay);
}

/* .list {
  font-size: 0;
  list-style: none;
  margin: 0;
  padding: 0;
}

.item {
  @mixin baseline 2, margin-right;
  @mixin baseline 2, margin-bottom;
  display: inline-block;
}

.link {
  @mixin font 22, 32;
  @mixin baseline 2, padding-left;
  @mixin baseline 2, padding-right;
  @mixin baseline 1, padding-top;
  @mixin baseline 6, height;
  background-color: #fff;
  border-radius: 3px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, .07);
  display: inline-block;
  text-decoration: none;
  transition: all .2s ease-in-out;
  opacity: .85;

  &:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, .15);
    transform: translateY(-1px);
    opacity: 1;
  }
} */
</style>
