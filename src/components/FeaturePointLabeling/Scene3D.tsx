import { useRef, useCallback, useState, useEffect } from 'react';
import { useThree, useLoader } from '@react-three/fiber';
import { OrbitControls, useGLTF, useTexture } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import type { FeaturePoint, LabelingMode } from '../../types/featurePoint';

type ModelType = 'gltf' | 'stl' | 'image';

interface Scene3DProps {
  modelUrl: string;
  modelType: ModelType;
  points: FeaturePoint[];
  selectedId: string | null;
  mode: LabelingMode;
  onAddPoint: (point: { x: number; y: number; z: number }) => void;
  onSelectPoint: (id: string | null) => void;
  onUpdatePoint: (id: string, updates: Partial<FeaturePoint>) => void;
  onDeletePoint: (id: string) => void;
  viewAction: 'zoomIn' | 'zoomOut' | 'reset' | null;
  onViewActionConsumed: () => void;
}

const COLORS = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9', '#fd79a8', '#a29bfe'];

function ViewController({
  viewAction,
  onConsumed,
}: {
  viewAction: 'zoomIn' | 'zoomOut' | 'reset' | null;
  onConsumed: () => void;
}) {
  const controls = useThree((s) => s.controls);
  const prevAction = useRef<string | null>(null);

  if (viewAction && viewAction !== prevAction.current) {
    prevAction.current = viewAction;
    const c = controls as { zoomIn?: () => void; zoomOut?: () => void; reset?: () => void };
    if (c?.zoomIn && viewAction === 'zoomIn') c.zoomIn();
    if (c?.zoomOut && viewAction === 'zoomOut') c.zoomOut();
    if (c?.reset && viewAction === 'reset') c.reset();
    onConsumed();
  }

  return null;
}

const DRAG_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const DRAG_INTERSECT = new THREE.Vector3();

function LoadedModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

function LoadedSTL({ url }: { url: string }) {
  const originalGeometry = useLoader(STLLoader, url);
  const geometryRef = useRef<THREE.BufferGeometry | null>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  useEffect(() => {
    if (!originalGeometry || !meshRef.current) return;

    // geometry clone (원본을 수정하지 않기 위해)
    if (!geometryRef.current) {
      geometryRef.current = originalGeometry.clone();
    }
    const geometry = geometryRef.current;

    // 바운딩 박스 계산
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    if (!box) return;

    // 중심 계산
    const center = new THREE.Vector3();
    box.getCenter(center);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);

    // 중심을 원점으로 이동
    geometry.translate(-center.x, -center.y, -center.z);

    // 적절한 크기로 스케일 (최대 크기가 3이 되도록)
    const scale = maxDim > 0 ? 3 / maxDim : 1;
    meshRef.current.scale.set(scale, scale, scale);

    // 카메라 위치 조정
    const distance = 5;
    camera.position.set(distance, distance, distance);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [originalGeometry, camera]);

  return (
    <mesh ref={meshRef} geometry={geometryRef.current || originalGeometry}>
      <meshStandardMaterial color="#888" />
    </mesh>
  );
}

function LoadedImage({ url }: { url: string }) {
  const texture = useTexture(url);
  return (
    <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[4, 4]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

function PointSphere({
  point,
  isSelected,
  mode,
  onClick,
  onPositionChange,
  onDragStart,
  onDragEnd,
}: {
  point: FeaturePoint;
  isSelected: boolean;
  mode: LabelingMode;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
  onPositionChange?: (id: string, x: number, y: number, z: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const isDraggingRef = useRef(false);
  const didDragRef = useRef(false);
  const { camera, gl } = useThree();

  const raycaster = useRef(new THREE.Raycaster());
  const pointer = useRef(new THREE.Vector2());

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      didDragRef.current = false;
      if (mode === 'select' && isSelected && onPositionChange) {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        isDraggingRef.current = true;
        document.body.style.cursor = 'grabbing';
        onDragStart?.();
      }
    },
    [mode, isSelected, onPositionChange, onDragStart]
  );

  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!isDraggingRef.current || !onPositionChange) return;
      didDragRef.current = true;
      const { clientX, clientY } = e.nativeEvent;
      const rect = gl.domElement.getBoundingClientRect();
      pointer.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.current.setFromCamera(pointer.current, camera);
      if (raycaster.current.ray.intersectPlane(DRAG_PLANE, DRAG_INTERSECT)) {
        onPositionChange(point.id, DRAG_INTERSECT.x, DRAG_INTERSECT.y, DRAG_INTERSECT.z);
      }
    },
    [camera, gl, point.id, onPositionChange]
  );

  const handlePointerUp = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (isDraggingRef.current) {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        isDraggingRef.current = false;
        document.body.style.cursor = 'default';
        onDragEnd?.();
      }
    },
    [onDragEnd]
  );

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      if (didDragRef.current) {
        e.stopPropagation();
        return;
      }
      onClick(e);
    },
    [onClick]
  );

  const canDrag = mode === 'select' && isSelected && !!onPositionChange;

  return (
    <mesh
      ref={meshRef}
      position={[point.x, point.y, point.z]}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerOver={() => {
        document.body.style.cursor = canDrag ? 'grab' : 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
      }}
    >
      <sphereGeometry args={[0.08, 24, 24]} />
      <meshStandardMaterial
        color={point.color}
        emissive={point.color}
        emissiveIntensity={isSelected ? 0.5 : 0.2}
        transparent
        opacity={isSelected ? 1 : 0.9}
      />
    </mesh>
  );
}

