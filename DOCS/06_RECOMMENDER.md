# Recomendador (co-ocurrencia real)

## No magia
Sugerencias basadas en datos de mazos públicos (internos/externos):
- Soporte: % de mazos con A que también tienen B
- Confidence / lift para priorización

## Dataset
- public_decks + public_deck_cards
- se normaliza por formato

## Matriz
- card_pair_stats(format_id, card_a_id, card_b_id, cooccur_count, support, confidence, lift)

## Serving
Al editar mazo:
- contexto = set de cartas actuales
- candidatos = intersección de recomendaciones por carta
- penalizar incompatibilidad (formato/reglas)
- devolver lista con score y explicación ("aparece en X% de mazos similares")

## Feedback loop
- recommendation_feedback(added/ignored/dismissed) para medir utilidad
