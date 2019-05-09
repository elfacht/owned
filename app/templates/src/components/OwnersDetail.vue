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
        <base-table
          :cols="table.cols"
          :headers="tableHeaders"
          :items="orderedBreweries"
          :loading="loading"
        >
          <template
            slot="items"
            slot-scope="props"
          >
            <template
              slot="baseItem"
              :url="{path: '/breweries/' + props.item.slug}"
              :label="props.item.title"
              >
            </template>

            <td>
              <router-link
                :to="{path: '/breweries/' + props.item.slug}"
                class="item"
              >
                {{props.item.title}}
              </router-link>
            </td>

            <td :class="[
              !props.item.owned_since ? 'secondary' : null
            ]">
              <div v-if="props.item.owned_since" class="item">
                {{ props.item.owned_since.date | moment('YYYY') }}
              </div>
              <div v-else class="item">
                unknown
              </div>
            </td>

          </template>
        </base-table>

      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import _ from 'lodash'
import BaseTable from './BaseTable'

export default {
  name: 'OwnersDetail',

  components: {
    BaseTable
  },

  // ${owner.breweries.length}

  data () {
    return {
      title: this.title,
      table: {

      }
    }
  },

  computed: {
    ...mapState([
      'owner',
      'loading'
    ]),

    orderedBreweries: function () {
      return _.orderBy(this.owner.breweries, 'title')
    },

    tableHeaders: function () {
      let data = [
        {
          name: `Breweries (${this.owner.breweries.length})`
        },
        {
          name: 'Owning since'
        }
      ]

      return data
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
</style>
