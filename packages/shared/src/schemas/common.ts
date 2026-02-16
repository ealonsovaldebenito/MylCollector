import { z } from 'zod';

/**
 * Schemas comunes reutilizables (doc 00_GLOSSARY_AND_IDS).
 */
export const uuidSchema = z.string().uuid();

export const shareCodeSchema = z.string().min(6).max(16);

export const visibilitySchema = z.enum(['PRIVATE', 'UNLISTED', 'PUBLIC']);

export type Visibility = z.infer<typeof visibilitySchema>;
