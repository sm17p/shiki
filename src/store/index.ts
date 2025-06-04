import { LazyStore } from '@tauri-apps/plugin-store';
import { STORE_DEFAULTS } from '@/constants';

export const store = new LazyStore('store.json', { autoSave: true });
