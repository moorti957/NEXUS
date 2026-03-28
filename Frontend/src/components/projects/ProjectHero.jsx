import Reveal from '../common/Reveal';

export default function ProjectHero({ title, description, image, gradient, liveUrl }) {
  return (
    <section className="relative min-h-[60vh] flex items-center overflow-hidden pt-20">
      {/* Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} pointer-events-none`}>
  <div className="absolute inset-0 bg-[url('/patterns/circuit.svg')] opacity-20"></div>
</div>

      <div className="max-w-7xl mx-auto px-6 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <Reveal>
            <h1 className="text-5xl md:text-7xl font-bold font-display leading-tight mb-6">
              {title}
            </h1>
            <p className="text-lg text-gray-400 mb-8 max-w-lg">{description}</p>
          <a
  href={liveUrl}
  target="_blank"
  rel="noopener noreferrer"
  className="relative z-20 inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors"
>
              Visit Live Website
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </Reveal>

          <Reveal type="scale" className="relative">
<div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/30 p-4">
  <img
    src={image}
    alt={title}
    className="w-full h-auto object-contain"
  />
</div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}