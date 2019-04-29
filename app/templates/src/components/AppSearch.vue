<template lang="html">
  <div class="search">
    <Autocomplete
        id='searchbox'
        url='/api/search'
        anchor='title'
        placeholder='Search for a brewery or owner …'
        :min='min'
        :on-select='itemSelected'
        :process='processJsonData'
        >
    </Autocomplete>
  </div>
</template>

<script>
// @see https://github.com/BosNaufal/vue2-autocomplete
import Autocomplete from 'vue2-autocomplete'

export default {
  name: 'Search',

  components: {
    Autocomplete
  },

  data () {
    return {
      min: 3
    }
  },

  methods: {
    prerenderLink: function (e) {
      let head = document.getElementsByTagName('head')[0]
      let refs = head.childNodes
      let ref = refs[refs.length - 1]

      let elements = head.getElementsByTagName('link')
      Array.prototype.forEach.call(elements, function (el, i) {
        if (('rel' in el) && (el.rel === 'prerender')) {
          el.parentNode.removeChild(el)
        }
      })

      let prerenderTag = document.createElement('link')
      prerenderTag.rel = 'prerender'
      prerenderTag.href = e.currentTarget.href
      ref.parentNode.insertBefore(prerenderTag, ref)
    },

    toggle: function () {
      this.menuOpen = !this.menuOpen
    },

    itemSelected: function (data) {
      this.$router.push({ path: data.url })
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
}
</style>

<style lang="postcss">
@import '../assets/_mixins';
.autocomplete-wrapper {
  position: relative;
  width: 100%;
}

.autocomplete-input {
  @mixin baseline 10, height;
  @mixin baseline 4, padding-left;
  @mixin baseline 4, padding-right;
  @mixin font 32, 40, var(--heading-font);
  border: 1px solid var(--color-alto);
  border-radius: 4px;
  box-shadow: inset 1px 2px 6px rgba(0, 0, 0, .15);
  font-weight: 200;
  width: 100%;
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
    @mixin font 22, 32, var(--copy-font);
    display: block;
    font-weight: 200;
    text-decoration: none;
  }
}
</style>
