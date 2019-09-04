<template lang="html">
  <div :class="$style.container">

    <div :class="$style.card">

      <h1 :class="$style.title">
        Add a new brewery
      </h1>

      <form
        accept-charset="UTF-8"
        @submit.prevent="handleSubmit"
      >
        <input
          type="hidden"
          name="sectionId"
          value="1"
        >
        <input
          type="hidden"
          name="enabled"
          value="1"
        >
        <input
          type="hidden"
          :name="csrfName"
          :value="csrfToken"
        >
        <input type="hidden" name="entryId" value="">

        <div :class="$style.item">
          <FormInput
            type="text"
            id="title"
            name="title"
            label="Title *"
            v-model="form.title"
            v-validate="'required|min:2'"
          />
          <span>{{ errors.first('title') }}</span>
        </div>

        <div :class="$style.location">
          <div :class="$style.item">
            <FormInput
              type="text"
              id="city"
              name="city"
              label="City"
              v-model="form.fields['city']"
            />
          </div>

          <div :class="$style.item">
            <FormSelect
              v-model="form.fields['country']"
              v-validate="'excluded:0'"
              id="country"
              name="fields[country]"
              label="Country *"
              empty-option="Select country …"
              is-countries
            />
          </div>
        </div>

        <div :class="$style.item">
          <FormInput
            type="date"
            id="founded"
            name="founded"
            label="Founded"
            v-model="form.fields['founded']"
          />
        </div>

        <div :class="$style.item">
          <FormInput
            type="textarea"
            id="note"
            name="note"
            label="Note"
            rows="7"
            v-model="form.fields['note']"
          />
        </div>

        <hr>

        <div :class="$style.item">
          <label for="isPrivate">is independent</label>
          <input
            v-model="form.fields['isPrivate']"
            id="isPrivate"
            type="checkbox"
            name="isPrivate"
          />
        </div>

        <div :class="$style.item">
          <FormSelect
            v-model="form.fields['owners']"
            id="owners"
            name="fields[owners]"
            label="Owned by"
            empty-option="Select owner …"
            :list="owners"
          />
        </div>

        <div :class="$style.item">
          <FormInput
            type="date"
            id="ownedSince"
            name="ownedSince"
            label="Owned since"
            v-model="form.fields['ownedSince']"
          />
        </div>

        <base-button
          :disabled='errors.any() || !isComplete'
          :loading="inProgress"
          :success="success"
          alignRight
          >
          Create Brewery
        </base-button>
      </form>

      {{success}}

      <!-- <ul>
        <li v-for="(item, k) in form" :key="k">
         <strong>{{ k }}:</strong> {{ item }}
        </li>
      </ul> -->
    </div>

  </div>
</template>

<script>
import { mapState } from 'vuex'
import FormSelect from './BaseSelect.vue'
import BaseButton from './BaseButton.vue'
import FormInput from './BaseInput.vue'

function initialState () {
  return {
    form: {
      title: '',
      entryId: '',
      fields: {
        founded: '',
        city: '',
        country: '',
        note: '',
        owners: [],
        isPrivate: '',
        ownedSince: ''
      },
      method: 'post',
      action: 'entries/save-entry',
      returnUrl: '/#/breweries/',
      sectionId: 1,
      enabled: 1
    },
    theUser: {
      loginName: null,
      password: null,
      action: 'users/login',
      returnUrl: '/create/brewery'
    },
    inProgress: false,
    success: false
  }
}

export default {
  name: 'CreateBrewery',

  props: [
    'loggedIn'
  ],

  components: {
    FormSelect,
    BaseButton,
    FormInput
  },

  data () {
    return initialState()
  },

  computed: {
    ...mapState([
      'owners',
      'loading'
    ]),

    csrfName () {
      return window.csrfTokenName
    },

    csrfToken () {
      return window.csrfTokenValue
    },

    isComplete () {
      return this.form.title && this.form.fields['country']
    }
  },

  mounted: function () {
    this.$store.dispatch('LOAD_OWNERS_LIST')
  },

  methods: {
    handleSubmit (e) {
      this.$validator.validateAll().then((result) => {
        if (result) {
          let data = this.form

          data[window.csrfTokenName] = window.csrfTokenValue

          this.inProgress = true

          console.log(data)

          this.$http.post('/', data)
            .then(function (response) {
              e.target.reset()
              this.resetForm()

              this.success = true
              this.inProgress = false
              this.$store.state.loading = false

              setTimeout(function () {
                this.success = false
              }.bind(this), 2000)
            })
        }
      })
    },

    resetForm () {
      Object.assign(this.$data, initialState())
    }
  },

  metaInfo () {
    return {
      title: 'Add a new brewery',
      titleTemplate: null
    }
  }
}
</script>

<style lang="postcss" module>
@import '../assets/_mixins';

.container {
  @mixin container-padding;
  @mixin baseline 20, margin-bottom;
  lost-center: var(--grid-max-width);
}

.card {
  @mixin baseline 10, margin-top;
  @mixin baseline 4, padding;
  background: rgb(85,85,85);
  background: linear-gradient(127deg, rgba(85,85,85,1) 0%, rgba(40,41,40,1) 100%);
  box-shadow: 0 6px 12px rgba(0, 0, 0, .3);
  color: var(--color-alto);
  lost-column: 3/4;
  lost-offset: 1/8;
  /* max-width: 600px;
  width: 100%; */
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

.item {
  /* @mixin baseline 3, margin-bottom; */

  label {
    display: block;
  }

  [aria-invalid='true'] {
    border: 1px solid red;
  }
}

.location {
  lost-center: var(--grid-max-width);

  .item {
    lost-column: 1/2;
  }
}
</style>
