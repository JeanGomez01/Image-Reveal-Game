import React, { useRef, useEffect, useState } from "react";
import "./ImageSelection.css";
import ImageCarousel from "./ImageCarousel";
import ImageUploader from "./ImageUploader";

// Importar el módulo de inicialización del juego con sintaxis ES6
import { initGame } from "../engine/engine";

// Importar la implementación de respaldo de FPSMeter
import "../lib/fpsmeter-fallback";

// Asegurarse de que el namespace global LP existe
if (typeof window !== "undefined") {
  window.LP = window.LP || {};
}

const GameCanvas = () => {
  const canvasRef = useRef(null);
  const statsRef = useRef(null);
  const fpsMeterRef = useRef(null);
  const messagesRef = useRef(null);
  const [playMusic, setPlayMusic] = useState(false);
  const [gameInitialized, setGameInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [showMenu, setShowMenu] = useState(true);
  const [showSelectionScreen, setShowSelectionScreen] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [selectedImage, setSelectedImage] = useState("image.png");
  const [gameInstance, setGameInstance] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [customImages, setCustomImages] = useState([]);

  // Opciones de imágenes disponibles
  const defaultImages = [
    { id: "image1", src: "image.png", name: "Imagen 1", isDefault: true },
    { id: "image2", src: "image2.png", name: "Imagen 2", isDefault: true },
    { id: "image3", src: "image3.png", name: "Imagen 3", isDefault: true },
  ];

  // Combinar imágenes predeterminadas con imágenes personalizadas
  const allImages = [...defaultImages, ...customImages];

  // Precarga de imágenes
  useEffect(() => {
    const preloadImages = () => {
      defaultImages.forEach((image) => {
        const img = new Image();
        img.src = image.src;
      });
    };

    preloadImages();
  }, []);

  useEffect(() => {
    // Cargar la fuente "Press Start 2P" para el estilo retro
    const loadRetroFont = () => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap";
      document.head.appendChild(link);
    };

    // Función para cargar scripts externos necesarios
    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = () => {
          console.log(`Script loaded successfully: ${src}`);
          resolve();
        };
        script.onerror = () =>
          reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(script);
      });
    };

    // Cargar FPSMeter si no está disponible
    const loadDependencies = async () => {
      try {
        // Cargar la fuente retro
        loadRetroFont();

        if (typeof window.FPSMeter === "undefined") {
          console.log("FPSMeter not found, loading from CDN...");
          await loadScript(
            "https://cdnjs.cloudflare.com/ajax/libs/fpsmeter/0.3.1/fpsmeter.min.js"
          );
          console.log(
            "FPSMeter loaded successfully, window.FPSMeter:",
            window.FPSMeter
          );

          // Esperar un momento para asegurarse de que FPSMeter esté disponible globalmente
          setTimeout(() => {
            setGameInitialized(false); // Forzar la reinicialización
          }, 100);
        } else {
          console.log("FPSMeter already available:", window.FPSMeter);
        }
      } catch (error) {
        console.error("Failed to load dependencies:", error);
        setError("Failed to load game dependencies. Please refresh the page.");
      }
    };

    loadDependencies();
  }, []);

  // Efecto para inicializar el motor de audio y reproducir música del menú
  useEffect(() => {
    if (typeof window !== "undefined" && showMenu && playMusic) {
      // Importar el motor de audio
      import("../engine/audioEngine").then((module) => {
        const audioEngine = module.initAudioEngine();
        audioEngine.setMusic(playMusic);
        audioEngine.trigger("music-game");
      });
    }
  }, [showMenu, playMusic]);

  // Efecto para reproducir música en la pantalla de selección
  useEffect(() => {
    if (typeof window !== "undefined" && showSelectionScreen && playMusic) {
      // Importar el motor de audio
      import("../engine/audioEngine").then((module) => {
        const audioEngine = module.initAudioEngine();
        audioEngine.setMusic(playMusic);
        audioEngine.trigger("music-game");
      });
    }
  }, [showSelectionScreen, playMusic]);

  // Efecto para inicializar el juego cuando se selecciona una imagen
  useEffect(() => {
    if (
      !showMenu &&
      !showSelectionScreen &&
      !gameInitialized &&
      canvasRef.current
    ) {
      initializeGame();
    }
  }, [showMenu, showSelectionScreen, gameInitialized, canvasRef.current]);

  // Inicializar el juego
  const initializeGame = async () => {
    if (
      !canvasRef.current ||
      !statsRef.current ||
      !fpsMeterRef.current ||
      !messagesRef.current
    ) {
      console.log("DOM elements not ready yet");
      return;
    }

    setIsLoading(true);

    try {
      console.log("Initializing game with image:", selectedImage);

      // Verificar que FPSMeter está disponible
      if (typeof window.FPSMeter === "undefined") {
        throw new Error("FPSMeter not available");
      }

      // Verificar que initGame es una función
      if (typeof initGame !== "function") {
        throw new Error("initGame is not a function");
      }

      // Precargar la imagen seleccionada
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = reject;
        img.src = selectedImage;
      });

      // Inicializar el juego con la imagen seleccionada
      const game = initGame(
        canvasRef.current,
        statsRef.current,
        fpsMeterRef.current,
        messagesRef.current,
        selectedImage,
        playMusic
      );

      console.log("Game initialized:", game);
      setGameInstance(game);
      setGameInitialized(true);
      setIsLoading(false);

      // Cambiar la música si está habilitada
      if (playMusic && window.LP && window.LP.audioEngine) {
        window.LP.audioEngine.stop("music-game");
        window.LP.audioEngine.trigger("start-game");
      }
    } catch (error) {
      console.error("Error initializing game:", error);
      setError(`Error initializing game: ${error.message}`);
      setIsLoading(false);
    }
  };

  // Limpiar recursos cuando el componente se desmonta
  useEffect(() => {
    return () => {
      if (gameInstance && typeof gameInstance.cleanup === "function") {
        gameInstance.cleanup();
      }
    };
  }, [gameInstance]);

  const handleMusicToggle = (e) => {
    const newMusicState = e.target.checked;
    setPlayMusic(newMusicState);

    // Implementaremos esta función en el motor de audio
    if (window.LP && window.LP.audioEngine) {
      window.LP.audioEngine.setMusic(newMusicState);

      // Si estamos en el menú o en la selección, reproducir/detener la música del menú
      if (showMenu || showSelectionScreen) {
        if (newMusicState) {
          window.LP.audioEngine.trigger("music-game");
        } else {
          window.LP.audioEngine.stop("music-game");
        }
      }
      // Si estamos en el juego, reproducir/detener la música del juego
      else {
        if (newMusicState) {
          window.LP.audioEngine.trigger("start-game");
        } else {
          window.LP.audioEngine.stop("start-game");
        }
      }
    }
  };

  const handleStartClick = () => {
    // Reproducir sonido
    if (window.LP && window.LP.audioEngine) {
      window.LP.audioEngine.trigger("touch-image");
    }

    // Mostrar la pantalla de selección de imágenes
    setShowMenu(false);
    setShowSelectionScreen(true);
  };

  const handleImageSelect = (imageSrc) => {
    setSelectedImage(imageSrc);

    // Reproducir sonido
    if (window.LP && window.LP.audioEngine) {
      window.LP.audioEngine.trigger("touch-image");
    }
  };

  const handleStartGame = () => {
    // Reproducir sonido
    if (window.LP && window.LP.audioEngine) {
      window.LP.audioEngine.trigger("touch-image");
    }

    // Ocultar la pantalla de selección y comenzar el juego
    setShowSelectionScreen(false);
    setGameInitialized(false); // Forzar la reinicialización del juego
  };

  const handleBackToMenu = () => {
    // Reproducir sonido
    if (window.LP && window.LP.audioEngine) {
      window.LP.audioEngine.trigger("touch-image");
    }

    // Volver al menú principal
    setShowSelectionScreen(false);
    setShowUploader(false);
    setShowMenu(true);

    // Cambiar la música si está habilitada
    if (playMusic && window.LP && window.LP.audioEngine) {
      window.LP.audioEngine.stop("start-game");
      window.LP.audioEngine.trigger("music-game");
    }

    // Limpiar el juego si está inicializado
    if (gameInstance && typeof gameInstance.cleanup === "function") {
      gameInstance.cleanup();
      setGameInstance(null);
      setGameInitialized(false);
    }
  };

  const handleShowUploader = () => {
    // Reproducir sonido
    if (window.LP && window.LP.audioEngine) {
      window.LP.audioEngine.trigger("touch-image");
    }

    setShowUploader(true);
  };

  const handleCancelUpload = () => {
    setShowUploader(false);
  };

  const handleImageUploaded = (newImage) => {
    // Añadir la nueva imagen a la lista de imágenes personalizadas
    setCustomImages((prevImages) => [...prevImages, newImage]);
    setShowUploader(false);

    // Seleccionar automáticamente la nueva imagen
    setSelectedImage(newImage.src);
  };

  return (
    <div className="game-container">
      {error && (
        <div style={{ color: "red", padding: "20px", textAlign: "center" }}>
          {error}
        </div>
      )}

      <div className="game-header">
        <h1 className="game-title">AI Image Reveal</h1>
        <div className="game-controls">
          <label className="music-toggle">
            <input
              id="miCheckbox"
              type="checkbox"
              checked={playMusic}
              onChange={handleMusicToggle}
            />
            <span style={{ marginLeft: "5px" }}>Música</span>
          </label>
        </div>
      </div>

      <div className="game-stats-container">
        <div id="fpsMeter" ref={fpsMeterRef} className="fps-meter"></div>
        <div id="messages" ref={messagesRef} className="game-messages"></div>
        <div id="stats" ref={statsRef} className="game-stats"></div>
      </div>

      <div className="canvas-container">
        <canvas
          id="canvas"
          ref={canvasRef}
          width="600"
          height="600"
          className="game-canvas"
        />

        {/* Pantalla de carga */}
        {isLoading && (
          <div className="loading-screen">
            <div className="loading-text">Cargando...</div>
            <div className="loading-spinner"></div>
          </div>
        )}

        {/* Menú de inicio */}
        {showMenu && (
          <div className="start-menu">
            <button className="start-button pulse" onClick={handleStartClick}>
              JUGAR
            </button>
          </div>
        )}

        {/* Pantalla de selección de imágenes */}
        {showSelectionScreen && !showUploader && (
          <div className="selection-overlay">
            <ImageCarousel
              images={allImages}
              selectedImage={selectedImage}
              onSelectImage={handleImageSelect}
              onConfirm={handleStartGame}
              onCancel={handleBackToMenu}
            />

            <button
              className="selection-button upload-button"
              onClick={handleShowUploader}
            >
              <span className="upload-icon">⬆️</span> SUBIR IMAGEN
            </button>
          </div>
        )}

        {/* Pantalla de carga de imágenes */}
        {showUploader && (
          <div className="selection-overlay">
            <ImageUploader
              onImageUploaded={handleImageUploaded}
              onCancel={handleCancelUpload}
            />
          </div>
        )}
      </div>

      <div className="game-instructions">
        <h3>Cómo jugar:</h3>
        <ul>
          <li>
            Usar <span className="key">↑</span> <span className="key">↓</span>{" "}
            <span className="key">←</span> <span className="key">→</span> para
            moverte
          </li>
          <li>
            Manten presionado <span className="key">ESPACIO</span> para dibujar
          </li>
          <li>Revela el 80% de la imagen para ganar</li>
          <li>Esquiva los enemigos mientras dibujas</li>
        </ul>
        {!showMenu && !showSelectionScreen && (
          <button className="selection-button back" onClick={handleBackToMenu}>
            VOLVER AL MENÚ
          </button>
        )}
      </div>
    </div>
  );
};

export default GameCanvas;
