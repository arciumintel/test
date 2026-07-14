/**
 * Soft depth layers for page title bands:
 * radial spotlight + ultra-faint computational flow field.
 */
export function PageHeaderAtmosphere() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <div className="page-header-spotlight absolute inset-0" />
      <svg
        className="page-header-flow absolute inset-0 size-full text-foreground"
        viewBox="0 0 1200 280"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M-20 160 C120 40, 280 240, 440 130 S720 40, 900 150 S1100 220, 1220 90"
          stroke="currentColor"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M-20 200 C140 90, 300 250, 480 170 S760 80, 940 180 S1120 240, 1220 120"
          stroke="currentColor"
          strokeWidth="0.75"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M-20 100 C160 200, 320 20, 500 110 S780 210, 960 90 S1140 40, 1220 160"
          stroke="currentColor"
          strokeWidth="0.75"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M-20 240 C180 180, 340 260, 520 200 S800 140, 980 220 S1160 260, 1220 180"
          stroke="currentColor"
          strokeWidth="0.6"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M-20 60 C200 120, 360 10, 540 70 S820 150, 1000 50 S1180 10, 1220 80"
          stroke="currentColor"
          strokeWidth="0.6"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M-20 130 C100 180, 260 80, 420 150 S700 220, 880 120 S1080 80, 1220 200"
          stroke="currentColor"
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
