export interface FeaturePoint {
  id: string;
  x: number;
  y: number;
  z: number;
  label: string;
  color: string;
  createdAt: number;
}

export type LabelingMode = 'add' | 'select' | 'delete';
