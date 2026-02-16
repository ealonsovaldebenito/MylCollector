/**
 * Tipos manuales de la base de datos — reflejan las migraciones SQL.
 * Se reemplazaran por tipos auto-generados cuando se conecte Supabase CLI.
 *
 * Doc reference: 03_DATA_MODEL_SQL.md, 00_GLOSSARY_AND_IDS.md
 */

type LegalStatusType = 'LEGAL' | 'RESTRICTED' | 'BANNED' | 'DISCONTINUED';
type ValidationSeverity = 'BLOCK' | 'WARN' | 'INFO';
type VisibilityLevel = 'PRIVATE' | 'UNLISTED' | 'PUBLIC';
type SubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Database {
  public: {
    Tables: {
      blocks: {
        Row: {
          block_id: string;
          name: string;
          code: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          block_id?: string;
          name: string;
          code: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          code?: string;
          sort_order?: number;
        };
        Relationships: [];
      };

      editions: {
        Row: {
          edition_id: string;
          block_id: string;
          name: string;
          code: string;
          release_date: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          edition_id?: string;
          block_id: string;
          name: string;
          code: string;
          release_date?: string | null;
          sort_order?: number;
        };
        Update: {
          block_id?: string;
          name?: string;
          code?: string;
          release_date?: string | null;
          sort_order?: number;
        };
        Relationships: [];
      };

      card_types: {
        Row: {
          card_type_id: string;
          name: string;
          code: string;
          sort_order: number;
        };
        Insert: {
          card_type_id?: string;
          name: string;
          code: string;
          sort_order?: number;
        };
        Update: {
          name?: string;
          code?: string;
          sort_order?: number;
        };
        Relationships: [];
      };

      races: {
        Row: {
          race_id: string;
          name: string;
          code: string;
          sort_order: number;
        };
        Insert: {
          race_id?: string;
          name: string;
          code: string;
          sort_order?: number;
        };
        Update: {
          name?: string;
          code?: string;
          sort_order?: number;
        };
        Relationships: [];
      };

      rarity_tiers: {
        Row: {
          rarity_tier_id: string;
          name: string;
          code: string;
          sort_order: number;
        };
        Insert: {
          rarity_tier_id?: string;
          name: string;
          code: string;
          sort_order?: number;
        };
        Update: {
          name?: string;
          code?: string;
          sort_order?: number;
        };
        Relationships: [];
      };

      cards: {
        Row: {
          card_id: string;
          name: string;
          name_normalized: string;
          card_type_id: string;
          race_id: string | null;
          ally_strength: number | null;
          cost: number | null;
          is_unique: boolean;
          has_ability: boolean;
          can_be_starting_gold: boolean;
          text: string | null;
          flavor_text: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          card_id?: string;
          name: string;
          name_normalized: string;
          card_type_id: string;
          race_id?: string | null;
          ally_strength?: number | null;
          cost?: number | null;
          is_unique?: boolean;
          has_ability?: boolean;
          can_be_starting_gold?: boolean;
          text?: string | null;
          flavor_text?: string | null;
        };
        Update: {
          name?: string;
          name_normalized?: string;
          card_type_id?: string;
          race_id?: string | null;
          ally_strength?: number | null;
          cost?: number | null;
          is_unique?: boolean;
          has_ability?: boolean;
          can_be_starting_gold?: boolean;
          text?: string | null;
          flavor_text?: string | null;
        };
        Relationships: [];
      };

      card_printings: {
        Row: {
          card_printing_id: string;
          card_id: string;
          edition_id: string;
          rarity_tier_id: string | null;
          rarity_era_id: string | null;
          language_id: string | null;
          finish_id: string | null;
          printing_variant: string;
          collector_number: string | null;
          image_url: string | null;
          illustrator: string | null;
          legal_status: LegalStatusType;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          card_printing_id?: string;
          card_id: string;
          edition_id: string;
          rarity_tier_id?: string | null;
          rarity_era_id?: string | null;
          language_id?: string | null;
          finish_id?: string | null;
          printing_variant?: string;
          collector_number?: string | null;
          image_url?: string | null;
          illustrator?: string | null;
          legal_status?: LegalStatusType;
        };
        Update: {
          card_id?: string;
          edition_id?: string;
          rarity_tier_id?: string | null;
          rarity_era_id?: string | null;
          language_id?: string | null;
          finish_id?: string | null;
          printing_variant?: string;
          collector_number?: string | null;
          image_url?: string | null;
          illustrator?: string | null;
          legal_status?: LegalStatusType;
        };
        Relationships: [];
      };

      tags: {
        Row: {
          tag_id: string;
          name: string;
          slug: string;
          created_at: string;
        };
        Insert: {
          tag_id?: string;
          name: string;
          slug: string;
        };
        Update: {
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };

      card_tags: {
        Row: {
          card_id: string;
          tag_id: string;
        };
        Insert: {
          card_id: string;
          tag_id: string;
        };
        Update: {
          card_id?: string;
          tag_id?: string;
        };
        Relationships: [];
      };

      price_sources: {
        Row: {
          price_source_id: string;
          store_id: string | null;
          name: string;
          url: string | null;
          source_type: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          price_source_id?: string;
          store_id?: string | null;
          name: string;
          url?: string | null;
          source_type?: string;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          url?: string | null;
          is_active?: boolean;
        };
        Relationships: [];
      };

      card_prices: {
        Row: {
          card_price_id: string;
          card_printing_id: string;
          price_source_id: string;
          price: number;
          currency_id: string;
          captured_at: string;
        };
        Insert: {
          card_price_id?: string;
          card_printing_id: string;
          price_source_id: string;
          price: number;
          currency_id: string;
          captured_at?: string;
        };
        Update: {
          price?: number;
          currency_id?: string;
        };
        Relationships: [];
      };

      card_price_consensus: {
        Row: {
          consensus_id: string;
          card_printing_id: string;
          consensus_price: number;
          currency_id: string;
          source_breakdown: Record<string, unknown>;
          computed_at: string;
          valid_until: string | null;
        };
        Insert: {
          consensus_id?: string;
          card_printing_id: string;
          consensus_price: number;
          currency_id: string;
          source_breakdown?: Record<string, unknown>;
          computed_at?: string;
          valid_until?: string | null;
        };
        Update: {
          consensus_price?: number;
          currency_id?: string;
          source_breakdown?: Record<string, unknown>;
          valid_until?: string | null;
        };
        Relationships: [];
      };

      community_price_submissions: {
        Row: {
          submission_id: string;
          card_printing_id: string;
          user_id: string;
          suggested_price: number;
          currency_id: string;
          evidence_url: string | null;
          status: SubmissionStatus;
          created_at: string;
        };
        Insert: {
          submission_id?: string;
          card_printing_id: string;
          user_id: string;
          suggested_price: number;
          currency_id: string;
          evidence_url?: string | null;
          status?: SubmissionStatus;
        };
        Update: {
          status?: SubmissionStatus;
        };
        Relationships: [];
      };

      community_price_votes: {
        Row: {
          vote_id: string;
          submission_id: string;
          user_id: string;
          is_upvote: boolean;
          created_at: string;
        };
        Insert: {
          vote_id?: string;
          submission_id: string;
          user_id: string;
          is_upvote: boolean;
        };
        Update: Record<string, never>;
        Relationships: [];
      };

      currencies: {
        Row: {
          currency_id: string;
          code: string;
          name: string;
          symbol: string;
        };
        Insert: {
          currency_id?: string;
          code: string;
          name: string;
          symbol: string;
        };
        Update: {
          code?: string;
          name?: string;
          symbol?: string;
        };
        Relationships: [];
      };

      users: {
        Row: {
          user_id: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          display_name?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          display_name?: string | null;
          avatar_url?: string | null;
        };
        Relationships: [];
      };

      roles: {
        Row: {
          role_id: string;
          name: string;
          description: string | null;
        };
        Insert: {
          role_id?: string;
          name: string;
          description?: string | null;
        };
        Update: {
          name?: string;
          description?: string | null;
        };
        Relationships: [];
      };

      user_roles: {
        Row: {
          user_id: string;
          role_id: string;
          granted_at: string;
          granted_by: string | null;
        };
        Insert: {
          user_id: string;
          role_id: string;
          granted_by?: string | null;
        };
        Update: {
          granted_by?: string | null;
        };
        Relationships: [];
      };

      user_profiles: {
        Row: {
          user_id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          role: 'user' | 'admin';
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          role?: 'user' | 'admin';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          role?: 'user' | 'admin';
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };

      formats: {
        Row: {
          format_id: string;
          name: string;
          code: string;
          description: string | null;
          is_active: boolean;
          params_json: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          format_id?: string;
          name: string;
          code: string;
          description?: string | null;
          is_active?: boolean;
          params_json?: Record<string, unknown>;
        };
        Update: {
          name?: string;
          code?: string;
          description?: string | null;
          is_active?: boolean;
          params_json?: Record<string, unknown>;
        };
        Relationships: [];
      };

      format_rules: {
        Row: {
          format_rule_id: string;
          format_id: string;
          rule_id: string;
          params_json: Record<string, unknown>;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          format_rule_id?: string;
          format_id: string;
          rule_id: string;
          params_json?: Record<string, unknown>;
          is_active?: boolean;
        };
        Update: {
          rule_id?: string;
          params_json?: Record<string, unknown>;
          is_active?: boolean;
        };
        Relationships: [];
      };

      format_allowed_blocks: {
        Row: { format_id: string; block_id: string };
        Insert: { format_id: string; block_id: string };
        Update: Record<string, never>;
        Relationships: [];
      };

      format_allowed_editions: {
        Row: { format_id: string; edition_id: string };
        Insert: { format_id: string; edition_id: string };
        Update: Record<string, never>;
        Relationships: [];
      };

      format_allowed_card_types: {
        Row: { format_id: string; card_type_id: string };
        Insert: { format_id: string; card_type_id: string };
        Update: Record<string, never>;
        Relationships: [];
      };

      format_allowed_races: {
        Row: { format_id: string; race_id: string };
        Insert: { format_id: string; race_id: string };
        Update: Record<string, never>;
        Relationships: [];
      };

      format_card_limits: {
        Row: {
          format_card_limit_id: string;
          format_id: string;
          card_id: string;
          max_qty: number;
          created_at: string;
        };
        Insert: {
          format_card_limit_id?: string;
          format_id: string;
          card_id: string;
          max_qty: number;
        };
        Update: {
          max_qty?: number;
        };
        Relationships: [];
      };

      decks: {
        Row: {
          deck_id: string;
          user_id: string;
          format_id: string;
          edition_id: string | null;
          race_id: string | null;
          name: string;
          description: string | null;
          visibility: VisibilityLevel;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          deck_id?: string;
          user_id: string;
          format_id: string;
          edition_id?: string | null;
          race_id?: string | null;
          name: string;
          description?: string | null;
          visibility?: VisibilityLevel;
        };
        Update: {
          format_id?: string;
          edition_id?: string | null;
          race_id?: string | null;
          name?: string;
          description?: string | null;
          visibility?: VisibilityLevel;
        };
        Relationships: [];
      };

      deck_versions: {
        Row: {
          deck_version_id: string;
          deck_id: string;
          version_number: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          deck_version_id?: string;
          deck_id: string;
          version_number: number;
          notes?: string | null;
        };
        Update: {
          notes?: string | null;
        };
        Relationships: [];
      };

      deck_version_cards: {
        Row: {
          deck_version_card_id: string;
          deck_version_id: string;
          card_printing_id: string;
          qty: number;
          is_starting_gold: boolean;
          created_at: string;
        };
        Insert: {
          deck_version_card_id?: string;
          deck_version_id: string;
          card_printing_id: string;
          qty: number;
          is_starting_gold?: boolean;
        };
        Update: {
          qty?: number;
          is_starting_gold?: boolean;
        };
        Relationships: [];
      };

      deck_validation_runs: {
        Row: {
          validation_run_id: string;
          deck_version_id: string;
          format_id: string;
          is_valid: boolean;
          duration_ms: number | null;
          computed_stats: Record<string, unknown> | null;
          request_id: string | null;
          created_at: string;
        };
        Insert: {
          validation_run_id?: string;
          deck_version_id: string;
          format_id: string;
          is_valid: boolean;
          duration_ms?: number | null;
          computed_stats?: Record<string, unknown> | null;
          request_id?: string | null;
        };
        Update: Record<string, never>;
        Relationships: [];
      };

      deck_validation_messages: {
        Row: {
          validation_message_id: string;
          validation_run_id: string;
          rule_id: string;
          rule_version: number;
          severity: ValidationSeverity;
          message: string;
          hint: string | null;
          entity_ref: Record<string, unknown> | null;
          context_json: Record<string, unknown> | null;
          sort_order: number;
        };
        Insert: {
          validation_message_id?: string;
          validation_run_id: string;
          rule_id: string;
          rule_version?: number;
          severity: ValidationSeverity;
          message: string;
          hint?: string | null;
          entity_ref?: Record<string, unknown> | null;
          context_json?: Record<string, unknown> | null;
          sort_order?: number;
        };
        Update: Record<string, never>;
        Relationships: [];
      };

      deck_stats_snapshots: {
        Row: {
          snapshot_id: string;
          deck_version_id: string;
          stats_json: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          snapshot_id?: string;
          deck_version_id: string;
          stats_json?: Record<string, unknown>;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
    };

    Views: Record<string, never>;

    Functions: Record<string, never>;

    Enums: {
      legal_status_type: LegalStatusType;
      validation_severity: ValidationSeverity;
      visibility_level: VisibilityLevel;
      submission_status: SubmissionStatus;
    };

    CompositeTypes: Record<string, never>;
  };
}
