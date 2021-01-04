import { createApp } from 'vue'
import App from './App.vue'
import ControlButton from './components/ControlButton.vue';

const app = createApp(App);

app.component('ControlButton', ControlButton);
app.mount('#quiz');
