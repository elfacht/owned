<template lang="html">
  <div :class="$style.container">
    <div :class="$style.intro">
      … or show all:
    </div>
    <ul :class="$style.list">
      <!-- <li :class="$style.item">
        See all:
      </li> -->
      <li :class="$style.item">
        <router-link
          :class="$style.link"
          :to="{name: 'BreweriesList'}"
        >
          <strong>Breweries</strong>
          <span>({{breweriesCount}})</span>
        </router-link>

      </li>
      <li :class="$style.item">
        <router-link
          :class="$style.link"
          :to="{name: 'OwnersList'}"
        >
          <strong>Owners</strong>
          <span>({{ownersCount}})</span>
        </router-link>
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

<style lang="postcss" scoped>
@import '../assets/_mixins';

.router-link-active,
.router-link-active:focus {
  background-color: rgba(044, 092, 124, .5);
}

@media (--lg) {
  .router-link-active,
  .router-link-active:focus {
    background-color: transparent;
    
    strong {
      border-color: #2c5c7c;
    }
  }
}
</style>

<style lang="postcss" module>
@import '../assets/_mixins';

.container {
  text-align: center;
  width: 100%;
}

.intro {
  @mixin baseline 2, margin-bottom;
}

@media (--lg) {
  .intro {
    display: none;
  }
}

.list {
  font-size: 0;
  list-style: none;
  margin: 0;
  padding: 0;
}

.item {
  @mixin baseline 1, margin-left;
  @mixin baseline 1, margin-right;
  @mixin font 11, 24, var(--heading-font);
  display: inline-block;
  vertical-align: top;
  width: calc(50% - 8px);

  &:first-child {
    margin-left: 0;
  }

  &:last-child {
    margin-right: 0;
  }
}

@media (--lg) {
  .item {
    @mixin baseline 2, margin-left;
    @mixin baseline 2, margin-right;
    @mixin font 18, 24, var(--heading-font);
    width: auto;
  }
}

.link {
  @mixin baseline 1, padding-top;
  @mixin baseline 1, padding-bottom;
  @mixin baseline 2, padding-left;
  @mixin baseline 2, padding-right;
  background-color: rgba(255, 255, 255, .3);
  border-radius: 3px;
  color: #fff;
  display: block;
  letter-spacing: .1rem;
  text-transform: uppercase;
  text-decoration: none;
  transition: border .2s ease-in-out;

  span {
    font-weight: normal;
  }
}

@media (--lg) {
  .link {
    background: none;
    display: inline-block;
    padding: 0;

    &:hover {
      strong {
        border-color: transparent;
      }
    }

    strong {
      border-bottom: 2px solid currentColor;
      transition: border .2s ease-in-out;
    }
  }
}
</style>
