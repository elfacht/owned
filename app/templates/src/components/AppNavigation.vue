<template lang="html">
  <div :class="$style.container">
    <ul :class="$style.list">
      <li :class="$style.item">
        See all:
      </li>
      <li :class="$style.item">
        <router-link
          :class="$style.link"
          :to="{name: 'BreweriesList'}">Breweries</router-link>
        ({{breweriesCount}})
      </li>
      <li :class="$style.item">
        <router-link
          :class="$style.link"
          :to="{name: 'OwnersList'}">Owners</router-link>
        ({{ownersCount}})
      </li>
    </ul>
  </diV>
</template>

<script>
export default {
  name: 'Navigation',

  data () {
    return {
      breweriesCount: window.breweriesCount,
      ownersCount: window.ownersCount
    }
  }
}
</script>

<style lang="postcss" module>
@import '../assets/_mixins';

.container {
  text-align: center;
  width: 100%;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.item {
  @mixin baseline 2, margin-left;
  @mixin baseline 2, margin-right;
  @mixin font 18, 24, var(--heading-font);
  display: inline-block;
}

.link {
  border-bottom: 2px solid currentColor;
  color: #fff;
  font-weight: bold;
  letter-spacing: .1rem;
  text-decoration: none;
  text-transform: uppercase;
  transition: border .2s ease-in-out;

  &:hover {
    border-color: transparent;
  }
}
</style>
