/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from '@/plugins'

import { Quasar } from 'quasar';
import 'quasar/dist/quasar.css';

import { QEditor } from 'quasar';


import '@quasar/extras/material-icons/material-icons.css';
import 'quasar/dist/quasar.css'; // Ensure this line is included
import '@quasar/extras/material-icons/material-icons.css'; // Import material icons for the toolbar

// Components
import App from './App.vue'

// Composables
import { createApp } from 'vue'

const app = createApp(App)

app.use(Quasar, {
    components: {
      QEditor,  // Register the QEditor component
    },
  });


registerPlugins(app)

app.mount('#app')
