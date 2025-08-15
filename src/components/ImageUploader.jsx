import React, { useState, useRef } from "react";

const ImageUploader = ({ onImageUploaded, onCancel }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Manejar el arrastre de archivos
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Manejar la soltura del archivo
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Manejar la selección de archivo
  const handleChange = (e) => {
    e.preventDefault();

    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Procesar el archivo seleccionado
  const handleFile = (file) => {
    // Verificar que sea una imagen
    if (!file.type.match("image.*")) {
      setError("Por favor selecciona un archivo de imagen válido.");
      return;
    }

    // Verificar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen es demasiado grande. El tamaño máximo es 5MB.");
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Crear URL para previsualización
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Abrir el selector de archivos
  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  // Guardar la imagen
  const handleSave = () => {
    if (!selectedFile) {
      setError("Por favor selecciona una imagen primero.");
      return;
    }

    // Crear un objeto URL para la imagen
    const imageUrl = URL.createObjectURL(selectedFile);

    // Generar un ID único para la imagen
    const imageId = `custom_${Date.now()}`;

    // Crear objeto de imagen
    const newImage = {
      id: imageId,
      src: imageUrl,
      name: selectedFile.name.substring(0, 20), // Limitar longitud del nombre
      file: selectedFile,
      isCustom: true,
    };

    // Notificar al componente padre
    onImageUploaded(newImage);
  };

  // Cancelar la carga
  const handleCancel = () => {
    // Reproducir sonido
    if (window.LP && window.LP.audioEngine) {
      window.LP.audioEngine.trigger("touched");
    }

    onCancel();
  };

  return (
    <div className="image-uploader">
      <h2 className="uploader-title">Subir nueva imagen</h2>

      {error && <div className="uploader-error">{error}</div>}

      <div
        className={`drop-zone ${dragActive ? "active" : ""} ${
          previewUrl ? "has-preview" : ""
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Preview" className="image-preview" />
        ) : (
          <div className="drop-zone-content">
            <div className="drop-icon">📁</div>
            <p>Arrastra una imagen aquí o haz clic para seleccionar</p>
            <p className="drop-zone-hint">
              Formatos: JPG, PNG, JPEG (máx. 5MB)
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          style={{ display: "none" }}
        />
      </div>

      <div className="uploader-buttons">
        <button
          className="selection-button"
          onClick={handleSave}
          disabled={!selectedFile}
        >
          GUARDAR
        </button>
        <button className="selection-button cancel" onClick={handleCancel}>
          CANCELAR
        </button>
      </div>
    </div>
  );
};

export default ImageUploader;
