<template lang="html">
  <div :class="{
    active: isActive,
    search: true
    }">
    <Autocomplete
        id='searchbox'
        url='/api/search'
        anchor='title'
        label="type"
        placeholder='Search for a brewery or owner …'
        labelType="type"
        :classes="{item: 'autocomplete-item'}"
        :min='min'
        :on-select='itemSelected'
        :process='processJsonData'
        :on-focus="setActive"
        :on-blur="unsetActive"
        >
    </Autocomplete>
  </div>
</template>

<script>
// @see https://github.com/elfacht/vue2-autocomplete
import Autocomplete from 'vue2-autocomplete-js'

export default {
  name: 'Search',

  components: {
    Autocomplete
  },

  data () {
    return {
      isActive: false,
      min: 3
    }
  },

  methods: {
    setActive: function () {
      this.isActive = true
    },
    unsetActive: function () {
      this.isActive = false
    },
    toggle: function () {
      this.menuOpen = !this.menuOpen
    },

    itemSelected: function (data) {
      this.$router.push({ path: data.url })
      this.unsetActive()
    },

    processJsonData: function (json) {
      return json.data
    }
  }
}
</script>

<style lang="postcss" scoped>
@import '../assets/_mixins';

.search {
  @mixin baseline 7, margin-bottom;
  position: relative;
  width: 100%;

  &:after {
    background-color: rgba(0, 0, 0, .5);
    content: '';
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    opacity: 0;
    visibility: hidden;
    transition: all .2s ease-in-out;
    z-index: 10;
  }

  &.active:after {
    opacity: 1;
    visibility: visible;
  }
}
</style>

<style lang="postcss">
@import '../assets/_mixins';
.autocomplete-wrapper {
  position: relative;
  width: 100%;
  z-index: 11;
}

.autocomplete-input {
  @mixin baseline 7, height;
  @mixin baseline 3, padding-left;
  @mixin baseline 3, padding-right;
  @mixin font 18, 32, var(--heading-font);
  border: 1px solid var(--color-alto);
  border-radius: 4px;
  box-shadow: inset 1px 2px 6px rgba(0, 0, 0, .15);
  font-weight: 200;
  width: 100%;
}

@media (--lg) {
  .autocomplete-input {
    @mixin baseline 10, height;
    @mixin baseline 4, padding-left;
    @mixin baseline 4, padding-right;
    @mixin font 32, 40, var(--heading-font);
  }
}

.autocomplete-list {
  appearance: none;
  background-color: #fff;
  box-shadow: 0 2px 8px -4px rgba(0, 0, 0, .15);
  border-radius: 4px;
  position: absolute;
  top: calc(100% + 2px);
  left: 0;
  right: 0;
  z-index: 10;

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  li {
    display: block;

    &:not(:last-child) {
      border-bottom: 1px solid var(--color-concrete);
    }
  }

  .focus-list {
    a {
      background-color: var(--color-concrete);
      /* color: #fff; */
    }

    &:first-child a {
      border-top-left-radius: 4px;
      border-top-right-radius: 4px;
    }

    &:last-child a {
      border-bottom-left-radius: 4px;
      border-bottom-right-radius: 4px;
    }
  }

  a {
    @mixin baseline 2.5, padding;
    @mixin baseline 3, padding-left;
    @mixin baseline 3, padding-right;
    @mixin font 16, 24, var(--copy-font);
    display: block;
    font-weight: 200;
    text-decoration: none;
  }
}

@media (--lg) {
  .autocomplete-list a {
    @mixin font 22, 32, var(--copy-font);
  }
}

.autocomplete-item {
  > a > div {
    display: flex;
  }

  b {
    font-weight: 200;
    width: calc(100% - 56px);
  }
}

@media (--lg) {
  .autocomplete-item b {
    width: calc(100% - 106px);
  }
}

.autocomplete-anchor-text {
  order: 2;
}

.autocomplete-anchor-label {
  @mixin font 8, 24, var(--heading-font);
  @mixin baseline 3, height;
  @mixin baseline 5, width;
  @mixin baseline 2, margin-right;
  display: inline-block;
  flex: 1 0 72px;
  font-weight: 400;
  letter-spacing: .1rem;
  order: 1;
  padding: 0 0 0 2px;
  text-transform: uppercase;
  text-align: center;
  vertical-align: middle;

  &.brewery {
    background-color: #fde3a7;
  }

  &.owner {
    background-color: #89c4f4;
  }
}

@media (--lg) {
  .autocomplete-anchor-label {
    @mixin font 10, 24, var(--heading-font);
    @mixin baseline 4, height;
    @mixin baseline 11, width;
    flex: 1 0 88px;
    padding: 4px 0 0 2px;
  }
}
</style>
