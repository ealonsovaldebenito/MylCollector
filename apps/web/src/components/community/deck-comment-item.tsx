/**
 * DeckCommentItem — Comentario individual con avatar, acciones.
 *
 * Changelog:
 *   2026-02-18 — Creación inicial
 */

'use client';

import { useState } from 'react';
import { Pencil, Trash2, Reply, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { DeckComment } from '@myl/shared';

interface Props {
  comment: DeckComment;
  currentUserId?: string;
  onEdit: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onReply: (parentId: string, content: string) => Promise<void>;
  depth?: number;
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return days < 30 ? `hace ${days}d` : new Date(dateStr).toLocaleDateString('es-CL');
}

export function DeckCommentItem({ comment, currentUserId, onEdit, onDelete, onReply, depth = 0 }: Props) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState('');

  const isOwn = currentUserId === comment.user_id;

  const handleSaveEdit = async () => {
    if (!editText.trim()) return;
    await onEdit(comment.comment_id, editText.trim());
    setEditing(false);
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    await onReply(comment.comment_id, replyText.trim());
    setReplying(false);
    setReplyText('');
  };

  return (
    <div className={`animate-fade-in ${depth > 0 ? 'ml-8 border-l-2 border-border/30 pl-4' : ''}`}>
      <div className="group flex gap-3 py-2">
        {/* Avatar */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
          {(comment.display_name || 'U').charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-foreground">
              {comment.display_name || 'Usuario'}
            </span>
            <span className="text-muted-foreground">
              {relativeTime(comment.created_at)}
            </span>
            {comment.updated_at !== comment.created_at && !comment.is_deleted && (
              <span className="text-muted-foreground/60">(editado)</span>
            )}
          </div>

          {/* Content */}
          {editing ? (
            <div className="mt-1 space-y-2">
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="min-h-[60px] text-sm"
                maxLength={2000}
              />
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                  <X className="h-3 w-3 mr-1" /> Cancelar
                </Button>
                <Button size="sm" onClick={handleSaveEdit}>
                  <Check className="h-3 w-3 mr-1" /> Guardar
                </Button>
              </div>
            </div>
          ) : (
            <p className={`mt-1 text-sm ${comment.is_deleted ? 'italic text-muted-foreground' : ''}`}>
              {comment.content}
            </p>
          )}

          {/* Actions */}
          {!comment.is_deleted && !editing && (
            <div className="mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {currentUserId && depth === 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground"
                  onClick={() => setReplying(!replying)}
                >
                  <Reply className="h-3 w-3 mr-1" /> Responder
                </Button>
              )}
              {isOwn && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-muted-foreground"
                    onClick={() => { setEditing(true); setEditText(comment.content); }}
                  >
                    <Pencil className="h-3 w-3 mr-1" /> Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-destructive"
                    onClick={() => onDelete(comment.comment_id)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" /> Eliminar
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Reply input */}
          {replying && (
            <div className="mt-2 space-y-2 animate-slide-up">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Escribe una respuesta..."
                className="min-h-[50px] text-sm"
                maxLength={2000}
              />
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setReplying(false)}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleSendReply} disabled={!replyText.trim()}>
                  Responder
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {comment.replies?.map((reply) => (
        <DeckCommentItem
          key={reply.comment_id}
          comment={reply as DeckComment}
          currentUserId={currentUserId}
          onEdit={onEdit}
          onDelete={onDelete}
          onReply={onReply}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}
