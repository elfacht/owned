<template lang="html">
  <div class="container">
    <label v-if="label" :for="id || null">{{label}}</label>
    <input
      :type="type || 'text'"
      :id="id || null"
      :name="name || null"
      @input="$emit('input', $event.target.value)"
      :class="{active: isActive}"
      @focus="setActive"
      @blur="unsetActive"
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
  },

  data () {
    return {
      isActive: false
    }
  },

  methods: {
    setActive: function () {
      this.isActive = true
    },

    unsetActive: function () {
      this.isActive = false
    }
  }
}
</script>

<style lang="postcss" scoped>
@import '../assets/_mixins';

.container {
  @mixin baseline 4, margin-bottom;
}

label {
  @mixin font 12, 24, var(--heading-font);
  @mixin baseline 1, margin-bottom;
  display: block;
  font-weight: normal;
  letter-spacing: .2rem;
  text-transform: uppercase;
}

input {
  @mixin baseline 6, height;
  @mixin baseline 2, padding-left;
  @mixin baseline 2, padding-right;
  @mixin font 14, 24, var(--copy-font);
  background-color: var(--color-sand);
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
