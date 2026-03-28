import Reveal from '../common/Reveal';

export default function ProjectFeatures({ features }) {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal>
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-12 text-center">
            Key <span className="gradient-text">Features</span>
          </h2>
        </Reveal>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Reveal key={index} delay={index * 100} type="scale">
              <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-indigo-500/30 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}