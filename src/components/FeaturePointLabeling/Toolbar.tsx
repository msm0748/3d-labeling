import type { LabelingMode } from '../../types/featurePoint';

interface ToolbarProps {
  mode: LabelingMode;
  onModeChange: (mode: LabelingMode) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export function Toolbar({
  mode,
  onModeChange,
  onZoomIn,
  onZoomOut,
  onReset,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <span className="toolbar-label">뷰</span>
        <button type="button" onClick={onZoomIn} title="확대">
          ⊕ 확대
        </button>
        <button type="button" onClick={onZoomOut} title="축소">
          ⊖ 축소
        </button>
        <button type="button" onClick={onReset} title="뷰 초기화">
          ⟲ 초기화
        </button>
      </div>
      <div className="toolbar-divider" />
      <div className="toolbar-section">
        <span className="toolbar-label">모드</span>
        <button
          type="button"
          className={mode === 'add' ? 'active' : ''}
          onClick={() => onModeChange('add')}
          title="점 추가"
        >
          ➕ 추가
        </button>
        <button
          type="button"
          className={mode === 'select' ? 'active' : ''}
          onClick={() => onModeChange('select')}
          title="점 선택/편집"
        >
          ✎ 선택
        </button>
        <button
          type="button"
          className={mode === 'delete' ? 'active' : ''}
          onClick={() => onModeChange('delete')}
          title="점 삭제"
        >
          ✕ 삭제
        </button>
      </div>
    </div>
  );
}
