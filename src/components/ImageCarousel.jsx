import React, { useState, useEffect } from "react";

const ImageCarousel = ({
  images,
  selectedImage,
  onSelectImage,
  onConfirm,
  onCancel,
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const imagesPerPage = 3;
  const totalPages = Math.ceil(images.length / imagesPerPage);

  // Reproducir sonido al seleccionar una imagen
  const playTouchSound = () => {
    if (window.LP && window.LP.audioEngine) {
      window.LP.audioEngine.trigger("touch-image");
    }
  };
  const playSlideSound = () => {
    if (window.LP && window.LP.audioEngine) {
      window.LP.audioEngine.trigger("slide");
    }
  };

  // Obtener las imágenes para la página actual
  const getCurrentImages = () => {
    const start = currentPage * imagesPerPage;
    return images.slice(start, start + imagesPerPage);
  };

  // Navegar a la página anterior
  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      playSlideSound();
    }
  };

  // Navegar a la página siguiente
  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
      playSlideSound();
    }
  };

  // Seleccionar una imagen
  const handleSelectImage = (image) => {
    onSelectImage(image);
    playTouchSound();
  };

  // Confirmar selección
  const handleConfirm = () => {
    playTouchSound();
    onConfirm();
  };

  // Cancelar selección
  const handleCancel = () => {
    playTouchSound();
    onCancel();
  };

  return (
    <div className="image-carousel">
      <h2 className="selection-title">Selecciona una imagen</h2>

      <div className="carousel-container">
        {totalPages > 1 && (
          <button
            className={`carousel-nav prev ${
              currentPage === 0 ? "disabled" : ""
            }`}
            onClick={prevPage}
            disabled={currentPage === 0}
          >
            &lt;
          </button>
        )}

        <div className="image-grid">
          {getCurrentImages().map((image) => (
            <div
              key={image.id}
              className={`image-option ${
                selectedImage === image.src ? "selected" : ""
              }`}
              onClick={() => handleSelectImage(image.src)}
            >
              <img src={image.src} alt={image.name} />
              <div className="image-name">{image.name}</div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <button
            className={`carousel-nav next ${
              currentPage === totalPages - 1 ? "disabled" : ""
            }`}
            onClick={nextPage}
            disabled={currentPage === totalPages - 1}
          >
            &gt;
          </button>
        )}
      </div>

      <div className="carousel-pagination">
        {Array.from({ length: totalPages }, (_, i) => (
          <span
            key={i}
            className={`pagination-dot ${currentPage === i ? "active" : ""}`}
            onClick={() => setCurrentPage(i)}
          />
        ))}
      </div>

      <div className="selection-buttons">
        <button className="selection-button" onClick={handleConfirm}>
          SELECCIONAR
        </button>
        <button className="selection-button cancel" onClick={handleCancel}>
          VOLVER
        </button>
      </div>
    </div>
  );
};

export default ImageCarousel;
