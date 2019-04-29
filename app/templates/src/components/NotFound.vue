<template lang="html">
  <div :class="$style.container">
    NOT FOUND
  </div>
</template>

<script>
export default {
  name: 'NotFound'
}
</script>

<style lang="postcss" module>
@import '../assets/_mixins';

.container {
  @mixin container-padding;
  @mixin baseline 20, margin-bottom;
  lost-center: var(--grid-max-width);
}
</style>
