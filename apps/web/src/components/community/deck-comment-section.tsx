/**
 * DeckCommentSection — Sección de comentarios con input + lista threaded.
 *
 * Changelog:
 *   2026-02-18 — Creación inicial
 */

'use client';

import { useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DeckCommentItem } from './deck-comment-item';
import { useDeckComments } from '@/hooks/use-deck-comments';
import { useUser } from '@/contexts/user-context';
import { Skeleton } from '@/components/ui/skeleton';

export function DeckCommentSection({ deckId }: { deckId: string }) {
  const { user } = useUser();
  const { comments, isLoading, postComment, editComment, deleteComment, isPosting } =
    useDeckComments(deckId);
  const [newComment, setNewComment] = useState('');

  const handlePost = async () => {
    if (!newComment.trim()) return;
    await postComment({ content: newComment.trim() });
    setNewComment('');
  };

  const handleReply = async (parentId: string, content: string) => {
    await postComment({ content, parent_id: parentId });
  };

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 font-display text-lg font-bold">
        <MessageCircle className="h-5 w-5 text-accent" />
        Comentarios ({comments.length})
      </h3>

      {/* New comment input */}
      {user ? (
        <div className="flex gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
            {(user.user_metadata?.display_name || user.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 space-y-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Escribe un comentario..."
              className="min-h-[60px] text-sm resize-none"
              maxLength={2000}
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handlePost}
                disabled={!newComment.trim() || isPosting}
              >
                <Send className="h-3.5 w-3.5 mr-1.5" />
                {isPosting ? 'Enviando...' : 'Comentar'}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Inicia sesión para comentar.
        </p>
      )}

      {/* Comments list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
          <MessageCircle className="h-8 w-8 opacity-30" />
          <p className="text-sm">Sé el primero en comentar</p>
        </div>
      ) : (
        <div className="divide-y divide-border/30">
          {comments.map((comment) => (
            <DeckCommentItem
              key={comment.comment_id}
              comment={comment}
              currentUserId={user?.id}
              onEdit={editComment}
              onDelete={deleteComment}
              onReply={handleReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}
