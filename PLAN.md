# Plan: Rediseño del módulo de creación/edición de cartas

## Problema actual
- Al crear una carta, NO se puede agregar impresiones, imagen, edición ni bloque
- Hay que crear la carta → ir a edit → agregar impresión por separado → subir imagen
- No hay cascada Bloque → Edición
- No hay precio referencial ni cantidad
- El estado legal (banlist) existe pero solo en el form de impresión separado

## Objetivo
Formulario unificado: crear carta + N impresiones con todos sus datos de una sola vez.

---

## Fase 1: Nuevo componente `PrintingInlineForm`

**Archivo:** `apps/web/src/components/admin/printing-inline-form.tsx`

Componente reutilizable para una fila de impresión dentro del CardForm:
- **Bloque** (Select) → filtra ediciones disponibles
- **Edición** (Select cascadeado)
- **Rareza** (Select)
- **Estado legal / Banlist** (Select: Legal, Restringida, Prohibida, Discontinuada)
- **Ilustrador** (Input)
- **Nro. colección** (Input)
- **Precio referencial** (Input numérico, CLP)
- **Imagen** (ImageUpload compacto)
- Botón eliminar fila

Props: `blocks, editions, rarities, value, onChange, onRemove`

## Fase 2: Rediseño de `CardForm`

**Archivo:** `apps/web/src/components/admin/card-form.tsx` — reescribir

Cambios:
1. Agregar state `newPrintings` como array de `PrintingDraft[]`:
   ```ts
   interface PrintingDraft {
     id: string; // temp UUID para key
     block_id: string;
     edition_id: string;
     rarity_tier_id?: string;
     legal_status: string;
     illustrator: string;
     collector_number: string;
     reference_price?: number;
     imageFile: File | null;
     imagePreview: string | null;
   }
   ```

2. Sección nueva "Impresiones" después de Etiquetas:
   - Lista de `PrintingInlineForm` para cada draft
   - Botón "Agregar impresión" que añade nueva fila vacía
   - En modo create: se muestra siempre (con al menos 1 fila por defecto)
   - En modo edit: las existentes se muestran como lista de lectura + botón para agregar nuevas

3. Props: agregar `blocks` y `editions` (ya existen pero no se usaban en create)

4. Nuevo `handleSubmit`:
   ```
   a) Crear/actualizar carta (API)
   b) Para cada printing nuevo:
      - POST /api/v1/cards/{cardId}/printings
      - Si tiene imageFile → POST .../image
      - Si tiene reference_price → insertar precio referencial
   c) Redirigir a /admin/cards/{cardId}/edit (o /admin/cards)
   ```

5. Barra de progreso durante submission multi-paso

## Fase 3: Actualizar páginas

### `apps/web/src/app/(app)/admin/cards/new/page.tsx`
- Pasar `blocks`, `editions`, `rarities` al CardForm (actualmente no se pasan)

### `apps/web/src/app/(app)/admin/cards/[cardId]/edit/page.tsx`
- Pasar `blocks`, `editions`, `rarities` al CardForm
- Ya se usa `useCatalogData()` que tiene todo

## Fase 4: Servicio de precio referencial

**Archivo:** `apps/web/src/lib/services/cards.service.ts`

Nueva función:
```ts
async function setReferencePrice(supabase, printingId: string, price: number): Promise<void>
```
- Upsert en `card_price_consensus` con:
  - `card_printing_id`: printingId
  - `consensus_price`: price
  - `currency_id`: resolver "CLP" de tabla `currencies` (o hardcodear si solo hay una)

## Fase 5: Verificación
- `pnpm type-check` limpio
- `pnpm build` exitoso
- `pnpm test` pasa

---

## Archivos a modificar/crear

| Archivo | Acción |
|---------|--------|
| `components/admin/printing-inline-form.tsx` | **NUEVO** — formulario inline de impresión |
| `components/admin/card-form.tsx` | **REESCRIBIR** — agregar sección de impresiones |
| `app/(app)/admin/cards/new/page.tsx` | **MODIFICAR** — pasar blocks, editions, rarities |
| `app/(app)/admin/cards/[cardId]/edit/page.tsx` | **MODIFICAR** — pasar rarities |
| `lib/services/cards.service.ts` | **MODIFICAR** — agregar setReferencePrice |

## Notas
- El schema `createCardPrintingSchema` ya tiene todos los campos necesarios
- La tabla `card_printings` ya tiene `legal_status` (banlist)
- La cascada Bloque→Edición ya se implementó en `card-printing-form.tsx`, solo hay que replicar
- El flujo de subida de imagen ya existe (FormData → API → Storage), se reutiliza
- No se modifica ningún endpoint API, solo se orquesta desde el frontend
