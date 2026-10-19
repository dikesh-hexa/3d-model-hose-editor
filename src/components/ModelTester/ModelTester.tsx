import React, { useState, useRef, useCallback, useEffect, Suspense } from 'react';
import { Html } from '@react-three/drei';
import { Canvas3D } from '../Viewer3D/Canvas3D/Canvas3D';
import { Camera } from '../Viewer3D/Camera/Camera';
import { Light } from '../Viewer3D/Light/Light';
import { TestModelLoader, type ModelStats } from './TestModelLoader';
import './ModelTester.css';

const LoaderFallback = () => (
  <Html center>
    <div
      style={{
        color: '#0b57d0',
        fontWeight: 'bold',
        fontSize: '1.2rem',
        whiteSpace: 'nowrap',
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '8px 16px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      }}
    >
      Parsing & Framing 3D Model...
    </div>
  </Html>
);

export const ModelTester: React.FC = () => {
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [modelStats, setModelStats] = useState<ModelStats | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resetTrigger, setResetTrigger] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeUrlRef = useRef<string | null>(null);

  // Clean up object URLs when component unmounts or model changes
  const cleanupUrl = useCallback(() => {
    if (activeUrlRef.current) {
      URL.revokeObjectURL(activeUrlRef.current);
      activeUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupUrl();
    };
  }, [cleanupUrl]);

  const loadFile = useCallback((file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'glb' && ext !== 'gltf') {
      setErrorMessage(`Unsupported format: .${ext}. Please drop a .glb or .gltf 3D model.`);
      return;
    }

    setErrorMessage(null);
    cleanupUrl();

    const newUrl = URL.createObjectURL(file);
    activeUrlRef.current = newUrl;
    setModelUrl(newUrl);
    setModelFile(file);
    setModelStats(null);
    setResetTrigger((prev) => prev + 1);
  }, [cleanupUrl]);

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only deactivate if leaving the container boundaries
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      loadFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      loadFile(files[0]);
    }
    // Reset input value so the same file can be re-selected if desired
    e.target.value = '';
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleResetCamera = () => {
    setResetTrigger((prev) => prev + 1);
  };

  const handleClearModel = () => {
    cleanupUrl();
    setModelUrl(null);
    setModelFile(null);
    setModelStats(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div
      className="tester-container main-area bg-gradient"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".glb,.gltf"
        style={{ display: 'none' }}
      />

      {/* Visual drag-over indicator */}
      {isDragging && (
        <div className="tester-drag-overlay">
          <div className="drag-overlay-message">
            <span>📥</span> Drop your 3D model here to inspect
          </div>
        </div>
      )}

      {/* Empty State Dropzone */}
      {!modelUrl && (
        <div className="tester-empty-state">
          <div className={`dropzone-card ${isDragging ? 'dragging' : ''}`}>
            <div className="dropzone-icon-wrapper">
              📦
            </div>
            <h2 className="dropzone-title">3D Model Drop Sandbox</h2>
            <p className="dropzone-subtitle">
              Drag and drop any 3D model here to test rendering with the exact same studio lighting,
              reflections, shadows, and camera parameters as the Hose Editor.
            </p>

            <div className="dropzone-badge-row">
              <span className="format-badge">.GLB (Binary)</span>
              <span className="format-badge">.GLTF</span>
            </div>

            <div className="dropzone-actions">
              <button
                type="button"
                className="browse-btn"
                onClick={handleBrowseClick}
              >
                <span>📂</span> Browse 3D File
              </button>
            </div>

            {errorMessage && (
              <div className="tester-error">
                ⚠️ {errorMessage}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active Model Floating Bar */}
      {modelUrl && modelFile && (
        <div className="tester-model-bar">
          <div className="tester-model-meta">
            <div className="tester-model-name">
              <span>📦</span>
              <span>{modelFile.name}</span>
              <span className="tester-model-tag">{formatFileSize(modelFile.size)}</span>
            </div>
            {modelStats && (
              <div className="tester-model-stats">
                <span>{modelStats.triangleCount.toLocaleString()} Triangles</span>
                <span>•</span>
                <span>{modelStats.meshCount} Meshes</span>
                <span>•</span>
                <span>
                  {modelStats.dimensions.x}m × {modelStats.dimensions.y}m × {modelStats.dimensions.z}m
                </span>
              </div>
            )}
          </div>

          <div className="tester-bar-actions">
            <button
              type="button"
              className="action-btn-sm"
              onClick={handleResetCamera}
              title="Reset camera viewpoint to center model"
            >
              🎯 Reset View
            </button>
            <button
              type="button"
              className="action-btn-sm"
              onClick={handleBrowseClick}
              title="Replace with another file"
            >
              🔄 Change Model
            </button>
            <button
              type="button"
              className="action-btn-sm action-btn-danger"
              onClick={handleClearModel}
              title="Remove model from scene"
            >
              ✕ Remove
            </button>
          </div>
        </div>
      )}

      {/* 3D Canvas with exact same pipeline */}
      <Canvas3D>
        <Camera />
        <Light />
        {modelUrl && (
          <Suspense fallback={<LoaderFallback />}>
            <TestModelLoader
              url={modelUrl}
              onModelLoaded={setModelStats}
              resetTrigger={resetTrigger}
            />
          </Suspense>
        )}
      </Canvas3D>

      {modelUrl && (
        <div className="tester-hint-badge">
          Drag & drop another .glb file anywhere to replace current model
        </div>
      )}
    </div>
  );
};
