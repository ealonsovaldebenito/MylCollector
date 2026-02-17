import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@myl/db';
import type { SubmitPrice, VotePrice } from '@myl/shared';
import { AppError } from '../api/errors';

type Client = SupabaseClient<Database>;

const COOLDOWN_MINUTES = 15; // User can submit price every 15 minutes

/**
 * Submit a new community price
 */
export async function submitCommunityPrice(
  supabase: Client,
  userId: string,
  data: SubmitPrice,
) {
  // Check cooldown: user can only submit once every COOLDOWN_MINUTES
  const cooldownTime = new Date(Date.now() - COOLDOWN_MINUTES * 60 * 1000);

  const { data: recentSubmissions, error: checkError } = await supabase
    .from('community_price_submissions')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', cooldownTime.toISOString())
    .limit(1);

  if (checkError) throw new AppError('INTERNAL_ERROR', 'Error al verificar cooldown');

  if (recentSubmissions && recentSubmissions.length > 0) {
    const lastSubmission = new Date(recentSubmissions[0]!.created_at);
    const remainingMs = COOLDOWN_MINUTES * 60 * 1000 - (Date.now() - lastSubmission.getTime());
    const remainingMin = Math.ceil(remainingMs / 60000);
    throw new AppError(
      'RATE_LIMITED',
      `Debes esperar ${remainingMin} minuto(s) antes de enviar otro precio.`,
    );
  }

  // Create submission
  const { data: submission, error } = await supabase
    .from('community_price_submissions')
    .insert({
      card_printing_id: data.card_printing_id,
      user_id: userId,
      suggested_price: data.suggested_price,
      currency_id: data.currency_id,
      evidence_url: data.evidence_url ?? null,
      status: 'PENDING',
    })
    .select('submission_id, card_printing_id, suggested_price, currency_id, status, created_at')
    .single();

  if (error || !submission) throw new AppError('INTERNAL_ERROR', 'Error al enviar precio');

  return submission;
}

/**
 * Get community price submissions for a card printing
 */
export async function getSubmissionsForPrinting(
  supabase: Client,
  cardPrintingId: string,
  currentUserId?: string,
) {
  // Get submissions with vote counts
  const { data: submissions, error } = await supabase
    .from('community_price_submissions')
    .select(
      `
      submission_id,
      card_printing_id,
      user_id,
      suggested_price,
      currency_id,
      evidence_url,
      status,
      created_at
    `,
    )
    .eq('card_printing_id', cardPrintingId)
    .order('created_at', { ascending: false });

  if (error) throw new AppError('INTERNAL_ERROR', 'Error al cargar precios');

  // For each submission, get vote counts and user's vote
  const enrichedSubmissions = await Promise.all(
    (submissions || []).map(async (sub) => {
      // Count upvotes and downvotes
      const { data: votes } = await supabase
        .from('community_price_votes')
        .select('is_upvote')
        .eq('submission_id', sub.submission_id);

      const upvotes = votes?.filter((v) => v.is_upvote).length ?? 0;
      const downvotes = votes?.filter((v) => !v.is_upvote).length ?? 0;

      // Get current user's vote if authenticated
      let userVote: boolean | null = null;
      if (currentUserId) {
        const { data: userVoteData } = await supabase
          .from('community_price_votes')
          .select('is_upvote')
          .eq('submission_id', sub.submission_id)
          .eq('user_id', currentUserId)
          .maybeSingle();

        if (userVoteData) {
          userVote = userVoteData.is_upvote;
        }
      }

      return {
        ...sub,
        upvotes,
        downvotes,
        user_vote: userVote,
      };
    }),
  );

  return enrichedSubmissions;
}

/**
 * Vote on a price submission
 */
export async function voteOnSubmission(supabase: Client, userId: string, data: VotePrice) {
  // Check if user already voted
  const { data: existing } = await supabase
    .from('community_price_votes')
    .select('vote_id, is_upvote')
    .eq('submission_id', data.submission_id)
    .eq('user_id', userId)
    .single();

  if (existing) {
    // If same vote, remove it (toggle off)
    if (existing.is_upvote === data.is_upvote) {
      const { error: deleteError } = await supabase
        .from('community_price_votes')
        .delete()
        .eq('vote_id', existing.vote_id);

      if (deleteError) throw new AppError('INTERNAL_ERROR', 'Error al quitar voto');

      return { action: 'removed' };
    } else {
      // Different vote, delete old and create new (votes table doesn't allow updates)
      const { error: deleteError } = await supabase
        .from('community_price_votes')
        .delete()
        .eq('vote_id', existing.vote_id);

      if (deleteError) throw new AppError('INTERNAL_ERROR', 'Error al quitar voto anterior');

      const { error: insertError } = await supabase.from('community_price_votes').insert({
        submission_id: data.submission_id,
        user_id: userId,
        is_upvote: data.is_upvote,
      });

      if (insertError) throw new AppError('INTERNAL_ERROR', 'Error al registrar nuevo voto');

      return { action: 'updated' };
    }
  }

  // No existing vote, create new
  const { error } = await supabase.from('community_price_votes').insert({
    submission_id: data.submission_id,
    user_id: userId,
    is_upvote: data.is_upvote,
  });

  if (error) throw new AppError('INTERNAL_ERROR', 'Error al votar');

  return { action: 'created' };
}

