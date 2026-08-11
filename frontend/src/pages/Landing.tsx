import { Link } from 'react-router-dom';
import { ArrowRight, Coffee, Leaf, Sprout, Wheat, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const CROPS = [
  {
    name: 'Coffee',
    icon: Coffee,
    image:
      'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1200&q=80',
    summary: 'Smart pest and market guidance for Arabica and Robusta systems.',
  },
  {
    name: 'Beans',
    icon: Sprout,
    image:
      '/images/beans-red-dry-user.png',
    summary: 'Seasonal planning and disease prevention for household food security.',
  },
  {
    name: 'Maize',
    icon: Wheat,
    image:
      'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=1200&q=80',
    summary: 'Yield optimization and alerting for Uganda\'s staple cereal crop.',
  },
  {
    name: 'Rice',
    icon: Leaf,
    image:
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=1200&q=80',
    summary: 'Water-aware recommendations and district risk visibility for paddy systems.',
  },
];

export default function Landing() {
  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(900px 500px at 8% -8%, rgba(42,157,87,0.18), transparent 60%), radial-gradient(800px 420px at 90% 0%, rgba(233,196,106,0.17), transparent 58%), linear-gradient(180deg, rgba(255,255,255,0.18), transparent 35%)',
        }}
      />

      <section className="relative mx-auto max-w-6xl px-6 pb-12 pt-14 md:px-10 md:pb-16 md:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Smart Digital Decision Support System
          </div>

          <h1 className="mt-5 font-heading text-4xl font-bold tracking-tight text-foreground md:text-6xl">
            Grow Smarter with SDDSS
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            A practical platform that combines weather, crop health, satellite, and market signals
            to support faster and better agricultural decisions for farmers and extension teams.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="min-w-44">
              <Link to="/login">
                Go to Login <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="min-w-44">
              <Link to="/signup">Create Account</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-16 md:grid-cols-2 md:gap-5 md:px-10 lg:grid-cols-4">
        {CROPS.map((crop) => (
          <Card
            key={crop.name}
            className="group overflow-hidden border-border/60 bg-card/90 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="relative h-36 overflow-hidden">
              <img
                src={crop.image}
                alt={crop.name}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-background/85 text-primary">
                <crop.icon className="h-4 w-4" />
              </div>
            </div>
            <CardContent className="space-y-2 p-4">
              <h2 className="font-heading text-lg font-semibold leading-tight">{crop.name}</h2>
              <p className="text-sm text-muted-foreground">{crop.summary}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
