# UX/UI System — MYL Platform (Modern App Spec) v1.1

## 0) Norte de diseño
MYL debe sentirse como:
- Un **builder competitivo** (rápido, claro, sin fricción)
- Un **catálogo pro** (filtros potentes, navegación excelente)
- Un **tracker personal** (colección privada, ordenada, con valor real)
- Un **ecosistema transparente** (precios comunitarios con respaldo)

Regla madre: **cada pantalla debe responder “qué puedo hacer aquí” en 3 segundos**.

---

## 1) Reglas globales UX (no negociables)
1) **Validación siempre visible**  
   Si algo es inválido, se ve de inmediato. No hay “guardar y rezar”.

2) **Restricciones explícitas por Formato**  
   El Formato define la legalidad. La UI filtra/bloquea lo incompatible sin ocultarlo:  
   - “No disponible por Formato: Edición Racial (Mundo Gótico + Vampiro)”.

3) **Acciones primarias al alcance**  
   En cada vista, máximo 1 acción primaria fuerte (CTA) y 1 secundaria.

4) **Nada crítico se entierra**  
   Oro inicial (dentro de las 50), total de cartas, y estado de validez: siempre presente.

5) **Modo Demo real**  
   Permite construir mazos completos y validar, pero:
   - **no persiste**
   - exporta/compartir puede estar limitado (según estrategia)

---

## 2) Arquitectura UI (IA-para-IA)
### 2.1 Jerarquía constante
- **Topbar fija**: navegación rápida + búsqueda global + acceso a Builder + usuario
- **Sidebar (desktop)**: módulos principales + estado (demo/logged)
- **Main**: header + tabs (si aplica) + vista
- **Right Panel contextual** (opcional): métricas, validación, sugerencias, contexto

### 2.2 Layouts oficiales
- **Layout A — Landing**: marketing + previews + CTA + entrada a demo
- **Layout B — App Shell**: sidebar + topbar + main + panel contextual
- **Layout C — Builder**: 3 columnas (catálogo / mazo / análisis)
- **Layout D — Catalog**: filtros + grid + detalles (modal o side-sheet)
- **Layout E — Profile**: settings, privacidad, seguridad, enlaces compartidos
- **Layout F — Public Deck View**: vista pública de mazo + stats + “copiar”

---

## 3) Navegación (módulos)
### 3.1 Sidebar (desktop)
1) **Inicio**
2) **Catálogo**
3) **Constructor de Mazos**
4) **Mis Mazos**
5) **Mi Colección (Privada)**
6) **Precios**
7) **Comunidad**
8) **Administración** (admin/mod)

### 3.2 Topbar (búsqueda global)
- Busca por:
  - carta (fuzzy)
  - bloque/edición
  - raza
  - mazos del usuario
- Resultados con acciones rápidas:
  - Abrir carta
  - Agregar al mazo actual
  - Ver printings
  - Ver precios
  - Abrir mazo

### 3.3 Enlaces y “copiar”
- Los mazos **UNLISTED/PUBLIC** tienen URL compartible
- Opción: “Copiar mazo” crea un mazo editable en tu cuenta (si logueado)
- Si estás en demo: “Copiar” crea un mazo temporal (y sugiere crear cuenta para guardar)

---

## 4) Página inicial moderna (Landing)
### 4.1 Objetivo
- Convertir (registro/login) y orientar (entender valor rápido)
- Permitir explorar sin cuenta (**demo**)
- Comunicar: builder + validación + precios + comunidad

### 4.2 Secciones recomendadas
1) **Hero**
   - Título: “Construye mazos válidos. Decide con datos.”
   - Subtexto: “Catálogo + validación en vivo + precios CLP + comunidad.”
   - CTA primario: **Entrar al Builder**
   - CTA secundario: **Explorar catálogo**
   - CTA terciario (discreto): **Modo Demo**

2) **Preview interactivo**
   - Mini Builder con 3–5 cartas
   - Muestra:
     - validación inmediata
     - total/50
     - oro inicial 0/1
     - curva de coste
     - sugerencias (modo heurístico)

3) **Features con evidencia**
   - Validador auditable (explica por qué)
   - Precios comunitarios (promedio semanal + respaldo)
   - Formatos configurables (Libre / Bloque+Raza / Bloque libre)

4) **Entrada por Bloques**
   - Cards por bloque (Mundo Gótico, Ira del Nahual, etc.)
   - Click: abre catálogo filtrado

5) **Footer fuerte**
   - Roadmap
   - Disclaimer de precios
   - Estado del sistema

---

## 5) Catálogo de cartas (modo pro)
### 5.1 Filtros esenciales (desktop)
- Nombre (fuzzy)
- Tipo (ORO, ALIADO, TOTEM, TALISMAN, ARMA)
- Bloque
- Edición
- Rareza
- Raza
- Coste
- Legal status (active/discontinued/historic)
- “Solo en mi colección” (toggle)
- “Solo faltantes” (toggle)

