import type { Preset } from './types.ts';
import { STARTER_PRESETS } from './presets.ts';

const STORAGE_KEY = 'ae-motion-tools:presets';

export class PresetStorage {
  /** Load all presets (starters + user saved) */
  static loadAll(): Preset[] {
    const userPresets = this.loadUserPresets();
    return [...STARTER_PRESETS, ...userPresets];
  }

  /** Load only user-saved presets */
  static loadUserPresets(): Preset[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data) as Preset[];
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch (err) {
      console.error('Failed to load presets from localStorage', err);
      return [];
    }
  }

  /** Save a new preset */
  static savePreset(preset: Preset): void {
    if (preset.isBuiltIn) {
      throw new Error('Cannot overwrite a built-in starter preset.');
    }
    const current = this.loadUserPresets();
    
    // Replace if it exists, otherwise append
    const existingIndex = current.findIndex(p => p.id === preset.id);
    if (existingIndex >= 0) {
      current[existingIndex] = preset;
    } else {
      current.push(preset);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  }

  /** Delete a preset by ID */
  static deletePreset(id: string): void {
    const isBuiltIn = STARTER_PRESETS.some(p => p.id === id);
    if (isBuiltIn) {
      throw new Error('Cannot delete a built-in starter preset.');
    }
    
    const current = this.loadUserPresets();
    const updated = current.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  /** Export all user presets to JSON string */
  static exportJSON(): string {
    const userPresets = this.loadUserPresets();
    return JSON.stringify(userPresets, null, 2);
  }

  /** Import user presets from a JSON string */
  static importJSON(jsonStr: string): void {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!Array.isArray(parsed)) {
        throw new Error('Imported JSON must be an array of presets.');
      }
      
      const current = this.loadUserPresets();
      
      for (const item of parsed) {
        if (!item.id || !item.name || !item.p1 || !item.p2) {
          throw new Error('Invalid preset format found during import.');
        }
        item.isBuiltIn = false; // Ensure imported items are mutable
        
        const existingIndex = current.findIndex(p => p.id === item.id);
        if (existingIndex >= 0) {
          current[existingIndex] = item;
        } else {
          current.push(item);
        }
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch (err) {
      console.error('Failed to import JSON', err);
      throw err;
    }
  }
}
