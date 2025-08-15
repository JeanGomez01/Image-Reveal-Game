import React, { useEffect, useState, useRef } from "react";

const GameOverScreen = ({ onRestart, imageUrl }) => {
  const [animationProgress, setAnimationProgress] = useState(0);
  const [showButton, setShowButton] = useState(false);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const imageRef = useRef(null);

  // Cargar la imagen
  useEffect(() => {
    if (!imageUrl) return;

    imageRef.current = new Image();
    imageRef.current.src = imageUrl;

    imageRef.current.onload = () => {
      startAnimation();
    };

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [imageUrl]);

  // Iniciar la animación de implosión
  const startAnimation = () => {
    if (window.LP && window.LP.audioEngine) {
      window.LP.audioEngine.trigger("game-over");
      window.LP.audioEngine.stop("start-game");
    }
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) return;

    const ctx = canvas.getContext("2d");
    const img = imageRef.current;

    // Ajustar el tamaño del canvas
    canvas.width = 600;
    canvas.height = 600;

    let startTime = null;
    const animationDuration = 2000; // 4 segundos

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);

      setAnimationProgress(progress);

      // Limpiar el canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Dibujar la imagen completa con un filtro oscuro
      const size = Math.min(img.width, img.height);
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;

      ctx.drawImage(img, sx, sy, size, size, 0, 0, canvas.width, canvas.height);

      // Aplicar un filtro oscuro a toda la imagen
      ctx.fillStyle = `rgba(0, 0, 0, ${0.5 + progress * 0.4})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Dibujar el efecto de implosión
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);
      const currentRadius = maxRadius * (1 - progress);

      ctx.beginPath();
      ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 0, 0, 1)";
      ctx.fill();

      // Dibujar texto de game over
      const fontSize = 40 + 10 * Math.sin(progress * Math.PI);
      ctx.font = `${fontSize}px 'Press Start 2P', monospace`;
      ctx.fillStyle = "#FF0000"; // Rojo
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "#000";
      ctx.shadowBlur = 10;
      ctx.fillText("GAME OVER", centerX, centerY - 100);

      // Continuar la animación si no ha terminado
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Mostrar el botón cuando termine la animación
        setShowButton(true);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const handleRestart = () => {
    // Reproducir sonido
    if (window.LP && window.LP.audioEngine) {
      window.LP.audioEngine.trigger("touch-image");
    }

    if (onRestart) {
      onRestart();
    }
  };

  return (
    <div className="game-result-screen game-over-screen">
      <canvas ref={canvasRef} className="result-canvas" />

      <div className="result-content">
        {/* <div className="progress-bar">
          <div
            className="progress-fill game-over-fill"
            style={{ width: `${animationProgress * 100}%` }}
          />
        </div> */}

        {showButton && (
          <button className="restart-button pulse" onClick={handleRestart}>
            VOLVER A JUGAR
          </button>
        )}
      </div>
    </div>
  );
};

export default GameOverScreen;
