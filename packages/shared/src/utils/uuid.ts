import { v7 as uuidv7 } from 'uuid';

/**
 * Genera un UUID v7 (doc 00_GLOSSARY_AND_IDS).
 * Todos los IDs internos deben ser UUIDs.
 */
export function generateId(): string {
  return uuidv7();
}
