export { apiErrorSchema, apiSuccessSchema, paginatedSchema } from './api-response.js';
export { paginationQuerySchema, type PaginationQuery } from './pagination.js';
export { uuidSchema, shareCodeSchema, visibilitySchema, type Visibility } from './common.js';

// Auth
export {
  loginSchema,
  signupSchema,
  resetPasswordSchema,
  updatePasswordSchema,
  updateProfileSchema,
  userProfileSchema,
  type Login,
  type Signup,
  type ResetPassword,
  type UpdatePassword,
  type UpdateProfile,
  type UserProfile,
} from './auth.js';

// Catalog
export {
  blockSchema,
  editionSchema,
  editionWithBlockSchema,
  cardTypeSchema,
  raceSchema,
  rarityTierSchema,
  tagSchema,
  cardConditionRefSchema,
  type Block,
  type Edition,
  type EditionWithBlock,
  type CardType,
  type Race,
  type RarityTier,
  type Tag,
  type CardConditionRef,
} from './catalog.js';

// Cards
export {
  legalStatusSchema,
  cardBaseSchema,
  cardWithRelationsSchema,
  cardPrintingSchema,
  cardPrintingWithRelationsSchema,
  cardDetailSchema,
  type LegalStatus,
  type Card,
  type CardWithRelations,
  type CardPrinting,
  type CardPrintingWithRelations,
  type CardDetail,
} from './card.js';

// Card filters
export { cardFiltersSchema, type CardFilters } from './card-filters.js';

// Card mutations
export {
  createCardSchema,
  updateCardSchema,
  createCardPrintingSchema,
  updateCardPrintingSchema,
  type CreateCard,
  type UpdateCard,
  type CreateCardPrinting,
  type UpdateCardPrinting,
} from './card-mutations.js';

// CSV import/export
export {
  cardCsvRowSchema,
  csvImportResultSchema,
  csvImportErrorSchema,
  CARD_CSV_HEADERS,
  type CardCsvRow,
  type CsvImportResult,
  type CsvImportError,
} from './card-csv.js';

// Prices
export {
  priceConsensusSchema,
  cardPriceHistorySchema,
  communityPriceSubmissionSchema,
  submitPriceSchema,
  votePriceSchema,
  priceStatsSchema,
  type PriceConsensus,
  type CardPriceHistory,
  type CommunityPriceSubmission,
  type SubmitPrice,
  type VotePrice,
  type PriceStats,
} from './price.js';

// Formats
export {
  formatParamsSchema,
  formatSchema,
  formatRuleSchema,
  type FormatParams,
  type Format,
  type FormatRule,
} from './format.js';

// Decks
export {
  deckSchema,
  deckVersionSchema,
  deckVersionCardSchema,
  type Deck,
  type DeckVersion,
  type DeckVersionCard,
} from './deck.js';

// Deck mutations
export {
  createDeckSchema,
  updateDeckSchema,
  deckVersionCardInputSchema,
  createDeckVersionSchema,
  liveValidateSchema,
  type CreateDeck,
  type UpdateDeck,
  type DeckVersionCardInput,
  type CreateDeckVersion,
  type LiveValidateInput,
} from './deck-mutations.js';

// Validation
export {
  validationSeveritySchema,
  validationMessageSchema,
  deckComputedStatsSchema,
  validationResultSchema,
  type ValidationSeverity,
  type ValidationMessage,
  type DeckComputedStats,
  type ValidationResult,
} from './validation.js';

// Export/Import
export {
  exportFormatSchema,
  exportRequestSchema,
  importFormatSchema,
  importRequestSchema,
  importResolvedCardSchema,
  importCardOptionSchema,
  importAmbiguousLineSchema,
  importResolvedResultSchema,
  importAmbiguousResultSchema,
  importResultSchema,
  importResolutionSchema,
  type ExportFormat,
  type ExportRequest,
  type ImportFormat,
  type ImportRequest,
  type ImportResolvedCard,
  type ImportCardOption,
  type ImportAmbiguousLine,
  type ImportResolvedResult,
  type ImportAmbiguousResult,
  type ImportResult,
  type ImportResolution,
} from './export-import.js';

