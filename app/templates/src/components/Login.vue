<template lang="html">
  <div :class="$style.container">
    <div :class="$style.card">
      <h1 :class="$style.title">{{heading}}</h1>

      <form accept-charset="UTF-8" @submit.prevent="doLogin">
        <input type="hidden" :name="csrfName" :value="csrfToken">

        <div :class="$style.item">
          <FormInput
            type="text"
            id="loginName"
            name="loginName"
            label="Username"
            v-model="theUser.loginName"
            v-validate="'required'"
          />
        </div>

        <div :class="$style.item">
          <FormInput
            type="password"
            id="password"
            name="password"
            label="Password"
            v-model="theUser.password"
            v-validate="'required'"
          />
        </div>

        <div v-if="formErrors.length" :class="$style.errors">
          {{formErrors}}
        </div>
        <!-- :disabled='errors.any() || !isComplete' -->
        <base-button
          :disabled='errors.any() || !isComplete'
          :loading="inProgress"
          :success="success"
          alignRight
        >
          Login
        </base-button>
      </form>
    </div>
  </div>
</template>

<script>
import FormInput from './BaseInput.vue'
import BaseButton from './BaseButton.vue'
import NProgress from 'nprogress'

export default {
  name: 'LoginForm',

  components: {
    FormInput,
    BaseButton
  },

  props: {
    action: String,
    returnPath: String
  },

  data () {
    return {
      heading: 'Prove me you\'re worthy, peasant.',
      theUser: {
        loginName: null,
        password: null,
        action: 'users/login',
        returnUrl: this.$route.query.returnPath || '/'
      },
      formErrors: [],
      inProgress: false,
      success: false
    }
  },

  computed: {
    csrfName () {
      return window.csrfTokenName
    },

    csrfToken () {
      return window.csrfTokenValue
    },

    isComplete () {
      return this.theUser.loginName && this.theUser.password
    }
  },

  mounted: function () {
    NProgress.done()
  },

  methods: {
    doLogin (e) {
      let data = this.theUser

      data[window.csrfTokenName] = window.csrfTokenValue
      this.inProgress = true

      this.$http.post('/', data)
        .then(function (response) {
          if (response.body.success) {
            this.success = true

            setTimeout(function () {
              window.location.href = data.returnUrl
            }, 1000)
          }

          if (response.body.error) {
            this.formErrors = response.body.error
          }

          this.inProgress = false
          this.$store.state.loading = false
        })
    }
  },

  metaInfo () {
    return {
      title: 'Login',
      titleTemplate: null
    }
  }
}
</script>

<style lang="postcss" module>
@import '../assets/_mixins';

.container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

.card {
  @mixin baseline 4, padding;
  background: rgb(85,85,85);
  background: linear-gradient(127deg, rgba(85,85,85,1) 0%, rgba(40,41,40,1) 100%);
  box-shadow: 0 6px 12px rgba(0, 0, 0, .3);
  color: var(--color-alto);
  max-width: 600px;
  width: 100%;
}

.title {
  @mixin font 38, 48, var(--heading-font);
  @mixin baseline 10, margin-bottom;
  color: var(--color-sand);
  font-weight: 200;
  margin-top: 0;
  max-width: 400px;
  width: 100%;
}
</style>
