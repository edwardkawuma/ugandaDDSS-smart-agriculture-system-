import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  FileText,
  FlaskConical,
  LogIn,
  Map,
  MapPin,
  Microscope,
  Sprout,
  Tractor,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const CROPS = [
  {
    name: 'Coffee',
    tagline: 'Arabica & Robusta value chains',
    note: 'Disease surveillance, rainfall advisories, and price tracking for Uganda\'s #1 export crop.',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Maize',
    tagline: 'Staple food security',
    note: 'Fall armyworm alerts, planting-window forecasts, and yield projections by district.',
    image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Beans',
    tagline: 'Nutrition & income',
    note: 'Anthracnose and bean fly advisories tuned to the bimodal rainfall pattern.',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Hass Avocado',
    tagline: 'Emerging export crop',
    note: 'Market linkage, post-harvest guidance, and orchard suitability mapping.',
    image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=1200&q=80',
  },
];

const ROLES = [
  {
    role: 'Farmers',
    title: 'Weather & pest alerts on every plot',
    desc: 'Receive localized weather forecasts, pest outbreak warnings, and crop recommendations on your phone — in your language.',
    icon: Tractor,
  },
  {
    role: 'Extension Workers',
    title: 'Manage thousands of farms at once',
    desc: 'Track farm registrations, push advisories, and report ground-truth observations across your entire district.',
    icon: Users,
  },
  {
    role: 'Researchers · NARO',
    title: 'Research tools & data hub access',
    desc: 'Query curated multi-year datasets, run trials, and publish findings directly to the national repository.',
    icon: FlaskConical,
  },
  {
    role: 'MAAIF Officials',
    title: 'National policy dashboards',
    desc: 'Real-time visibility on production, disease incidence, and food-security indicators across all 146 districts.',
    icon: Microscope,
  },
  {
    role: 'Development Partners',
    title: 'Programme monitoring & evaluation',
    desc: 'Track UCSATP and partner-project outcomes against climate-smart agriculture KPIs.',
    icon: Sprout,
  },
  {
    role: 'Public Visitors',
    title: 'Open maps & advisories',
    desc: 'No login required — explore public agricultural maps, weather layers, and downloadable reports.',
    icon: MapPin,
  },
];

const STEPS = [
  {
    title: 'Ingest',
    desc: 'Weather stations, satellite imagery, soil sensors, market prices, and field reports stream into the hub.',
  },
  {
    title: 'Integrate',
    desc: 'Multi-source datasets are cleaned, geo-referenced, and joined in the National Agricultural Data Hub.',
  },
  {
    title: 'Analyze',
    desc: 'Models trained on Ugandan agro-ecological zones detect pest outbreaks and predict yield outcomes.',
  },
  {
    title: 'Advise',
    desc: 'Actionable alerts, recommendations, and dashboards are pushed to the right stakeholder at the right time.',
  },
];


