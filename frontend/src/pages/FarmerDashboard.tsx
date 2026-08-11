import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CloudSun,
  Leaf,
  Map,
  Sprout,
  Tractor,
  TrendingUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const FARM_GALLERY = [
  'https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1524486361537-8ad15938e1a3?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1600&q=80',
];

const PERFORMANCE = [
  { label: 'Soil Health Index', value: 72 },
  { label: 'Irrigation Coverage', value: 58 },
  { label: 'Advisory Compliance', value: 81 },
  { label: 'Season Yield Confidence', value: 67 },
];

const PANEL_ORDER = [
  {
    title: 'My Farm',
    description: 'Manage fields, crops, and farm boundaries.',
    icon: Tractor,
    href: '/my-farm',
    style: 'border-l-4 border-l-primary',
  },
  {
    title: 'Recommendations',
    description: 'View personalized agronomic guidance.',
    icon: Sprout,
    href: '/crop-recommendations',
  },
  {
    title: 'Farm Performance / Percentages',
    description: 'Track farm-level metrics and seasonal performance.',
    icon: BarChart3,
    href: '/crop-monitoring',
  },
  {
    title: 'Warnings and Alerts',
    description: 'Get pest, disease, and climate-risk warnings.',
    icon: AlertTriangle,
    href: '/pest-disease-warnings',
  },
  {
    title: 'Satellite Maps',
    description: 'Inspect crop vigor and field conditions from space.',
    icon: Map,
    href: '/sentinel-map',
  },
  {
    title: 'Weather Information',
    description: 'Check local conditions and short-range forecast.',
    icon: CloudSun,
    href: '/weather-alerts',
  },
  {
    title: 'Market Information and Conditions',
    description: 'Review prices, trends, and market opportunities.',
    icon: TrendingUp,
    href: '/market-prices',
  },
];

export default function FarmerDashboard() {
  const [heroImage, setHeroImage] = useState(FARM_GALLERY[0]);

  useEffect(() => {
    let idx = 0;
    const timer = window.setInterval(() => {
      idx = (idx + 1) % FARM_GALLERY.length;
      setHeroImage(FARM_GALLERY[idx]);
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6 p-6 md:p-8">
      <section className="relative overflow-hidden rounded-2xl border border-border/40 shadow-lg">
        <img
          src={heroImage}
          alt="Farmland scene from Uganda"
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
        <div className="relative z-10 bg-gradient-to-r from-background/95 via-background/78 to-background/30 p-8 md:p-10">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
              Farmer Dashboard
            </Badge>
            <Badge variant="secondary">Smart Digital Decision Support System</Badge>
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight md:text-5xl">
            My Farm is the center of every decision.
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Use this dashboard to manage your fields first, then move through recommendations,
            performance, alerts, maps, weather, and market conditions in one clear workflow.
          </p>
          <div className="mt-5 flex gap-3">
            <Button asChild>
              <Link to="/my-farm">
                <Tractor className="mr-2 h-4 w-4" /> Open My Farm
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/crop-recommendations">
                <Leaf className="mr-2 h-4 w-4" /> View Recommendations
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {PANEL_ORDER.map((panel) => (
          <Card key={panel.title} className={`bg-card/85 backdrop-blur-sm border-border/60 ${panel.style ?? ''}`}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <panel.icon className="h-4 w-4 text-primary" />
                {panel.title}
              </CardTitle>
              <CardDescription>{panel.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="ghost" className="px-0 text-primary hover:text-primary">
                <Link to={panel.href}>
                  Open Panel <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-card/90 border-border/60">
          <CardHeader>
            <CardTitle>Farm Performance / Percentages</CardTitle>
            <CardDescription>Quick percentage view for this season.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {PERFORMANCE.map((item) => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span>{item.label}</span>
                  <span className="font-semibold">{item.value}%</span>
                </div>
                <Progress value={item.value} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card/90 border-border/60">
          <CardHeader>
            <CardTitle>Crop Focus</CardTitle>
            <CardDescription>Priority crops linked to the new welcome page.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {['Coffee', 'Beans', 'Maize', 'Rice'].map((crop) => (
              <div key={crop} className="rounded-xl border border-border/60 bg-muted/20 p-3 text-sm font-medium">
                {crop}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
