<template lang="html">
  <div class="container">
    <label
      v-if="label"
      :for="id"
    >
      {{label}}
    </label>
    <select
      :name="name"
      :id="id"
      @input="$emit('input', $event.target.value)"
      v-if="getList"
    >
      <option v-if="emptyOption" value="0">{{emptyOption}}</option>
      <option
        v-for="(item, index) in getList"
        :key="index"
        :value="item.value"
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

<style lang="css" scoped>
</style>
