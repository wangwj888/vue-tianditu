export function toServiceError(reason: unknown): Error {
  return reason instanceof Error ? reason : new Error(String(reason));
}
export function coordinates(value: string | readonly number[] | undefined | null): number[] {
  const point =
    typeof value === "string"
      ? value
          .trim()
          .split(/[,\s]+/)
          .map(Number)
      : [...(value || [])];
  return point.length >= 2 &&
    point.slice(0, 2).every(Number.isFinite) &&
    Math.abs(point[0]) <= 180 &&
    Math.abs(point[1]) <= 90
    ? point.slice(0, 2)
    : [];
}
export function lineCoordinates(value: string): number[][] {
  return (value || "")
    .split(";")
    .map(coordinates)
    .filter(point => point.length === 2);
}
export function escapeHtml(value: string): string {
  return String(value || "").replace(
    /[&<>"']/g,
    character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!
  );
}
export function pageCapacity(value: number): number {
  return Math.max(1, Math.min(100, Math.floor(Number.isFinite(value) ? value : 10)));
}
export function requestTimeout(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 15000;
}
