/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App.
 */

import { createApp } from 'vue'
import { Quasar, QEditor } from 'quasar'
import 'quasar/dist/quasar.css'
import '@quasar/extras/material-icons/material-icons.css'

import { registerPlugins } from '@/plugins'
import App from './App.vue'

const app = createApp(App)

app.use(Quasar, {
  components: {
    QEditor,
  },
})

registerPlugins(app)
app.mount('#app')
