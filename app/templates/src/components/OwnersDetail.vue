<template lang="html">
  <div :class='$style.container'>
    <div v-if="loading">
      loading …
    </div>
    <div v-else :class="$style.card">
      <div :class="$style.inner">
        <h1 :class="$style.title">{{owner.title}}</h1>

        <div
          v-if="owner.country || owner.subsidiaries"
          :class="$style.meta"
        >
          <div
            v-if="owner.country"
            :class="$style.location"
          >
            {{owner.country.title}}
          </div>
          <div
            v-if="owner.subsidiaries"
            :class="$style.subsidiaries"
          >
            — Subsidiary of
            <template v-for="owner in owner.subsidiaries">
              <router-link :key="owner.id" :to="{path: '/owners/' + owner.slug}">{{owner.title}}</router-link>
            </template>
          </div>
        </div>

        <div
          v-if="owner.note"
          :class="$style.note"
        >
          <div v-html="owner.note"></div>
          <div v-if="owner.source">
            — <a :href="owner.source">Wikipedia</a>
          </div>
        </div>
      </div>

      <div
        v-if="owner.breweries"
        :class="$style.listing"
      >
        <table
          :class="$style.table"
          cellpadding="0"
          cellspacing="0"
        >
          <thead>
            <tr>
              <th>Breweries ({{owner.breweries.length}})</th>
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
                  unknown
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
  name: 'OwnersDetail',

  data () {
    return {
      title: this.title
    }
  },

  computed: {
    ...mapState([
      'owner',
      'loading'
    ]),

    orderedBreweries: function () {
      return _.orderBy(this.owner.breweries, 'title')
    }
  },

  mounted: function () {
    this.$store.dispatch('LOAD_OWNERS_ITEM', {item: this.$route.params.slug})
    this.$store.state.loading = true
  },

  beforeUpdate: function () {
    this.title = this.owner.title
  },

  destroyed: function () {
    this.$store.dispatch('RESET_OWNER')
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
  @mixin baseline 10, margin-bottom;
  background-color: #fff;
  box-shadow: 0 4px 20px rgba(108, 122, 137, .3);
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

.title {
  @mixin font 32, 40, var(--heading-font);
  font-weight: 200;
  hyphens: auto;
  margin: 0;
  transform: translateX(-2px);
}

@media (--lg) {
  .title {
    @mixin font 64, 72, var(--heading-font);
    lost-column: 6/7;
    transform: translateX(-5px);
  }
}

.meta {
  @mixin baseline 4, margin-bottom;
  @mixin baseline 1, margin-top;

  div {
    display: inline-block;
  }
}

.note {
  /* hyphens: auto; */
  p {
    @mixin baseline 2, margin-bottom;
    margin-top: 0;
  }

  p:last-child {
    margin-bottom: 0;
  }
}

@media (--md) {
  .note {
    lost-column: 4/5;
  }
}

@media (--lg) {
  .note {
    lost-column: 3/5;
  }
}

.location {
  /* @mixin baseline 2, margin-top; */
  @mixin font 14, 24;
  color: var(--color-boulder);
}

.table {
  @mixin font 26, 32, var(--copy-font);
  /* border: 1px solid #916f34; */
  /* box-shadow: 0 4px 20px rgba(108, 122, 137, .3); */
  border-collapse: separate;
  width: 100%;

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
}

.na {
  color: var(--color-bombay);
}

.subsidiaries {
  @mixin font 14, 24;
  color: var(--color-boulder);

  a {
    border-bottom: 1px solid currentColor;
    color: var(--color-tundora);
    text-decoration: none;
    transition: border .1s ease-in-out;

    &:hover {
      border-color: transparent;
    }
  }
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
