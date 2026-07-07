import { createApp } from 'vue';
import { createPinia } from 'pinia';
import VueApexCharts from 'vue3-apexcharts';
import App from './App.vue';
import router from './router';
import { useThemeStore } from './stores/theme';
import './style.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.component('apexchart', VueApexCharts);

const theme = useThemeStore(pinia);
theme.init();

app.mount('#app');
