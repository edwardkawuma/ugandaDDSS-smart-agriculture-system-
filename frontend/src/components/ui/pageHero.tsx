import { Badge } from '@/components/ui/badge';

interface PageHeroProps {
  title: string;
  description: string;
  imageUrl: string;
  badge?: string;
}

const PageHero = ({ title, description, imageUrl, badge }: PageHeroProps) => {
  return (
    <div className="relative w-full h-48 md:h-56 rounded-xl overflow-hidden">
      <img
        src={imageUrl}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
      <div className="relative z-10 flex flex-col justify-end h-full p-6 md:p-8">
        {badge && (
          <Badge variant="secondary" className="w-fit mb-2 bg-white/20 text-white border-white/30 backdrop-blur-sm">
            {badge}
          </Badge>
        )}
        <h1 data-testid="page-heading" className="text-2xl md:text-3xl font-bold text-white">{title}</h1>
        <p className="text-sm md:text-base text-white/80 mt-1 max-w-2xl">{description}</p>
      </div>
    </div>
  );
};

export default PageHero;
