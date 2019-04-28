<template lang="html">
  <button
    class="base-button"
    :class="cssClass"
    :disabled="disabled"
    @click="onClick">

    <span class="content">
      <slot/>
    </span>
  </button>
</template>

<script>
export default {
  name: 'BaseButton',

  props: {
    cssClass: String,
    disabled: Boolean
  },

  methods: {
    onClick: function (e) {
      this.$emit('click', e)
    }
  }
}
</script>

<style lang="css" scoped>
</style>