Notas de reglas:
- Si `card_type = ALIADO` ⇒ `race_id` siempre requerido y visible.
- Para tipos no-ALIADO, raza puede ser opcional (según cómo modeles).

### 5.2 Resultados (grid)
Cada tile:
- imagen
- nombre
- tipo + coste
- badges: edición/bloque + raza (si aplica) + rareza
- estado legal (icono + tooltip)
- precio comunidad (si existe)

### 5.3 Detalle de carta (CardModal / SideSheet)
Tabs:
- **Resumen** (texto reglas + stats)
- **Printings** (ilustraciones/versiones)
- **Precios** (promedio comunidad + historial scraping si existe)
- **Uso en mazos** (cuando haya data suficiente)
Acciones:
- Agregar al mazo actual
- Agregar a mi colección
- Sugerir precio (si cooldown semanal permite)

---

## 6) Constructor de Mazos (core)
### 6.1 Layout estándar (desktop)
- Izquierda: catálogo + filtros rápidos + “agregar”
- Centro: mazo actual
- Derecha: validación + métricas + sugerencias

### 6.2 Selector de formato (sin ambigüedad)
Tipos:
- **Libre**: todo con todo
- **Edición Racial**: (Bloque + Raza)
- **Edición Libre**: (Bloque, cualquier raza)

UI:
- wizard de 1 paso:
  - dropdown formato
  - si aplica: elegir Bloque
  - si aplica: elegir Raza
- El catálogo se ajusta automáticamente y etiqueta lo incompatible.

### 6.3 Centro: Mazo
- Agrupar por tipo: ORO / ALIADO / TOTEM / TALISMAN / ARMA
- Fila:
  - qty (+/-)
  - nombre
  - coste
  - badges (bloque/edición, raza, rareza)
  - estado legal (si aplica)
- **Oro inicial (dentro de las 50)**
  - toggle “Marcar como Oro inicial” (solo ORO sin habilidad)
  - indicador fijo: **Oro inicial 0/1**
- Indicadores fijos:
  - total cartas: **X/50**
  - estado: ✅ / ⚠️ / ❌

### 6.4 Panel derecho (feedback inmediato)
1) **Validación**
   - Errores (block) arriba, avisos (warn) abajo
   - Cada mensaje:
     - regla
     - por qué
     - link “ir a carta”
2) **Métricas**
   - curva de coste (histograma)
   - conteo por tipo
   - conteo por rareza
   - densidad aliados (opcional)
3) **Sugerencias**
   - Solo cartas compatibles con formato
   - Siempre explicar “por qué”
   - Etiquetar si es heurístico o basado en mazos reales

### 6.5 Importar / Copiar / Editar mazos (nuevo)
El Builder debe soportar:
- **Importar mazo** (entrada manual o archivo):
  - pegar lista (ej: “3x Carta”, “1x Carta (Edición X)”)  
  - o CSV simple (nombre, qty, edición opcional)
- **Resolver ambigüedades**:
  - si hay múltiples printings, abrir diálogo para elegir
- **Copiar mazo**:
  - desde un mazo público/unlisted: “Copiar a Mis Mazos”
- **Editar a gusto**:
  - una vez importado/copiad, se aplica validación inmediata del formato elegido

---

## 7) Mis Mazos (gestión moderna)
### 7.1 Lista de mazos
Card por mazo:
- nombre
- formato (Libre / Bloque+Raza / Bloque libre)
- bloque y raza (si aplica)
- updated_at
- visibilidad (Private/Unlisted/Public)
- estado de validez (✅/⚠️/❌)
Acciones rápidas:
- Abrir
- Duplicar
- Compartir
- Exportar

### 7.2 Página de mazo
Tabs:
- Deck (viewer)
- Stats
- Versiones (snapshots)
- Compartir (link)
Acción fuerte:
- “Editar en Builder”

---

## 8) Colección personal (privada)
### 8.1 Reglas
- Por defecto: solo dueño
- Share por link (read-only) si el usuario lo habilita

### 8.2 Funcionalidades clave
- Import/export (CSV)
- Vistas:
  - por bloque/edición
  - por raza
  - faltantes
- Botón: “Completar desde mazo”
  - calcula faltantes vs stock
  - muestra lista de “te faltan X copias”

---

## 9) Precios (CLP) — comunidad + scraping
### 9.1 Pantalla por carta
- Precio comunidad (promedio) visible
- Historial scraping (si existe)
- Fuentes aprobadas (admin)
- CTA: “Sugerir precio” (cooldown semanal por carta)

### 9.2 Regla semanal (duro)
- Usuario: 1 sugerencia / semana / carta
- UI:
  - si bloqueado: “Disponible el YYYY-MM-DD”
- Formulario:
  - precio CLP
  - condición (opcional)
  - nota (opcional)

Notas:
- Si no hay página externa: solo muestra comunidad.

---

## 10) Comunidad (sin volverse foro)
Módulos:
- Mazos públicos (cuando existan)
- Tendencias de precios (agregado)
- Reportes (minimal)
- Transparencia moderación (solo lo necesario)

