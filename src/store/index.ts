import { load } from '@tauri-apps/plugin-store';
import { STORE_DEFAULTS } from '@/constants';

export const store = await load('store.json', { autoSave: true });



