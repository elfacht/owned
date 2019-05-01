<template lang="html">
  <router-link
    :to="{
      path: path || null,
      name: name || null
    }"
    :class="$style.link"
  >
    <slot></slot>
  </router-link>
</template>

<script>
export default {
  name: 'BaseLink',

  props: {
    path: String,
    name: String
  }
}
</script>

<style lang="postcss" module>
@import '../assets/_mixins';

.link {
  @mixin font 13, 24, var(--heading-font);
  border-bottom: 2px solid currentColor;
  color: #fff;
  display: inline-block;
  font-weight: bold;
  letter-spacing: .1rem;
  text-decoration: none;
  text-transform: uppercase;
  transition: border .1s ease-in-out;

  &:hover {
    border-color: transparent;
  }
}
</style>