// Stores
export {
  scraperTypeSchema,
  storeSchema,
  createStoreSchema,
  updateStoreSchema,
  storePrintingLinkSchema,
  createStorePrintingLinkSchema,
  updateStorePrintingLinkSchema,
  type ScraperType,
  type Store,
  type CreateStore,
  type UpdateStore,
  type StorePrintingLink,
  type CreateStorePrintingLink,
  type UpdateStorePrintingLink,
} from './store.js';

// Scraping
export {
  scrapeJobStatusSchema,
  scrapeTriggeredBySchema,
  scrapeJobSchema,
  scrapeJobItemSchema,
  triggerScrapeSchema,
  type ScrapeJobStatus,
  type ScrapeTriggeredBy,
  type ScrapeJob,
  type ScrapeJobItem,
  type TriggerScrape,
} from './scraping.js';

// Ban lists
export {
  banListChangeTypeSchema,
  banListRevisionSchema,
  banListEntrySchema,
  banListEntryInputSchema,
  createBanListRevisionSchema,
  upsertFormatCardLimitSchema,
  formatCardLimitSchema,
  type BanListChangeType,
  type BanListRevision,
  type BanListEntry,
  type BanListEntryInput,
  type CreateBanListRevision,
  type UpsertFormatCardLimit,
  type FormatCardLimit,
} from './banlist.js';

// Oracles & Strategy
export {
  abilityTypeSchema,
  strategySectionTypeSchema,
  cardOracleSchema,
  createCardOracleSchema,
  updateCardOracleSchema,
  deckStrategySectionSchema,
  createDeckStrategySectionSchema,
  updateDeckStrategySectionSchema,
  deckStrategyCardRefSchema,
  type OracleAbilityType,
  type StrategySectionType,
  type CardOracle,
  type CreateCardOracle,
  type UpdateCardOracle,
  type DeckStrategySection,
  type CreateDeckStrategySection,
  type UpdateDeckStrategySection,
  type DeckStrategyCardRef,
} from './oracle.js';

// Community
export {
  createCommentSchema,
  updateCommentSchema,
  publicDeckSortSchema,
  publicDeckFiltersSchema,
  publicDeckListItemSchema,
  deckCommentSchema,
  userPublicProfileSchema,
  trendingDecksResponseSchema,
  type CreateComment,
  type UpdateComment,
  type PublicDeckSort,
  type PublicDeckFilters,
  type PublicDeckListItem,
  type DeckComment,
  type UserPublicProfile,
  type TrendingDecksResponse,
  type TopBuilder,
} from './community.js';

// Collection
export {
  cardConditionSchema,
  userCardSchema,
  userCardWithRelationsSchema,
  collectionStatsSchema,
  missingCardSchema,
  blockCompletionSchema,
  editionCompletionSchema,
  addToCollectionSchema,
  updateCollectionItemSchema,
  bulkCollectionUpdateSchema,
  collectionFiltersSchema,
  collectionCsvLineSchema,
  collectionImportResultSchema,
  type CardCondition,
  type UserCard,
  type UserCardWithRelations,
  type CollectionStats,
  type MissingCard,
  type BlockCompletion,
  type EditionCompletion,
  type AddToCollection,
  type UpdateCollectionItem,
  type BulkCollectionUpdate,
  type CollectionFilters,
  type CollectionCsvLine,
  type CollectionImportResult,
  userCollectionSchema,
  createCollectionSchema,
  updateCollectionSchema,
  moveCardsSchema,
  type UserCollection,
  type CreateCollection,
  type UpdateCollection,
  type MoveCards,
} from './collection.js';
