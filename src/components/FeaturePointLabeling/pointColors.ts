export const POINT_COLORS = [
  '#ff6b6b',
  '#4ecdc4',
  '#45b7d1',
  '#96ceb4',
  '#ffeaa7',
  '#dfe6e9',
  '#fd79a8',
  '#a29bfe',
];

export function getNextColor(index: number): string {
  return POINT_COLORS[index % POINT_COLORS.length];
}