export default function Landing() {
    const navigate = useNavigate();

    function gotoPage_2() {
        navigate('/maps');
    }
    function gotoPage_3() {
        navigate('/information');
    }
    function gotoPage_4() {
        navigate('/seasons');
    }
    function gotoPage_30() {
        navigate('/reports');
    }

    return (
    <div className="app-bg relative overflow-hidden">
      {/* ============================================================ */}
      {/* HERO — Spatial layered-depth composition                     */}
      {/* ============================================================ */}
      <section className="relative isolate min-h-[88vh] w-full overflow-hidden">
        {/* Background layer — distant photo plane (blurred) */}
        <div
          aria-hidden
          className="absolute inset-0 -z-30 scale-110"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2400&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(8px) brightness(0.32) saturate(1.05)",
            transform: "translate3d(0,0,0)",
          }}
        />
        {/* Mid layer — warm sunlit gradient veil */}
        <div
          aria-hidden
          className="absolute inset-0 -z-20"
          style={{
            background:
              "linear-gradient(110deg, rgba(12, 18, 10, 0.88) 0%, rgba(16, 24, 12, 0.75) 38%, rgba(12, 20, 12, 0.66) 100%), radial-gradient(1300px 700px at 22% 16%, rgba(255, 190, 90, 0.24), transparent 40%), radial-gradient(900px 450px at 82% 20%, rgba(255, 200, 110, 0.16), transparent 45%), radial-gradient(220px 220px at 60% 15%, rgba(255, 255, 220, 0.18), transparent 45%)",
          }}
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-black/32" />
        {/* Foreground depth fragments — drift cards */}
        <div
          aria-hidden
          className="pointer-events-none absolute right-6 top-24 hidden h-44 w-72 -rotate-2 rounded-3xl border border-white/10 bg-slate-900/85 p-4 shadow-[0_30px_60px_rgba(15,23,42,0.28)] backdrop-blur-3xl md:block"
          style={{ transform: "translate3d(0,0,42px) rotate(-2deg)" }}
        >
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-100/85">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.35)]" />
            Pest Alert — Eastern Region
          </div>
          <div className="mt-3 font-heading text-lg leading-tight text-slate-100">
            Coffee Berry Borer outbreak risk: <span className="text-amber-200">HIGH</span>
          </div>
          <div className="mt-2 text-xs text-slate-300">
            Triggered by sustained humidity &gt; 80% over the last 6 days.
          </div>
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-28 left-6 hidden h-36 w-60 rounded-3xl border border-white/10 bg-slate-900/85 p-4 shadow-[0_30px_60px_rgba(15,23,42,0.24)] backdrop-blur-3xl lg:block"
          style={{ transform: "translate3d(0,0,48px) rotate(1deg)" }}
        >
          <div className="text-xs font-medium uppercase tracking-wider text-white/80">
            Long Rains 2026 — Forecast
          </div>
          <div className="mt-3 flex items-end gap-1.5">
            {[28, 44, 36, 58, 70, 52].map((h, i) => (
              <div
                key={i}
                className="w-5 rounded-sm bg-gradient-to-t from-lime-300/80 to-emerald-300/80"
                style={{ height: `${h}px` }}
              />
            ))}
          </div>
          <div className="mt-2 text-[10px] text-white/70">March — May • mm/week</div>
        </div>

        {/* Hero content — base plane */}
        <div className="relative z-10 mx-auto flex min-h-[88vh] max-w-6xl flex-col items-start justify-center px-6 py-24 md:px-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-slate-950/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-100 shadow-xl shadow-slate-950/40 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.55)]" />
            National Agricultural Data Hub · Uganda
          </div>
          <h1 className="mt-6 max-w-3xl font-heading text-5xl font-semibold leading-[1.05] text-white md:text-7xl">
            Climate-smart decisions,
            <br />
            <span className="bg-gradient-to-r from-amber-200 via-orange-200 to-slate-100 bg-clip-text text-transparent">
              rooted in Ugandan soil.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-100/95 md:text-xl">
            A unified decision-support platform integrating weather, pest, soil, and
            market data to help farmers, extension workers, researchers, and
            policymakers grow more — and lose less — across coffee, maize, beans,
            and Hass avocado value chains.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button
              size="lg"
              onClick={gotoPage_2}
              className="rounded-full border border-amber-300/40 bg-amber-300/10 px-6 py-3 text-base text-amber-100 shadow-[0_20px_50px_rgba(245,158,11,0.18)] transition duration-200 ease-out hover:border-amber-300/60 hover:bg-amber-300/18 hover:text-white"
            >
              <Map className="mr-2 h-5 w-5 text-emerald-200" />
              Explore Public Maps
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/login")}
              className="rounded-full border border-white/25 bg-slate-900/85 px-6 py-3 text-base text-white shadow-xl shadow-slate-950/30 backdrop-blur-md hover:border-emerald-300/40 hover:bg-slate-900/95 hover:text-emerald-100"
            >
              <LogIn className="mr-2 h-5 w-5 text-white" />
              Sign in
            </Button>
          </div>

          {/* Stat strip — crisp foreground plane */}
          <div className="mt-16 grid w-full max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { k: "6", v: "Stakeholder roles" },
              { k: "4", v: "Priority crops" },
              { k: "2", v: "Rainy seasons tracked" },
              { k: "146", v: "Districts covered" },
            ].map((s) => (
              <div
                key={s.v}
                className="rounded-3xl border border-white/10 bg-slate-900/85 p-5 text-slate-100 shadow-[0_20px_40px_rgba(15,23,42,0.2)] backdrop-blur-3xl"
              >
                <div className="font-heading text-3xl font-semibold text-white">{s.k}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-300">
                  {s.v}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* CROPS — initial focus                                         */}
      {/* ============================================================ */}
      <section className="relative mx-auto max-w-6xl px-6 py-24 md:px-10">
        <div className="mb-12 max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Initial Crop Focus
          </div>
          <h2 className="mt-3 font-heading text-4xl font-semibold md:text-5xl">
            Four crops. One national hub.
          </h2>
          <p className="mt-4 text-muted-foreground md:text-lg">
            Targeted intelligence for Uganda's most economically significant crops —
            from smallholder plots to commercial estates.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CROPS.map((c) => (
            <Card
              key={c.name}
              className="overflow-hidden rounded-lg border-border/40 bg-card/60 shadow-md backdrop-blur-md transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="aspect-[4/3] w-full overflow-hidden">
                <img
                  src={c.image}
                  alt={c.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 ease-out hover:scale-105"
                />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="font-heading text-xl">{c.name}</CardTitle>
                <CardDescription>{c.tagline}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-muted-foreground">
                {c.note}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* ROLES — capability matrix                                     */}
      {/* ============================================================ */}
      <section className="relative bg-gradient-to-b from-background via-card/40 to-background py-24">
        <div className="mx-auto max-w-6xl px-6 md:px-10">
          <div className="mb-12 max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Built for every stakeholder
            </div>
            <h2 className="mt-3 font-heading text-4xl font-semibold md:text-5xl">
              Six roles. One source of truth.
            </h2>
            <p className="mt-4 text-muted-foreground md:text-lg">
              The platform tailors dashboards, alerts, and tools to each role across
              the agricultural value chain.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {ROLES.map((r) => {
              const Icon = r.icon;
              return (
                <Card
                  key={r.title}
                  className="group rounded-lg border-border/40 bg-card/60 p-6 shadow-md backdrop-blur-md transition-all duration-200 ease-out hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_0_24px_hsl(var(--primary)/0.25)]"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-primary/40 bg-primary/10 text-primary shadow-[0_0_12px_hsl(var(--primary)/0.35)]">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {r.role}
                      </div>
                      <h3 className="font-heading text-lg font-semibold leading-tight">
                        {r.title}
                      </h3>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {r.desc}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* HOW IT WORKS                                                  */}
      {/* ============================================================ */}
      <section className="relative mx-auto max-w-6xl px-6 py-24 md:px-10">
        <div className="mb-12 max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            How it works
          </div>
          <h2 className="mt-3 font-heading text-4xl font-semibold md:text-5xl">
            From raw data to field-ready advice.
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          {STEPS.map((s, idx) => (
            <div key={s.title} className="relative">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-primary/50 bg-primary/10 font-heading text-lg text-primary">
                  {idx + 1}
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-primary/50 to-transparent" />
              </div>
              <h3 className="font-heading text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* RESOURCES — wired navigation links                            */}
      {/* ============================================================ */}
      <section className="relative bg-card/30 py-24">
        <div className="mx-auto max-w-6xl px-6 md:px-10">
          <div className="mb-12 max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Public resources
            </div>
            <h2 className="mt-3 font-heading text-4xl font-semibold md:text-5xl">
              Open data for open agriculture.
            </h2>
            <p className="mt-4 text-muted-foreground md:text-lg">
              No account required. Explore public maps, browse advisories, plan by
              season, and download reports.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card
              onClick={gotoPage_3}
              className="group cursor-pointer rounded-lg border-border/40 bg-card/60 p-6 shadow-md backdrop-blur-md transition-all duration-200 ease-out hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_0_24px_hsl(var(--primary)/0.25)]"
            >
              <BookOpen className="h-8 w-8 text-primary" />
              <h3 className="mt-4 font-heading text-xl font-semibold">
                Agricultural Information
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Browse agronomic guides, crop calendars, and best practices for
                Uganda's priority value chains.
              </p>
              <div className="mt-4 inline-flex items-center text-sm font-medium text-primary">
                Browse library
                <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </Card>
            <Card
              onClick={gotoPage_4}
              className="group cursor-pointer rounded-lg border-border/40 bg-card/60 p-6 shadow-md backdrop-blur-md transition-all duration-200 ease-out hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_0_24px_hsl(var(--primary)/0.25)]"
            >
              <Calendar className="h-8 w-8 text-primary" />
              <h3 className="mt-4 font-heading text-xl font-semibold">
                Seasonal Calendars
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Planting windows for the long rains (March–May) and short rains
                (October–December), tailored by region.
              </p>
              <div className="mt-4 inline-flex items-center text-sm font-medium text-primary">
                View calendars
                <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </Card>
            <Card
              onClick={gotoPage_30}
              className="group cursor-pointer rounded-lg border-border/40 bg-card/60 p-6 shadow-md backdrop-blur-md transition-all duration-200 ease-out hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_0_24px_hsl(var(--primary)/0.25)]"
            >
              <FileText className="h-8 w-8 text-primary" />
              <h3 className="mt-4 font-heading text-xl font-semibold">
                Public Reports
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Download seasonal outlooks, value-chain analyses, and World Bank
                UCSATP project publications.
              </p>
              <div className="mt-4 inline-flex items-center text-sm font-medium text-primary">
                Download reports
                <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* CTA — closing section (page content, not site footer)         */}
      {/* ============================================================ */}
      <section className="relative mx-auto max-w-5xl px-6 py-24 md:px-10">
        <div className="overflow-hidden rounded-2xl border border-border/40 bg-card/70 p-10 text-center shadow-2xl backdrop-blur-xl md:p-16">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 opacity-40"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=2000&q=80')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(2px) brightness(0.6)",
            }}
          />
          <h2 className="font-heading text-4xl font-semibold md:text-5xl">
            Ready to farm with better data?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground md:text-lg">
            Join thousands of Ugandan farmers, extension workers, and researchers
            already making climate-smart decisions every day.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate("/login")}
              className="border-primary bg-transparent text-primary shadow-[0_0_18px_hsl(var(--primary)/0.55)] transition-all duration-200 ease-out hover:shadow-[0_0_28px_hsl(var(--primary)/0.75)]"
            >
              <LogIn className="mr-2 h-5 w-5" />
              Sign in
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/signup")}
            >
              Create account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
