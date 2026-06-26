import { CheckCircle2, LayoutDashboard } from 'lucide-react';

type AuthVisualPanelProps = {
  appName?: string;
  eyebrow?: string;
  title: string;
  description: string;
  imageUrl: string;
  bullets?: string[];
};

const DEFAULT_BULLETS = ['Focused workspace', 'Secure access', 'Live progress'];

const AuthVisualPanel = ({
  appName = 'App',
  eyebrow = 'Built for momentum',
  title,
  description,
  imageUrl,
  bullets = DEFAULT_BULLETS,
}: AuthVisualPanelProps) => {
  const initial = appName.trim().charAt(0).toUpperCase() || 'A';

  return (
    <aside className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary text-primary-foreground">
      <img
        src={imageUrl}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/45 to-primary/80" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent" />

      <div className="relative z-10 flex h-full w-full flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-base font-bold text-white shadow-lg ring-1 ring-white/20 backdrop-blur">
            {initial}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{appName}</p>
            <p className="text-xs text-white/65">{eyebrow}</p>
          </div>
        </div>

        <div className="max-w-xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-medium text-white/85 ring-1 ring-white/15 backdrop-blur">
            <span>Personalized access</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight text-white xl:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/78">
            {description}
          </p>
          <ul className="mt-7 grid gap-3">
            {bullets.slice(0, 3).map((bullet) => (
              <li key={bullet} className="flex items-center gap-3 text-sm text-white/88">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-white" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid max-w-md grid-cols-[1fr_auto] gap-3 rounded-2xl bg-white/12 p-4 text-white shadow-2xl ring-1 ring-white/15 backdrop-blur-md">
          <div>
            <p className="text-xs uppercase tracking-wide text-white/55">Workspace signal</p>
            <p className="mt-1 text-sm font-medium text-white">Ready when you return</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-primary shadow-lg">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div className="col-span-2 grid grid-cols-3 gap-2 pt-1">
            <div className="h-1.5 rounded-full bg-white/85" />
            <div className="h-1.5 rounded-full bg-white/45" />
            <div className="h-1.5 rounded-full bg-white/25" />
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AuthVisualPanel;
