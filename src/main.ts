import { App } from './app';
import { initLocale, t } from './i18n';
import './styles/main.css';

async function boot(): Promise<void> {
  initLocale();
  const root = document.getElementById('app');
  if (!root) throw new Error('#app not found');

  const app = new App(root);
  await app.init();
}

boot().catch((err) => {
  console.error('Boot failed:', err);
  document.body.innerHTML = `<pre style="color:#f66;padding:1rem">${t('boot.error', { error: String(err) })}</pre>`;
});
