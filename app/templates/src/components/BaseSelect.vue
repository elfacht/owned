<template lang="html">
  <div class="container">
    <label
      v-if="label"
      class="label"
      :for="id"
    >
      {{label}}
    </label>
    <select
      class="select"
      :name="name"
      :id="id"
      @input="$emit('input', [$event.target.value])"
      v-if="getList"
    >
      <option v-if="emptyOption" value="0">{{emptyOption}}</option>
      <option
        v-for="(item, index) in getList"
        :key="index"
        :value="item.value || item.id"
      >
        {{item.title || item.label}}
      </option>
    </select>
  </div>
</template>

<script>
import countriesList from '../json/countries.json'

export default {
  name: 'SelectCountry',

  props: {
    id: String,
    name: String,
    label: String,
    emptyOption: String,
    list: Array,
    isCountries: Boolean
  },

  data () {
    return {
      countries: countriesList
    }
  },

  computed: {
    getList: function () {
      let list = this.isCountries ? countriesList : this.list
      return list
    }
  }
}
</script>

<style lang="postcss" scoped>
@import '../assets/_mixins';

.container {
  @mixin baseline 4, margin-bottom;
}

.label {
  @mixin font 12, 24, var(--heading-font);
  @mixin baseline 1, margin-bottom;
  display: block;
  font-weight: normal;
  letter-spacing: .2rem;
  text-transform: uppercase;
}

.select {
  @mixin baseline 5, height;
  @mixin baseline 2, padding-left;
  @mixin baseline 2, padding-right;
  @mixin font 14, 24, var(--copy-font);
  background-color: var(--color-alto);
  border-top: 1px solid var(--color-alto);
  border-left: 1px solid var(--color-alto);
  border-bottom: 1px solid #fff;
  border-right: 1px solid #fff;
  border-radius: 3px;
  box-shadow: inset 1px 2px 2px 0 rgba(0, 0, 0, .3);
  display: block;
  transition: all .1s ease-in-out;
  width: 100%;

  &.active {
    background-color: #fff;
    box-shadow: inset 1px 2px 2px 0 rgba(0, 0, 0, .5),
                0 0 10px rgba(255, 255, 255, .3)
  }
}
</style>