/**
 * Get price statistics for a card printing
 */
export async function getPriceStats(supabase: Client, cardPrintingId: string) {
  // Get approved submissions
  const { data: submissions } = await supabase
    .from('community_price_submissions')
    .select('suggested_price, created_at')
    .eq('card_printing_id', cardPrintingId)
    .eq('status', 'APPROVED')
    .order('created_at', { ascending: false });

  if (!submissions || submissions.length === 0) {
    return null;
  }

  const prices = submissions.map((s) => s.suggested_price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;

  // Get consensus if available
  const { data: consensus } = await supabase
    .from('card_price_consensus')
    .select('consensus_price, computed_at')
    .eq('card_printing_id', cardPrintingId)
    .order('computed_at', { ascending: false })
    .limit(1)
    .single();

  // Get default currency (USD for now)
  const { data: currency } = await supabase
    .from('currencies')
    .select('currency_id, code')
    .eq('code', 'USD')
    .single();

  return {
    card_printing_id: cardPrintingId,
    consensus_price: consensus?.consensus_price ?? null,
    min_price: minPrice,
    max_price: maxPrice,
    avg_price: avgPrice,
    last_updated: submissions[0]?.created_at ?? null,
    submission_count: submissions.length,
    currency_code: currency?.code ?? 'USD',
  };
}

/**
 * Get price history for a card printing
 */
export async function getPriceHistory(supabase: Client, cardPrintingId: string) {
  const { data, error } = await supabase
    .from('card_prices')
    .select('price, captured_at, price_source_id')
    .eq('card_printing_id', cardPrintingId)
    .order('captured_at', { ascending: false })
    .limit(100);

  if (error) throw new AppError('INTERNAL_ERROR', 'Error al cargar histórico');

  // Get price sources separately to avoid type issues
  const priceSourceIds = [...new Set(data?.map((p) => p.price_source_id) ?? [])];
  const { data: sources } = await supabase
    .from('price_sources')
    .select('price_source_id, name')
    .in('price_source_id', priceSourceIds);

  const sourcesMap = new Map(sources?.map((s) => [s.price_source_id, s.name]) ?? []);

  return (
    data?.map((item) => ({
      price: item.price,
      captured_at: item.captured_at,
      source_name: sourcesMap.get(item.price_source_id) ?? 'Unknown',
    })) ?? []
  );
}

export interface ConsensusPriceItem {
  card_printing_id: string;
  consensus_price: number;
  currency_code: string;
  currency_symbol: string;
  computed_at: string;
}

/**
 * Bulk: latest consensus prices for many printings.
 *
 * Notes:
 * - Returns the latest row (by computed_at desc) per card_printing_id.
 * - If the consensus table is not available (schema mismatch), returns [].
 */
export async function getConsensusPricesForPrintings(
  supabase: Client,
  cardPrintingIds: string[],
): Promise<ConsensusPriceItem[]> {
  const ids = Array.from(new Set(cardPrintingIds)).filter(Boolean);
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from('card_price_consensus')
    .select('card_printing_id, consensus_price, currency_id, computed_at')
    .in('card_printing_id', ids)
    .order('computed_at', { ascending: false });

  if (error) {
    // Missing relation/table in some environments
    if (error.code === '42P01') return [];
    throw new AppError('INTERNAL_ERROR', 'Error al cargar precios');
  }

  const latestByPrinting = new Map<
    string,
    { card_printing_id: string; consensus_price: number; currency_id: string; computed_at: string }
  >();

  for (const row of data ?? []) {
    if (!latestByPrinting.has(row.card_printing_id)) {
      latestByPrinting.set(row.card_printing_id, {
        card_printing_id: row.card_printing_id,
        consensus_price: Number(row.consensus_price),
        currency_id: row.currency_id,
        computed_at: row.computed_at,
      });
    }
  }

  const currencyIds = Array.from(
    new Set(Array.from(latestByPrinting.values()).map((r) => r.currency_id).filter(Boolean)),
  );

  const { data: currencies } = await supabase
    .from('currencies')
    .select('currency_id, code, symbol')
    .in('currency_id', currencyIds);

  const currencyMap = new Map(
    (currencies ?? []).map((c) => [c.currency_id, { code: c.code, symbol: c.symbol }]),
  );

  return Array.from(latestByPrinting.values()).map((row) => {
    const currency = currencyMap.get(row.currency_id);
    return {
      card_printing_id: row.card_printing_id,
      consensus_price: row.consensus_price,
      currency_code: currency?.code ?? 'USD',
      currency_symbol: currency?.symbol ?? '$',
      computed_at: row.computed_at,
    };
  });
}
