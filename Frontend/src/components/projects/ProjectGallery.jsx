import { useState } from 'react';
import Reveal from '../common/Reveal';

export default function ProjectGallery({ images }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);

  const openModal = (image) => {
    setCurrentImage(image);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setCurrentImage(null);
  };

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal>
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-12 text-center">
            Project <span className="gradient-text">Screenshots</span>
          </h2>
        </Reveal>

        <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
          {images.map((image, index) => (
            <Reveal key={index} delay={index * 50}>
              <div
                className="flex-shrink-0 w-80 h-48 rounded-xl overflow-hidden border border-white/10 cursor-pointer hover:scale-105 transition-transform duration-300 snap-center"
                onClick={() => openModal(image)}
              >
                <img src={image} alt={`Screenshot ${index + 1}`} className="w-full h-full object-cover" />
              </div>
            </Reveal>
          ))}
        </div>

        {/* Modal */}
        {modalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={closeModal}
          >
            <div className="relative max-w-5xl max-h-[90vh]">
              <img src={currentImage} alt="Full screen" className="w-full h-full object-contain" />
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}