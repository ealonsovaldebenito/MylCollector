'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useVotePrice } from '@/hooks/use-prices';
import type { CommunityPriceSubmission } from '@myl/shared';
import { ThumbsUp, ThumbsDown, ExternalLink } from 'lucide-react';

interface PriceSubmissionListProps {
  submissions: CommunityPriceSubmission[];
  isLoading: boolean;
  currencyCode?: string;
  isAuthenticated?: boolean;
  onVoteSuccess?: () => void;
}

export function PriceSubmissionList({
  submissions,
  isLoading,
  currencyCode = 'USD',
  isAuthenticated = false,
  onVoteSuccess,
}: PriceSubmissionListProps) {
  const { vote, isVoting } = useVotePrice(onVoteSuccess);
  const [votingSubmissionId, setVotingSubmissionId] = useState<string | null>(null);

  const handleVote = async (submissionId: string, isUpvote: boolean) => {
    if (!isAuthenticated) {
      // TODO: Show login dialog
      return;
    }

    setVotingSubmissionId(submissionId);
    try {
      await vote({ submission_id: submissionId, is_upvote: isUpvote });
    } catch {
      // Error handled by hook
    } finally {
      setVotingSubmissionId(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Precios comunitarios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (submissions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Precios comunitarios</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No hay precios enviados aún. ¡Sé el primero en compartir un precio!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Precios comunitarios ({submissions.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {submissions.map((submission) => {
          const isVotingThis = votingSubmissionId === submission.submission_id;
          const upvotes = submission.upvotes ?? 0;
          const downvotes = submission.downvotes ?? 0;
          const score = upvotes - downvotes;
          const userVote = submission.user_vote;

          return (
            <div
              key={submission.submission_id}
              className="flex items-center justify-between gap-4 rounded-lg border p-4"
            >
              <div className="flex flex-1 items-center gap-4">
                {/* Voting controls */}
                <div className="flex flex-col items-center gap-1">
                  <Button
                    variant={userVote === true ? 'default' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleVote(submission.submission_id, true)}
                    disabled={isVoting || isVotingThis || !isAuthenticated}
                    title={isAuthenticated ? 'Votar positivo' : 'Inicia sesión para votar'}
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </Button>
                  <span
                    className={`text-sm font-medium ${
                      score > 0 ? 'text-green-600' : score < 0 ? 'text-red-600' : 'text-muted-foreground'
                    }`}
                  >
                    {score > 0 ? '+' : ''}
                    {score}
                  </span>
                  <Button
                    variant={userVote === false ? 'default' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleVote(submission.submission_id, false)}
                    disabled={isVoting || isVotingThis || !isAuthenticated}
                    title={isAuthenticated ? 'Votar negativo' : 'Inicia sesión para votar'}
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </Button>
                </div>

                {/* Price info */}
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">
                      ${submission.suggested_price.toFixed(2)}
                    </span>
                    <span className="text-sm text-muted-foreground">{currencyCode}</span>
                    {submission.status === 'APPROVED' && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Verificado
                      </Badge>
                    )}
                    {submission.status === 'REJECTED' && (
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        Rechazado
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{new Date(submission.created_at).toLocaleDateString('es-ES')}</span>
                    {submission.evidence_url && (
                      <>
                        <span>•</span>
                        <a
                          href={submission.evidence_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-primary"
                        >
                          Ver evidencia
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
