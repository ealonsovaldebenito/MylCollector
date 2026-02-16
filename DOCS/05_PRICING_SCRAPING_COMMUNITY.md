# Sistema de precios (scraping + comunidad + consenso)

## Principios
- Histórico nunca se borra.
- Precios externos: normalizar moneda (CLP base, por ejemplo).
- Comunidad: submissions + votos => consenso explicable.

## Scraping
- price_sources: links por carta_printing
- scraper jobs periódicos
- card_prices: histórico capturado_at + store_id + source_url + confidence

## Comunidad
- community_price_submissions: precio + condición + nota + timestamp
- votes: up/down/flag
- consenso: final_price con explain_json (muestra contribuciones y ponderación)

## Moderación
- links sugeridos: pending/approved/rejected
- acciones de moderación auditadas
