# Configuración de Storage en Supabase

## 1. Crear el bucket de imágenes

1. Abre tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Ve a la sección **Storage** en el menú lateral
3. Haz clic en **Create a new bucket**
4. Configura el bucket:
   - **Name:** `card-images`
   - **Public bucket:** ✅ Activar (las imágenes serán públicas para lectura)
   - **File size limit:** 5 MB (opcional, para limitar tamaño de uploads)
   - **Allowed MIME types:** `image/jpeg,image/png,image/webp` (opcional)
5. Haz clic en **Create bucket**

## 2. Configurar políticas RLS (Row Level Security)

Las políticas ya están definidas en `SETUP_COMPLETO.sql` (sección Storage), pero si necesitas crearlas manualmente:

### Política de lectura pública (SELECT)

```sql
CREATE POLICY "card_images_select_public"
ON storage.objects
FOR SELECT
USING (bucket_id = 'card-images');
```

Esta política permite que **cualquier usuario** (autenticado o no) pueda **ver** las imágenes.

### Política de escritura (INSERT)

```sql
CREATE POLICY "card_images_insert_admin"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'card-images'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE user_id = auth.uid()
    AND role = 'ADMIN'
  )
);
```

Esta política permite que **solo admins** puedan **subir** imágenes.

### Política de actualización (UPDATE)

```sql
CREATE POLICY "card_images_update_admin"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'card-images'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE user_id = auth.uid()
    AND role = 'ADMIN'
  )
);
```

Esta política permite que **solo admins** puedan **actualizar** imágenes.

### Política de eliminación (DELETE)

```sql
CREATE POLICY "card_images_delete_admin"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'card-images'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE user_id = auth.uid()
    AND role = 'ADMIN'
  )
);
```

Esta política permite que **solo admins** puedan **eliminar** imágenes.

## 3. Verificar configuración

Ejecuta esta query en el **SQL Editor** para verificar que el bucket y las políticas existen:

```sql
-- Verificar bucket
SELECT * FROM storage.buckets WHERE id = 'card-images';

-- Verificar políticas
SELECT
  policyname,
  cmd as operacion,
  CASE
    WHEN qual IS NOT NULL THEN 'USING presente'
    ELSE 'Sin USING'
  END as tiene_using,
  CASE
    WHEN with_check IS NOT NULL THEN 'WITH CHECK presente'
    ELSE 'Sin WITH CHECK'
  END as tiene_with_check
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND policyname LIKE 'card_images_%'
ORDER BY policyname;
```

## 4. Estructura de archivos

El servicio `storage.service.ts` guarda las imágenes con esta estructura:

```
card-images/
└── printings/
    ├── {card_printing_id_1}.webp
    ├── {card_printing_id_2}.jpg
    └── {card_printing_id_3}.png
```

Ejemplo:
```
card-images/printings/01936eef-7890-7e5d-8000-123456789abc.webp
```

## 5. URLs públicas

Una vez subida una imagen, la URL pública tiene este formato:

```
https://{project_id}.supabase.co/storage/v1/object/public/card-images/printings/{card_printing_id}.{ext}
```

Ejemplo:
```
https://pshawtdhlkkubaezvzrv.supabase.co/storage/v1/object/public/card-images/printings/01936eef-7890-7e5d-8000-123456789abc.webp
```

## 6. Límites y consideraciones

- **Tamaño máximo por archivo:** 50 MB (límite de Supabase free tier)
- **Ancho de banda:** 2 GB/mes en free tier
- **Formatos recomendados:** WebP (mejor compresión), PNG (transparencias), JPG (fotos)
- **Dimensiones recomendadas:**
  - Carta completa: 420x588px (ratio 5:7 típico de TCG)
  - Thumbnail: 210x294px (mitad de tamaño)

## 7. Uso desde la aplicación

El servicio `storage.service.ts` ya está implementado con estos métodos:

```typescript
// Subir imagen
const imageUrl = await uploadCardImage(supabase, file, cardPrintingId);

// Obtener URL pública (sin hacer request a Supabase)
const imageUrl = getCardImageUrl(cardPrintingId);

// Eliminar imagen
await deleteCardImage(supabase, cardPrintingId);
```

## 8. Troubleshooting

### Error: "new row violates row-level security policy"

- **Causa:** El usuario no tiene permisos para subir archivos
- **Solución:** Verifica que el usuario está autenticado y tiene rol `ADMIN` en la tabla `users`

### Error: "Bucket not found"

- **Causa:** El bucket `card-images` no existe
- **Solución:** Crea el bucket siguiendo el paso 1

### Las imágenes no se ven (404)

- **Causa:** El bucket no está configurado como público
- **Solución:** Ve a Storage > card-images > Settings > Public bucket: ✅ Activar

### Error: "File size too large"

- **Causa:** El archivo excede el límite configurado
- **Solución:** Reduce el tamaño de la imagen o aumenta el límite en la configuración del bucket
