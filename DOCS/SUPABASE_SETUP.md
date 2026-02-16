# Configuración de Supabase - MYL Platform

## Archivos disponibles

Hay **3 archivos SQL** en `packages/db/` para gestionar tu base de datos:

### 📊 1. DIAGNOSTICO.sql
**Ejecuta PRIMERO** para ver qué existe actualmente en tu base de datos:
- Tablas existentes
- Índices existentes
- Tipos ENUM existentes
- Políticas RLS
- Storage buckets
- Triggers y funciones
- Datos seed (conteo)

### 🧹 2. LIMPIEZA_COMPLETA.sql
**⚠️ ADVERTENCIA:** Elimina TODO de la base de datos. Solo usa esto para:
- Empezar completamente desde cero
- Resolver conflictos irrecuperables
- Reset total del proyecto

### 🚀 3. SETUP_COMPLETO.sql
**Setup completo** e **idempotente** que contiene:
1. ✅ Todas las migraciones (schema completo)
2. ✅ Datos seed con información oficial del juego
3. ✅ Configuración del bucket de imágenes
4. ✅ Políticas RLS
5. ✅ Triggers y constraints
6. ✅ Verificación automática

---

## Pasos para configurar Supabase

### 1. Crear proyecto en Supabase

1. Ir a [https://supabase.com](https://supabase.com)
2. Crear un nuevo proyecto
3. Guardar las credenciales:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (en Settings > API)

### 2. Ejecutar el setup completo

**Opción A: Primera vez (base de datos vacía)**

1. En el dashboard de Supabase, ir a **SQL Editor**
2. Abrir el archivo `packages/db/SETUP_COMPLETO.sql`
3. Copiar TODO el contenido
4. Pegar en el editor SQL
5. Click en **Run**
6. Verificar que aparezcan mensajes de éxito en los logs

**Opción B: Ya ejecutaste algo antes y tienes errores**

1. **Primero**: Ejecuta `packages/db/DIAGNOSTICO.sql` para ver qué existe
2. Revisa los resultados - verás qué tablas, índices y datos ya están creados
3. **Si quieres empezar desde cero**: Ejecuta `packages/db/LIMPIEZA_COMPLETA.sql`
4. **Luego**: Ejecuta `packages/db/SETUP_COMPLETO.sql`

**Opción C: Actualizar/corregir setup existente**

Si ya tienes datos y solo quieres actualizar el schema:
1. Ejecuta `DIAGNOSTICO.sql` para ver el estado actual
2. Identifica qué falta
3. Ejecuta solo las secciones relevantes de `SETUP_COMPLETO.sql` (copiar/pegar partes específicas)

**Opción B: CLI de Supabase (desarrollo local)**

```bash
# Instalar Supabase CLI (si no está instalado)
npm install -g supabase

# Login
supabase login

# Link al proyecto
supabase link --project-ref TU_PROJECT_REF

# Ejecutar migraciones individuales (alternativa)
cd packages/db
supabase db push

# O ejecutar el setup completo
supabase db reset --db-url $DATABASE_URL < SETUP_COMPLETO.sql
```

### 3. Configurar variables de entorno

Copiar `.env.example` a `.env.local` en `apps/web/`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
LOG_LEVEL=debug
```

### 4. Verificar la instalación

Después de ejecutar el script, deberías ver en los logs:

```
=== SETUP COMPLETO - VERIFICACIÓN ===
Bloques: 8 (8 bloques oficiales)
Ediciones: 8 (8 ediciones 2000-2004)
Tipos de carta: 5 (ORO, ALIADO, TOTEM, TALISMAN, ARMA)
Razas: 28 (28 razas oficiales)
Rarezas: 5
Tags: 18
Monedas: 4 (incluye CLP)
Formatos: 3 (Libre, Edición Racial, Edición Libre)
Cartas ejemplo: 3
Printings ejemplo: 3
Bucket "card-images" existe: true
Políticas RLS storage: 4
Estado: ✅ Setup completo exitoso
```

También puedes verificar manualmente:

1. **Database > Tables**: Deberías ver todas las tablas creadas
2. **Storage**: Bucket `card-images` visible
3. **Authentication > Policies**: RLS habilitado en tablas sensibles

---

## Estructura de datos seed incluida

El archivo `SETUP_COMPLETO.sql` ya incluye los siguientes datos oficiales:

### 8 Bloques (2000-2004)
- Mundo Gótico (2000)
- La Ira del Nahual (2001)
- Ragnarok (2001)
- Espíritu de Dragón (2002)
- Espada Sagrada (2003)
- Helénica (2003)
- Dominios de Ra (2004)
- Hijos de Daana (2004)

### 28 Razas oficiales
Por bloque:
- **Mundo Gótico**: Vampiro, Licántropo, Cazador
- **La Ira del Nahual**: Bestia, Chamán, Guerrero
- **Ragnarok**: Dios, Bárbaro, Abominación
- **Espíritu de Dragón**: Campeón, Kami, Xian, Criaturas, Ninja, Samurái, Shaolín
- **Espada Sagrada**: Caballero, Dragón, Faerie
- **Helénica**: Héroe, Titán, Olímpico
- **Dominios de Ra**: Eterno, Sacerdote, Faraón
- **Hijos de Daana**: Sombra, Defensor, Desafiante

### 5 Tipos de carta
- Oro
- Aliado
- Tótem
- Talismán
- Arma

### 3 Formatos
- **Libre**: Todo con todo (50 cartas, oro inicial 0/1)
- **Edición Racial**: Bloque + Raza específica
- **Edición Libre**: Bloque específico, cualquier raza

### 3 Cartas de ejemplo
- Moneda de Sangre (Oro)
- Señor de la Noche (Aliado Vampiro)
- Colmillos Ensangrentados (Arma)

---

## Storage bucket para imágenes

El bucket `card-images` se crea automáticamente con:

- **ID**: `card-images`
- **Público**: Lectura pública, escritura autenticada
- **Tamaño máximo**: 5MB por archivo
- **Formatos**: JPEG, PNG, WebP
- **Estructura**: `printings/{card_printing_id}.{ext}`
- **URL pública**: `https://tu-proyecto.supabase.co/storage/v1/object/public/card-images/printings/{id}.webp`

### Políticas RLS del storage
- ✅ Lectura pública (sin autenticación)
- ✅ Upload: usuarios autenticados
- ✅ Update: usuarios autenticados
- ✅ Delete: solo admins

---

## Comandos útiles de Supabase CLI

Si usas el CLI para desarrollo local:

```bash
# Generar tipos TypeScript desde el schema
cd packages/db
pnpm gen-types:local

# Ver estado de las migraciones
pnpm db:status

# Push de cambios al proyecto remoto
pnpm db:push

# Reset completo (¡cuidado! borra todo)
pnpm db:reset

# Diff de cambios locales vs remoto
pnpm db:diff
```

---

## Solución de problemas

### Error: "relation already exists" o "index already exists"
**Causa:** Ya ejecutaste parte del setup antes.

**Solución paso a paso:**
1. Ejecuta `DIAGNOSTICO.sql` para ver exactamente qué existe
2. Si quieres empezar desde cero: ejecuta `LIMPIEZA_COMPLETA.sql`
3. Luego ejecuta `SETUP_COMPLETO.sql` completo

**Alternativa sin borrar:** Si tienes datos importantes, ejecuta solo las secciones que faltan de `SETUP_COMPLETO.sql`

### Error: "storage.buckets does not exist"
- El schema `storage` no está disponible aún
- Esperar unos segundos y reintentar
- O crear el bucket manualmente desde dashboard > Storage

### Error: "auth.users does not exist"
- El schema `auth` no está disponible (solo en proyectos Supabase)
- Si estás usando PostgreSQL local, comentar tablas que referencian `auth.users`

### Datos seed no aparecen
- Verificar logs del SQL Editor para errores
- Ejecutar solo la sección "PARTE 2: DATOS SEED" del archivo

---

## Próximos pasos

Después del setup exitoso:

1. ✅ Configurar `.env.local` con las credenciales
2. ✅ Ejecutar `pnpm dev` en la raíz del proyecto
3. ✅ Navegar a `http://localhost:3000/catalog`
4. ✅ Verificar que aparezcan los datos seed en el catálogo

Para poblar más cartas reales, puedes:
- Usar el panel de admin en `/admin/cards`
- Importar desde CSV/JSON
- Crear script seed personalizado basado en el ejemplo

---

## Referencias

- [Documentación oficial de Supabase](https://supabase.com/docs)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage](https://supabase.com/docs/guides/storage)
