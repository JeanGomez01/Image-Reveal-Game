import React, { useEffect, useState, useRef } from "react";

const WinScreen = ({ onRestart, imageUrl }) => {
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
      window.LP.audioEngine.trigger("win");
      window.LP.audioEngine.stop("start-game");
    }
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) return;

    const ctx = canvas.getContext("2d");
    const img = imageRef.current;

    // Ajustar el tamaño del canvas
    canvas.width = 550;
    canvas.height = 550;

    let startTime = null;
    const animationDuration = 2000; // 4 segundos

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);

      setAnimationProgress(progress);

      // Limpiar el canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Dibujar la imagen completa
      const size = Math.min(img.width, img.height);
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;

      ctx.drawImage(img, sx, sy, size, size, 0, 0, canvas.width, canvas.height);

      // Dibujar el efecto de implosión
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);
      const currentRadius = maxRadius * (1 - progress);

      ctx.beginPath();
      ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.globalCompositeOperation = "destination-out";
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";

      // Dibujar texto de victoria
      const fontSize = 40 + 20 * Math.sin(progress * Math.PI);
      ctx.font = `${fontSize}px Poppins, Tahoma, Geneva, sans-serif`;
      ctx.fillStyle = "#FFD700"; // Dorado
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "#000";
      ctx.shadowBlur = 10;
      ctx.fillText("¡GANASTE!", centerX, centerY - 100);

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
    <div className="game-result-screen win-screen">
      <canvas ref={canvasRef} className="result-canvas" />

      <div className="result-content">
        {/* <div className="progress-bar">
          <div
            className="progress-fill"
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

export default WinScreen;
