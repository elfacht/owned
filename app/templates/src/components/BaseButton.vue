<template lang="html">
  <div :class="{
    [$style.alignRight]: alignRight,
    [$style.container]: true
  }">
    <button
      :class="{
        cssClass,
        [$style.button]: true,
        [$style.isLoading]: loading,
        [$style.isSuccess]: success
      }"
      :disabled="disabled"
      @click="onClick">

      <span :class="$style.content">
        <Spinner v-if="loading" :class="$style.spinner" />
        <span v-if="success" :class="$style.success">✔</span>
        <slot/>
      </span>
    </button>
  </div>
</template>

<script>
import Spinner from './BaseButtonSpinner'

export default {
  name: 'BaseButton',

  props: {
    cssClass: String,
    disabled: Boolean,
    alignRight: Boolean,
    loading: Boolean,
    success: Boolean
  },

  components: {
    Spinner
  },

  methods: {
    onClick: function (e) {
      this.$emit('click', e)
    }
  }
}
</script>

<style lang="postcss" module>
@import '../assets/_mixins';

.alignRight {
  text-align: right;
}

.isLoading {
  .content {
    color: transparent;
  }
}

.isSuccess {
  .content {
    color: transparent;
  }
}

.success {
  @mixin font 30, 40;
  background-color: #00b16a;
  border-radius: 3px;
  color: #fff;
  text-align: center;
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}

.button {
  @mixin baseline 6, height;
  @mixin baseline 3, padding-left;
  @mixin baseline 3, padding-right;
  @mixin font 12, 26, var(--heading-font);
  appearance: none;
  background: rgb(204,129,204);
  background: linear-gradient(127deg, rgba(219,228,146,1) 0%, rgba(253,135,255,1) 100%);
  border: none;
  border-radius: 3px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, .2);
  color: var(--color-tundora);
  cursor: pointer;
  display: inline-block;
  letter-spacing: .2rem;
  position: relative;
  text-transform: uppercase;
  transition: all .2s ease-in;
  z-index: 1;

  &:before {
    content: '';
    background: rgb(192,203,104);
    background: linear-gradient(127deg, rgba(227,233,172,1) 0%, rgba(253,163,255,1) 100%);
    border-radius: 3px;
    display: block;
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    transition: all .2s ease-in;
    opacity: 0;
    z-index: -1;
  }

  &:hover:not([disabled]):before {
    opacity: 1;
  }

  &[disabled] {
    background: #fff;
    box-shadow: none;
    cursor: not-allowed;
    opacity: .5;
  }
}

.content {
  display: block;
  text-align: center;
}
</style>
