export type FileModelType = 'gltf' | 'stl' | 'image';

interface FilePickerProps {
  onFileSelect: (file: File, url: string, type: FileModelType) => void;
}

const ACCEPT_3D = '.glb,.gltf,.stl';
const ACCEPT_IMAGE = '.jpg,.jpeg,.png,.webp';
const ACCEPT = `${ACCEPT_3D},${ACCEPT_IMAGE}`;

function getFileType(file: File): FileModelType | null {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (['glb', 'gltf'].includes(ext ?? '')) return 'gltf';
  if (ext === 'stl') return 'stl';
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext ?? '')) return 'image';
  return null;
}

export function FilePicker({ onFileSelect }: FilePickerProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const type = getFileType(file);
    if (!type) {
      alert('지원 형식: .glb, .gltf, .stl, .jpg, .png, .webp');
      return;
    }
    const url = URL.createObjectURL(file);
    onFileSelect(file, url, type);
    e.target.value = '';
  };

  return (
    <div className="file-picker">
      <div className="file-picker-card">
        <h2>3D / 이미지 파일 선택</h2>
        <p className="file-picker-desc">
          Feature Point 라벨링을 위해 3D 모델(.glb, .gltf, .stl) 또는 이미지(.jpg, .png)를 선택하세요.
        </p>
        <label className="file-picker-label">
          <input
            type="file"
            accept={ACCEPT}
            onChange={handleChange}
            className="file-picker-input"
          />
          <span className="file-picker-button">파일 선택</span>
        </label>
      </div>
    </div>
  );
}
