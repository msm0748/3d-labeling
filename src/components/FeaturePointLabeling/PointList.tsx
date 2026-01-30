import type { FeaturePoint } from '../../types/featurePoint';

interface PointListProps {
  points: FeaturePoint[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, updates: Partial<FeaturePoint>) => void;
  onDelete: (id: string) => void;
}

export function PointList({
  points,
  selectedId,
  onSelect,
  onUpdate,
  onDelete,
}: PointListProps) {
  return (
    <div className="point-list">
      <div className="point-list-header">
        <h3>Feature Points ({points.length})</h3>
      </div>
      <ul className="point-list-items">
        {points.map((point) => (
          <li
            key={point.id}
            className={`point-list-item ${selectedId === point.id ? 'selected' : ''}`}
          >
            <div className="point-item-main">
              <button
                type="button"
                className="point-item-select"
                onClick={() => onSelect(selectedId === point.id ? null : point.id)}
              >
                <span
                  className="point-color-dot"
                  style={{ backgroundColor: point.color }}
                />
                <span className="point-label">{point.label || `Point ${point.id.slice(0, 6)}`}</span>
              </button>
              <div className="point-coords">
                ({point.x.toFixed(2)}, {point.y.toFixed(2)}, {point.z.toFixed(2)})
              </div>
            </div>
            <div className="point-item-actions">
              <input
                type="text"
                value={point.label}
                onChange={(e) => onUpdate(point.id, { label: e.target.value })}
                onClick={(e) => e.stopPropagation()}
                placeholder="라벨"
                className="point-label-input"
              />
              <button
                type="button"
                className="point-delete-btn"
                onClick={() => onDelete(point.id)}
                title="삭제"
              >
                ✕
              </button>
            </div>
          </li>
        ))}
      </ul>
      {points.length === 0 && (
        <div className="point-list-empty">추가 모드에서 3D 뷰를 클릭해 점을 추가하세요.</div>
      )}
    </div>
  );
}
