import { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene3D, getNextColor } from './Scene3D';
import { Toolbar } from './Toolbar';
import { PointList } from './PointList';
import './FeaturePointLabeling.css';
import type { FeaturePoint, LabelingMode } from '../../types/featurePoint';

function generateId(): string {
  return `pt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function FeaturePointLabeling() {
  const [points, setPoints] = useState<FeaturePoint[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<LabelingMode>('add');
  const [viewAction, setViewAction] = useState<'zoomIn' | 'zoomOut' | 'reset' | null>(null);

  const handleAddPoint = useCallback((position: { x: number; y: number; z: number }) => {
    const newPoint: FeaturePoint = {
      id: generateId(),
      x: position.x,
      y: position.y,
      z: position.z,
      label: `Point ${points.length + 1}`,
      color: getNextColor(points.length),
      createdAt: Date.now(),
    };
    setPoints((prev) => [...prev, newPoint]);
    setSelectedId(newPoint.id);
  }, [points.length]);

  const handleSelectPoint = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  const handleUpdatePoint = useCallback((id: string, updates: Partial<FeaturePoint>) => {
    setPoints((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  }, []);

  const handleDeletePoint = useCallback((id: string) => {
    setPoints((prev) => prev.filter((p) => p.id !== id));
    if (selectedId === id) setSelectedId(null);
  }, [selectedId]);

  const handleZoomIn = useCallback(() => setViewAction('zoomIn'), []);
  const handleZoomOut = useCallback(() => setViewAction('zoomOut'), []);
  const handleReset = useCallback(() => setViewAction('reset'), []);

  return (
    <div className="feature-point-labeling">
      <Toolbar
        mode={mode}
        onModeChange={setMode}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleReset}
      />
      <div className="labeling-layout">
        <div className="canvas-container">
          <Canvas
            camera={{ position: [5, 5, 5], fov: 50 }}
            gl={{ antialias: true }}
            shadows
          >
            <Scene3D
              points={points}
              selectedId={selectedId}
              mode={mode}
              onAddPoint={handleAddPoint}
              onSelectPoint={handleSelectPoint}
              onUpdatePoint={handleUpdatePoint}
              onDeletePoint={handleDeletePoint}
              viewAction={viewAction}
              onViewActionConsumed={() => setViewAction(null)}
            />
          </Canvas>
        </div>
        <PointList
          points={points}
          selectedId={selectedId}
          onSelect={handleSelectPoint}
          onUpdate={handleUpdatePoint}
          onDelete={handleDeletePoint}
        />
      </div>
    </div>
  );
}

export default FeaturePointLabeling;
