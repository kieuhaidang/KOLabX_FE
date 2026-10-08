import { Link } from "react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";

type SolutionSectionProps = {
  title: string;
  description: string;
  highlight: string;
  image: string;
  ctaText?: string;
  ctaHref?: string;
  label?: string;
};

export function SolutionSection({
  title,
  description,
  highlight,
  image,
  ctaText,
  ctaHref = "/select-role",
  label = "Giải pháp",
}: SolutionSectionProps) {
  return (
    <section className="container mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8 lg:px-10 lg:py-10">
        <div className="pointer-events-none absolute left-0 top-0 h-56 w-56 rounded-full bg-blue-100/60 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-slate-100/80 blur-3xl" />

        <div className="relative grid items-center gap-10 md:grid-cols-2 lg:gap-12">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
              <Sparkles size={16} />
              <span>{label}</span>
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-bold leading-tight text-slate-900 md:text-4xl">{title}</h2>
              <p className="max-w-xl text-base leading-relaxed text-slate-600 md:text-lg">{description}</p>
            </div>

            <div className="inline-flex items-center rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 shadow-sm">
              {highlight}
            </div>

            {ctaText ? (
              <div>
                <Link
                  to={ctaHref}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-4 font-medium text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover"
                >
                  {ctaText}
                  <ArrowRight size={20} />
                </Link>
              </div>
            ) : null}
          </div>

          <div className="relative">
            <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-[28px] bg-blue-100/60 blur-2xl" />
            <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-blue-50 p-3 shadow-xl shadow-slate-200/60">
              <ImageWithFallback
                src={image}
                alt={title}
                className="h-full w-full rounded-2xl object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
