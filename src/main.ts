import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

// MSW stands in for the backend in every build so the deployed demo works without a server.
async function enableMocking() {
  const { worker } = await import('./mocks/browser')
  await worker.start({
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
    onUnhandledFrame: 'bypass',
  })
}

enableMocking().then(() => {
  createApp(App).use(createPinia()).mount('#app')
})