### 10.1 “Copiar mazos” (nuevo)
- En mazos públicos:
  - botón “Copiar”
  - muestra compatibilidad con tu formato actual (si estás en builder)

---

## 11) Admin (rol)
Funciones:
- Aprobar/rechazar links `price_sources`
- Ejecutar scraping manual / programar jobs
- CRUD cartas (draft/published)
- Subir imagen carta (frontal y dorso)
- Editar dorso oficial (si aplica)
- Ver reportes y acciones (audit)

---

## 12) Modo Demo (nuevo, explícito)
### 12.1 Qué permite
- Explorar catálogo
- Abrir cartas y ver printings
- Construir mazos con validación y métricas

### 12.2 Qué NO permite
- Persistir mazos
- Editar colección
- Sugerir precios (recomendado bloquearlo en demo)

### 12.3 UX del demo
- Banner discreto: “Modo Demo: mazo temporal”
- CTA contextual: “Crear cuenta para guardar”

---

## 13) Design System (tokens + componentes)
### 13.1 Tokens (CSS variables)
- colores: bg/surface/text/accent/warn/danger/success
- spacing: 4/8/12/16/24/32
- radius: sm/md/lg
- typography: title/body/mono

### 13.2 Estados UI obligatorios
- loading (skeleton)
- empty (con CTA real)
- error (humano + retry)
- offline (si PWA)

---

## 14) Mobile (sin sacrificar potencia)
Builder en flujo vertical:
1) Selector formato
2) Catálogo (filtros colapsables)
3) Mazo (lista)
4) Validación + métricas como bottom-sheet

---

## 15) Accesibilidad + performance
- teclado navegable (filtros, modal, listas)
- contraste correcto en dark
- virtualización de grids grandes
- debounce búsqueda
- cache local (solo en cuentas): filtros y último mazo abierto

---

## 16) Frontend Design Quality (ref: Claude Code Frontend Design Skill)

### 16.1 Principio rector
Crear interfaces **distintivas y production-grade** que eviten esteticas genericas.
Cada pantalla debe tener intencion de diseno clara, no defaults de framework.

### 16.2 Design Thinking (antes de codear)
- **Proposito**: Que problema resuelve esta interfaz? Quien la usa?
- **Tono**: MYL es un builder competitivo + catalogo pro + tracker personal.
  Tono recomendado: **refinado-gaming** — limpio, preciso, con acentos audaces que transmiten competitividad sin ser ruidoso.
- **Diferenciador**: Validacion en vivo como pieza central visual. Las restricciones de formato son visibles, no ocultas.

### 16.3 Tipografia
- NO usar fuentes genericas (Arial, Inter, Roboto, system fonts).
- Elegir una fuente display **distintiva** para titulos + fuente body **refinada**.
- Par recomendado: fuente display con caracter (ej: editorial, geometrica) + body legible.
- Monospace para datos tecnicos (IDs, reglas, JSON).

### 16.4 Color y tema
- CSS variables para consistencia (definidas en globals.css).
- Colores dominantes con acentos fuertes. Evitar paletas timidas y distribuidas uniformemente.
- Tema dark como opcion real, no accesorio.
- Colores semanticos: warn (amarillo), danger (rojo), success (verde), info (azul).
- NUNCA: gradientes purpura sobre blanco, esquemas de color cliche.

### 16.5 Motion y micro-interacciones
- Priorizar soluciones CSS-only para animaciones.
- Foco en momentos de alto impacto: carga de pagina con reveals escalonados (animation-delay).
- Hover states que sorprendan pero no distraigan.
- Transiciones suaves en validacion (agregar/quitar cartas, cambios de estado).
- Scroll-triggered animations donde tenga sentido.

### 16.6 Composicion espacial
- Layouts con intencion: asimetria controlada, negative space generoso.
- El Builder (3 columnas) es el layout mas complejo — cada columna tiene su jerarquia.
- Grid-breaking elements para llamar atencion (CTA, estado de validez, alertas).

### 16.7 Fondos y detalles visuales
- Crear atmosfera y profundidad, no defaults de color solido.
- Texturas sutiles, gradientes mesh, sombras dramaticas cuando corresponda.
- Bordes decorativos y separadores con proposito.

### 16.8 Anti-patrones (prohibidos)
- Font families genericas (Inter, Roboto, Arial, system-ui)
- Gradientes purpura sobre blanco
- Layouts predecibles y cookie-cutter
- Componentes sin caracter contextual
- Convergencia en elecciones comunes (Space Grotesk, etc.)
- Diseno que luce "generado por IA"

### 16.9 Regla de implementacion
- Complejidad del codigo debe coincidir con la vision estetica.
- Disenos maximalistas necesitan codigo elaborado con animaciones y efectos.
- Disenos minimalistas necesitan precision en spacing, tipografia y detalles sutiles.
- La elegancia viene de ejecutar la vision con compromiso total.
