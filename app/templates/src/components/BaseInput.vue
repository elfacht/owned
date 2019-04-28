<template lang="html">
  <div class="container">
    <label v-if="label" :for="id || null">{{label}}</label>
    <input
      :type="type || 'text'"
      :id="id || null"
      :name="name || null"
      @input="$emit('input', $event.target.value)"
    >
  </div>
</template>

<script>
export default {
  name: 'BaseInput',
  props: {
    type: String,
    id: String,
    name: String,
    label: String
  }
}
</script>

<style lang="css" scoped>
</style>
