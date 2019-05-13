<template lang="html">
  <div class="pagination">
    <button @click="paginate(pagination.prev_page_url)"
            :disabled="!pagination.prev_page_url">
        Prev
    </button>
    <span class="body">Page <strong>{{pagination.current_page}}</strong> of {{pagination.total_pages}}</span>
    <button @click="paginate(pagination.next_page_url)"
            :disabled="!pagination.next_page_url">Next
    </button>
  </div>
</template>

<script>
import _ from 'lodash'

export default {
  name: 'pagination',
  props: [
    'pagination',
    'path'
  ],
  methods: {
    paginate (pageUrl) {
      /**
       * Split URL to get 'page' param
       * @type {Function}
       */
      let strippedUrl = pageUrl ? _.chain(pageUrl)
        .replace(/^.*\/\/[^/]+/, '') // Remove domain and protocol
        .replace('/api/breweries', '')
        .replace('?', '') // a=b454&c=dhjjh&f=g6hksdfjlksd
        .split('&') // ["a=b454","c=dhjjh","f=g6hksdfjlksd"]
        .map(_.partial(_.split, _, '=', 2)) // [["a","b454"],["c","dhjjh"],["f","g6hksdfjlksd"]]
        .fromPairs() // {"a":"b454","c":"dhjjh","f":"g6hksdfjlksd"}
        .value() : null

      /**
       * Set page ID with fallback
       * @type {Number}
       */
      let pageId = pageUrl ? parseFloat(strippedUrl['page']) : 1

      /**
       * Set paging types with default
       * @type {String}
       */
      this.$router.push({ path: this.path + pageId + '/' })
    }
  }
}
</script>

<style lang="postcss" scoped>
@import '../assets/_mixins';

.pagination {
  @mixin font 11, 16, var(--heading-font);
  letter-spacing: .1rem;
  text-align: center;
  text-transform: uppercase;
  width: 100%;
}

/* @media (--lg) {
  .pagination {
    text-align: right;
  }
} */

.body {
  @mixin baseline 2, margin-left;
  @mixin baseline 2, margin-right;
  color: #fff;
  display: inline-block;
  font-weight: 400;
}

button {
  @mixin baseline .5, padding-top;
  @mixin baseline .5, padding-bottom;
  @mixin baseline 1.5, padding-left;
  @mixin baseline 1.5, padding-right;
  @mixin font 11, 16, var(--heading-font);
  appearance: none;
  border: none;
  background-color: var(--color-mercury);
  letter-spacing: .1rem;
  transition: background .5s ease-in-out;
  text-transform: uppercase;

  &:not([disabled]) {
    cursor: pointer;

    &:hover,
    &:active,
    &:focus {
      background-color: var(--color-accent);
      color: #fff;
    }
  }

  &[disabled],
  &:disabled {
    opacity: .5;
  }
}
</style>
