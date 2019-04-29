<template lang="html">
  <div :class="$style.container">
    <ul :class="$style.list">
      <li :class="$style.item" v-for="item in owners" :key="item.id">
        <router-link
          :class="$style.link"
          :to="{path: '/owners/' + item.slug}"
        >
          {{item.title}} ({{item.breweries}})
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'OwnersList',

  computed: {
    ...mapState([
      'owners',
      'loading'
    ])
  },

  mounted: function () {
    this.getOwners()
  },

  methods: {
    /**
     * Get recipes by type
     * @param  {String} type
     * @return {Callback}
     */
    getOwners: function () {
      this.$store.dispatch('LOAD_OWNERS_LIST')
    }
  },

  metaInfo: {
    title: 'Owners',
    titleTemplate: null
  }
}
</script>

<style lang="postcss" module>
@import '../assets/_mixins';

.container {
  @mixin container-padding;
  @mixin baseline 10, margin-bottom;
  lost-center: var(--grid-max-width);
}

.list {
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
}
</style>
