import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Loader2, Sparkles } from "lucide-react";

interface StatisticsData {
  totalFlashcards: number;
  generatedFlashcards: number;
  editedFlashcards: number;
  acceptedFlashcards: number;
  recentGenerations: {
    id: number;
    created_at: string;
    generated_count: number;
    model: string;
    deck_name: string | null;
    deck_id: number | null;
  }[];
}

interface DashboardProps {}

const StatisticCard = ({ title, value, description }: { title: string; value: number; description: string }) => (
  <Card className="gradient-card">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-white/70">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-white">{value}</div>
      <p className="text-xs text-white/60 mt-1">{description}</p>
    </CardContent>
  </Card>
);

const RecentGenerationCard = ({ generation }: { generation: StatisticsData["recentGenerations"][0] }) => {
  const handleCardClick = () => {
    // If deck_id is available, navigate to deck page; otherwise, filter by generation
    if (generation.deck_id) {
      window.location.href = `/deck/${generation.deck_id}`;
    } else {
      window.location.href = `/flashcards?generation=${generation.id}`;
    }
  };

  const displayTitle = generation.deck_name || `Generacja #${generation.id}`;

  return (
    <Card className="gradient-card cursor-pointer transition-all" onClick={handleCardClick}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-white">{displayTitle}</CardTitle>
        <CardDescription className="text-xs text-white/60">
          {new Date(generation.created_at).toLocaleDateString("pl-PL")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-white">{generation.generated_count} fiszek</span>
          <span className="text-xs text-white/70">{generation.model}</span>
        </div>
        <p className="text-xs text-white/60 mt-2">
          {generation.deck_id 
            ? "Kliknij, aby zobaczyć talię" 
            : "Kliknij, aby zobaczyć fiszki"
          }
        </p>
      </CardContent>
    </Card>
  );
};

export const Dashboard: React.FC<DashboardProps> = () => {
  const handleNewGeneration = () => {
    window.location.href = '/generate';
  };
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/dashboard');
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        
        const data = await response.json();
        setStatistics(data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Przegląd Twoich fiszek i ostatnich aktywności</p>
        </div>
        
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Ładowanie danych...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Przegląd Twoich fiszek i ostatnich aktywności</p>
        </div>
        
        <Alert variant="destructive">
          <h3>Błąd podczas ładowania danych</h3>
          <p>{error}</p>
        </Alert>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Szybkie akcje</CardTitle>
            <CardDescription className="text-white/70">Rozpocznij nową sesję generowania fiszek</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleNewGeneration} 
              size="lg" 
              className="shimmer-button bg-gradient-to-r from-[#4a2c73] via-[#804060] to-[#00a570] hover:from-[#3a1c63] hover:via-[#703050] hover:to-[#008560] text-white font-semibold shadow-lg transition-all duration-300 ease-out"
              aria-label="Rozpocznij generowanie nowych fiszek"
            >
              Nowa generacja
              <Sparkles className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!statistics) {
    return null;
  }
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Przegląd Twoich fiszek i ostatnich aktywności</p>
      </div>

      {/* Statistics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatisticCard
          title="Wszystkie fiszki"
          value={statistics.totalFlashcards}
          description="Łączna liczba fiszek"
        />
        <StatisticCard
          title="Wygenerowane"
          value={statistics.generatedFlashcards}
          description="Fiszki utworzone przez AI"
        />
        <StatisticCard
          title="Edytowane"
          value={statistics.editedFlashcards}
          description="AI fiszki z modyfikacjami"
        />
        <StatisticCard
          title="Zaakceptowane"
          value={statistics.acceptedFlashcards}
          description="Z ostatnich generacji"
        />
      </div>

      {/* Action Section */}
      <Card className="gradient-card">
        <CardHeader>
          <CardTitle className="text-white">Szybkie akcje</CardTitle>
          <CardDescription className="text-white/70">Rozpocznij nową sesję generowania fiszek</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleNewGeneration} 
            size="lg" 
            className="shimmer-button bg-gradient-to-r from-[#4a2c73] via-[#804060] to-[#00a570] hover:from-[#3a1c63] hover:via-[#703050] hover:to-[#008560] text-white font-semibold shadow-lg transition-all duration-300 ease-out"
            aria-label="Rozpocznij generowanie nowych fiszek"
          >
            Nowa generacja
            <Sparkles className="ml-2 h-5 w-5" />
          </Button>
        </CardContent>
      </Card>

      {/* Recent Generations */}
      {statistics.recentGenerations.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Ostatnie generacje</h2>
            <p className="text-muted-foreground text-sm">Twoje 3 najnowsze generacje</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {statistics.recentGenerations.map((generation) => (
              <RecentGenerationCard key={generation.id} generation={generation} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
