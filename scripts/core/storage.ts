import { world } from "@minecraft/server";

type StoredValue = string | number | boolean;

const cache = new Map<string, StoredValue>();

export function loadStorage() {
  cache.clear();
  for (const key of world.getDynamicPropertyIds()) {
    const value = world.getDynamicProperty(key);
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      cache.set(key, value);
    }
  }
}

export function readValue<T extends StoredValue>(key: string, fallback: T): T {
  const value = cache.get(key);
  return typeof value === typeof fallback ? (value as T) : fallback;
}

export function writeValue(key: string, value: StoredValue) {
  cache.set(key, value);
  world.setDynamicProperty(key, value);
}

export function dropValue(key: string) {
  cache.delete(key);
  world.setDynamicProperty(key, undefined);
}

export function hasValue(key: string) {
  return cache.has(key);
}

export function keysWithPrefix(prefix: string) {
  const found: string[] = [];
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) found.push(key);
  }
  return found;
}
