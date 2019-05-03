<template lang="html">
  <span class="spinner"></span>
</template>

<script>
export default {
  name: 'BaseSpinner'
}
</script>

<style lang="postcss" scoped>
@import '../assets/_mixins';

.spinner {
  display: block;
  position: absolute;
  left: 50%;
  top: 50%;

  &:before {
    content: '';
    box-sizing: border-box;
    display: inline-block;
    position: absolute;
    top: 50%;
    left: 50%;
    width: 20px;
    height: 20px;
    margin-top: -10px;
    margin-left: -10px;
    border-radius: 50%;
    border-top: 2px solid var(--color-tundora);
    border-right: 2px solid transparent;
    animation: spinner .6s linear infinite;
  }
}

@keyframes spinner {
  to {transform: rotate(360deg);}
}
</style>
