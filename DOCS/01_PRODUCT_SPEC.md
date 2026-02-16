# Producto — MYL Deck & Card Platform (Spec)

## Objetivo
App web responsiva (PWA-ready) para:
- Gestionar cartas, colección personal (stock) y mazos.
- Construir mazos válidos por edición/bloque/raza/formato.
- Métricas reales del mazo (tipos, curva, rarezas).
- Visualizador con filtros potentes.
- Precios: scraping + consenso comunitario + histórico.
- Recomendador: sugerencias basadas en data histórica real (co-ocurrencia), NO "magia".
- Usuarios pueden sugerir links de tiendas para scrapers.

## Principios que no se rompen
1) Datos antes que opiniones: toda sugerencia/precio/estadística debe tener respaldo visible.
2) Restricciones explícitas: formato define qué es legal; el sistema bloquea lo incompatible.
3) UX jugador real: rapidez, feedback inmediato, cero fricción inútil.
4) Sistema evolutivo: nuevas ediciones/razas/reglas sin reescribir todo.

## Alcance (Fases)
### Fase 1
- Cartas + printings + ediciones/bloques + rarezas
- Visualizador
- Mazos + validación en tiempo real
- Métricas básicas

### Fase 2
- Stock personal
- Precios (scraping + histórico + comunidad + consenso)

### Fase 3
- Recomendador (co-ocurrencia)
- Análisis histórico y comparativas

## Dominio: Ediciones y Razas
Razas por edición (base, expandible):
- Mundo Gótico (2000): Vampiro, Licántropo, Cazador
- La Ira del Nahual (2001): Bestia, Chamán, Guerrero
- Ragnarok (2001): Dios, Bárbaro, Abominación
- Espíritu de Dragón (2002): Campeón, Kami, Xian, Criaturas (+ sub-razas Ninja/Samurái/Shaolín)
- Espada Sagrada (2003): Caballero, Dragón, Faerie
- Helénica (2003): Héroe, Titán, Olímpico
- Dominios de Ra (2004): Eterno, Sacerdote, Faraón
- Hijos de Daana (2004): Sombra, Defensor, Desafiante

## UX clave
- Constructor de mazos en una sola vista:
  - Izquierda: cartas disponibles + filtros
  - Centro: mazo actual
  - Derecha: métricas + sugerencias
  - Mobile: flujo vertical
- No permitir guardar inválido + explicar el porqué.
