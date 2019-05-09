<template lang="html">
  <table
    cellpadding="0"
    cellspacing="0"
    class="table"
  >
    <colgroup v-if="cols">
      <col
        v-for="col in cols"
        :key="col" :style="`width:${col}`"
      />
    </colgroup>

    <thead v-if="headers">
      <tr>
        <template v-for="header in headers">
          <th :key="header.name">{{header.name}}</th>
        </template>
      </tr>
    </thead>
    <tbody>
      <div v-if="loading" class="loading" >
        <Spinner class="spinner" />
      </div>
      <tr
        v-if="items"
        v-for="item in items"
        :key="item.id"
        :class="[
          (item.ownership && item.ownership.is_independent) ? 'isPrivate' : ''
        ]"
      >
        <slot name="items" :item="item"></slot>

      </tr>
    </tbody>
  </table>
</template>

<script>
import Spinner from './BaseSpinner'

export default {
  name: 'BaseTable',

  components: {
    Spinner
  },

  props: {
    cols: Array,
    headers: Array,
    items: Array,
    cssClasses: Array,
    loading: [Boolean, Object],
    showStatus: Boolean
  },

  computed: {
    showIndependent () {
      let status = this.showStatus
      console.log(this.showStatus)

      return status
    }
  }
}
</script>

<style lang="postcss" scoped>
@import '../assets/_mixins';

.table {
  @mixin font 12, 16, var(--heading-font);
  border-collapse: separate;
  position: relative;
  max-width: 100%;
  width: 100%;

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
    @mixin font 8, 16, var(--heading-font);
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
    hyphens: auto;

    a {
      text-decoration: none;
    }
  }
}

@media (--lg) {
  .table {
    @mixin font 26, 32, var(--copy-font);

    th {
      @mixin font 16, 24, var(--heading-font);
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

tr.isPrivate {
  &:nth-child(odd) {
    td {
      background-color: var(--color-primrose);
    }
  }

  &:nth-child(even) {
    td {
      background-color: var(--color-zombie);
    }
  }

  &:hover {
    td {
      background: var(--color-alto);
    }
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

.loading {
  /* height: 0; */
}

.loading {
  /* @mixin baseline 6, padding; */
  background-color: rgba(255, 255, 255, .7);
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1;
  height: 100%;
  width: 100%;
}
</style>
