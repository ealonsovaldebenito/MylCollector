'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PriceSubmissionForm } from './price-submission-form';
import { PriceSubmissionList } from './price-submission-list';
import { PriceStatsCard } from './price-stats-card';
import { StorePricesList } from './store-prices-list';
import { usePriceSubmissions } from '@/hooks/use-prices';
import { DollarSign } from 'lucide-react';

interface PriceSectionProps {
  cardPrintingId: string;
  isAuthenticated?: boolean;
  defaultCurrencyId: string; // UUID of default currency (USD)
}

export function PriceSection({ cardPrintingId, isAuthenticated = false, defaultCurrencyId }: PriceSectionProps) {
  const { submissions, stats, isLoading, refetch } = usePriceSubmissions(cardPrintingId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSubmitSuccess = () => {
    setIsDialogOpen(false);
    refetch();
  };

  const handleVoteSuccess = () => {
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Header with submit button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Precios</h2>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!isAuthenticated}>
              {isAuthenticated ? 'Enviar precio' : 'Inicia sesión para enviar'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Enviar precio</DialogTitle>
              <DialogDescription>
                Comparte el precio actual que encontraste para esta carta
              </DialogDescription>
            </DialogHeader>
            <PriceSubmissionForm
              cardPrintingId={cardPrintingId}
              currencyId={defaultCurrencyId}
              onSuccess={handleSubmitSuccess}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Store prices (always visible above tabs) */}
      <StorePricesList cardPrintingId={cardPrintingId} />

      {/* Content with tabs */}
      <Tabs defaultValue="community" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="community">Precios comunitarios</TabsTrigger>
          <TabsTrigger value="stats">Estadísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="community" className="mt-6">
          <PriceSubmissionList
            submissions={submissions}
            isLoading={isLoading}
            currencyCode={stats?.currency_code}
            isAuthenticated={isAuthenticated}
            onVoteSuccess={handleVoteSuccess}
          />
        </TabsContent>

        <TabsContent value="stats" className="mt-6">
          <PriceStatsCard stats={stats} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
