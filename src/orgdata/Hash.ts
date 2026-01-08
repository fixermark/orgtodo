/*
 * Copyright 2026 Mark T. Tomczak
 * Licensed under the MIT License (https://opensource.org/licenses/MIT)
 */

import {sha256} from '@noble/hashes/sha2.js';

/** Hashing of entries */

export async function hashForText(text: string): Promise<string> {
  // Note: crypto.subtle.digest not available on non-secure environments
  const buffer = new TextEncoder().encode(text);
  if (crypto.subtle) {
    const hash = await crypto.subtle.digest('SHA-256', buffer);
    return new Uint8Array(hash).reduce((str: string, byte: number) => str + byte.toString(16).padStart(2, '0'), '');
  }
  const hash = sha256(buffer);
  return hash.reduce((str: string, byte: number) => str + byte.toString(16).padStart(2, '0'), '');
}
