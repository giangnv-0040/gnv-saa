interface DiamondIconProps {
  className?: string;
}

/**
 * Inline SVG so `fill="currentColor"` inherits the parent's text colour
 * (loading via `<img>` would render the SVG in its own context and
 * `currentColor` would not work).
 */
export function DiamondIcon({ className }: DiamondIconProps) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M16 9H19L14 16M10 9H14L12 17M5 9H8L10 16M15 4H17L19 7H16M11 4H13L14 7H10M7 4H9L8 7H5M6 2L2 8L12 22L22 8L18 2H6Z"
        fill="currentColor"
      />
    </svg>
  );
}
