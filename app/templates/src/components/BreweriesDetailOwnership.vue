<template lang="html">
  <div :class="[
      $style.owner,
      ownership.is_private ? $style.isPrivate : $style.isOwned
    ]">
    <h2 :class="$style.subtitle">Owned by</h2>
    <div
      v-if="ownership.is_private"
      :class="$style.private"
    >
      private
    </div>
    <div v-else>
      <div v-if="ownership && ownership.owners">
        <ul :class="$style.list">
          <li
            :class="$style.item" v-for="item in ownership.owners"
            :key="item.id"
          >
            <router-link :to="{path: '/owners/' + item.slug}">{{item.title}}</router-link>
          </li>
        </ul>
        <div
          v-if="ownership && ownership.owned_since"
          :class="$style.since"
        >
          — since {{ ownership.owned_since | moment('YYYY') }}
        </div>
      </div>
      <div v-else :class="$style.item">
        N/A
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Ownership',

  props: {
    ownership: Object
  }
}
</script>

<style lang="postcss" module>
@import '../assets/_mixins';

.owner {
  @mixin baseline 2, padding-top;
  @mixin baseline 2, padding-bottom;
  @mixin baseline 3, padding-left;
  @mixin baseline 3, padding-right;
}

@media (--lg) {
  .owner {
    @mixin baseline 4, padding-top;
    @mixin baseline 4, padding-bottom;
    @mixin baseline 5, padding-left;
    @mixin baseline 5, padding-right;
  }
}

.isOwned {
  background: rgb(54,54,54);
  background: linear-gradient(143deg, rgba(54,54,54,1) 0%, rgba(18,26,28,1) 58%, rgba(40,29,31,1) 100%);
  color: #fff;
}

.isPrivate {
  background: rgb(231,232,155);
  background: linear-gradient(143deg, rgba(231,232,155,1) 0%, rgba(208,209,110,1) 58%, rgba(170,171,70,1) 100%);
  color: var(--color-tundora);

  .subtitle {
    color: inherit;
    text-decoration: line-through;
  }
}

.subtitle {
  @mixin font 8, 24, var(--heading-font);
  @mixin baseline 1, margin-bottom;
  color: var(--color-bombay);
  font-weight: normal;
  letter-spacing: .1rem;
  margin: 0;
  text-transform: uppercase;
}

@media (--lg) {
  .subtitle {
    @mixin font 12, 24, var(--heading-font);
  }
}

.list {
  display: inline-block;
  font-size: 0;
  list-style: none;
  margin: 0;
  padding: 0;
}

.item {
  @mixin baseline .5, margin-right;
  @mixin font 20, 32, var(--heading-font);
  color: var(--color-sand);
  display: inline-block;
  font-weight: 200;
  /* transform: translateX(-3px); */

  a {
    border-bottom: 2px solid transparent;
    color: inherit;
    text-decoration: none;
    transition: border .1s ease-in-out;

    &:hover {
      border-color: currentColor;
    }
  }
}

@media (--lg) {
  .item {
    @mixin font 42, 48, var(--heading-font);
    @mixin baseline 2, margin-right;
  }
}

.since {
  @mixin font 20, 32, var(--heading-font);
  color: var(--color-boulder);
  display: inline-block;
  font-weight: 200;
}

.private {
  @mixin font 20, 32, var(--heading-font);
  font-weight: 200;
  /* transform: translateX(-3px); */
}

@media (--lg) {
  .since {
    @mixin font 42, 48, var(--heading-font);
  }

  .private {
    @mixin font 42, 48, var(--heading-font);
  }
}
</style>
