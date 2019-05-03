<template lang="html">
  <div :class="$style.container">
    <ul :class="$style.list">
      <li :class="$style.item" v-for="item in owners" :key="item.id">
        <router-link
          :class="$style.link"
          :to="{path: '/owners/' + item.slug}"
        >
          <span :class="$style.title">
            <span>{{item.title}}</span>
          </span> <span :class="$style.count">({{item.breweries}})</span>
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
  width: 100%;
}

.item {
  @mixin baseline 2, margin-bottom;
  display: block;
  max-width: 100%;
}

@media (--lg) {
  .item {
    @mixin baseline 2, margin-right;
    display: inline-block;
  }
}

.link {
  @mixin font 16, 24;
  @mixin baseline 2, padding-left;
  @mixin baseline 2, padding-right;
  @mixin baseline 1, padding-top;
  @mixin baseline 5, height;
  background-color: #fff;
  border-radius: 3px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, .07);
  text-decoration: none;
  transition: all .2s ease-in-out;
  opacity: .85;
  display: flex;
  align-items: center;
  /* width: 100%; */

  &:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, .15);
    transform: translateY(-1px);
    opacity: 1;
  }
}

@media (--md) {
  .link {
    @mixin font 22, 32;
    @mixin baseline 2, padding-left;
    @mixin baseline 2, padding-right;
    @mixin baseline 1, padding-top;
    @mixin baseline 6, height;
  }
}

.title {
  flex: 1;
  min-width: 0;

  span {
    display: inline-block;
    align-items: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
  }
}

.count {
  @mixin baseline 1, margin-left;
  display: inline-block;
  transform: translateY(-3px);
  vertical-align: top;
  white-space: nowrap;
}
</style>