const CLICK_MOVE_THRESHOLD_PX = 6;

function AddPointPlane({ onAdd }: { onAdd: (point: THREE.Vector3) => void }) {
  const planeRef = useRef<THREE.Mesh>(null);
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const { clientX: x, clientY: y } = e.nativeEvent;
    pointerDownRef.current = { x, y };
  }, []);

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      const down = pointerDownRef.current;
      pointerDownRef.current = null;
      if (!down) return;
      const { clientX: x, clientY: y } = e.nativeEvent;
      const dx = x - down.x;
      const dy = y - down.y;
      if (dx * dx + dy * dy > CLICK_MOVE_THRESHOLD_PX * CLICK_MOVE_THRESHOLD_PX) {
        return; // 움직였으면 점 찍지 않음
      }
      const point = e.point.clone();
      onAdd(point);
    },
    [onAdd]
  );

  return (
    <mesh
      ref={planeRef}
      position={[0, 0, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      visible={false}
      receiveShadow
    >
      <planeGeometry args={[20, 20]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}

export function Scene3D({
  modelUrl,
  modelType,
  points,
  selectedId,
  mode,
  onAddPoint,
  onSelectPoint,
  onUpdatePoint,
  onDeletePoint,
  viewAction,
  onViewActionConsumed,
}: Scene3DProps) {
  const [isDraggingPoint, setIsDraggingPoint] = useState(false);

  const handleAdd = useCallback(
    (v: THREE.Vector3) => {
      onAddPoint({ x: v.x, y: v.y, z: v.z });
    },
    [onAddPoint]
  );

  const handlePositionChange = useCallback(
    (id: string, x: number, y: number, z: number) => {
      onUpdatePoint(id, { x, y, z });
    },
    [onUpdatePoint]
  );

  return (
    <>
      <ViewController viewAction={viewAction} onConsumed={onViewActionConsumed} />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        enabled={!isDraggingPoint}
      />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
      <directionalLight position={[-5, 5, -5]} intensity={0.3} />

      {/* Loaded 3D model or image */}
      {modelType === 'gltf' && <LoadedModel url={modelUrl} />}
      {modelType === 'stl' && <LoadedSTL url={modelUrl} />}
      {modelType === 'image' && <LoadedImage url={modelUrl} />}

      {/* Grid floor (raycast disabled so add-plane receives clicks in add mode) */}
      <gridHelper args={[10, 10, '#444', '#222']} position={[0, 0, 0]} raycast={() => null} />

      {/* Invisible plane for adding points (click on empty space) */}
      {mode === 'add' && <AddPointPlane onAdd={handleAdd} />}

      {/* Point spheres */}
      {points.map((point) => (
        <PointSphere
          key={point.id}
          point={point}
          isSelected={selectedId === point.id}
          mode={mode}
          onClick={(e) => {
            e.stopPropagation();
            if (mode === 'add') return;
            if (mode === 'select') {
              onSelectPoint(selectedId === point.id ? null : point.id);
            }
            if (mode === 'delete') {
              onDeletePoint(point.id);
            }
          }}
          onPositionChange={handlePositionChange}
          onDragStart={() => setIsDraggingPoint(true)}
          onDragEnd={() => setIsDraggingPoint(false)}
        />
      ))}
    </>
  );
}

export function getNextColor(index: number): string {
  return COLORS[index % COLORS.length];
}
