export function RailTooltip({ label }: { label: string }) {
  return (
    <span className="rail-tooltip" role="tooltip">
      {label}
    </span>
  );
}
