<template lang="html">
  <div :class="$style.container">
    <div :class="$style.branding">
      <router-link :to="{name: 'Home'}" :class="$style.title">owned</router-link>
      <div :class="$style.subtitle">
        Your beer is propably not that crafty.
      </div>
    </div>
    <Search />
    <Navigation />
  </div>
</template>

<script>
import Search from './Search'
import Navigation from './Navigation'

export default {
  name: 'Header',
  components: {
    Search,
    Navigation
  }
}
</script>

<style lang="postcss" module>
@import '../assets/_mixins';

.container {
  @mixin container-padding;
  @mixin baseline 10, padding-top;
  @mixin baseline 10, margin-bottom;
  color: #fff;
  lost-center: var(--grid-max-width);
}

.branding {
  @mixin baseline 7, margin-bottom;
  text-align: center;
  width: 100%;
}

.title {
  @mixin baseline 1, margin-bottom;
  @mixin font 72, 80, var(--heading-font);
  color: inherit;
  font-weight: bold;
  text-transform: uppercase;
  text-decoration: none;
}

.subtitle {
  @mixin font 22, 32, var(--heading-font);
  /* font-weight: bold; */
}
</style>
