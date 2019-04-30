<template lang="html">
  <div v-if="loggedIn" :class="$style.container">
    <CreateBrewery v-if="isBrewery" />
    <CreateOwner v-if="isOwner" />
  </div>
</template>

<script>
import { mapState } from 'vuex'
import CreateBrewery from './CreateBrewery.vue'
import CreateOwner from './CreateOwner.vue'
// import LoginForm from './LoginForm.vue'

export default {
  name: 'Create',

  props: {
    loggedIn: Boolean
  },

  components: {
    CreateBrewery,
    CreateOwner
    // LoginForm
  },

  data () {
    return {
      isBrewery: (this.$route.params.type === 'brewery'),
      isOwner: (this.$route.params.type === 'owner'),
      isLoggedIn: this.loggedIn
    }
  },

  computed: {
    ...mapState([
      'loading'
    ])
  },

  beforeMount: function () {
    this.userCheck()
  },

  methods: {
    userCheck: function () {
      // console.log(this.loggedIn)
      if (!this.loggedIn) {
        this.$router.push({path: '/login', query: {returnPath: this.$route.path}})
      }
    }
  }
}
</script>

<style lang="postcss" module>
@import '../assets/_mixins';

</style>
