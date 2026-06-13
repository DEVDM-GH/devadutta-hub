interface SpinnerProps {
  size?: number;
  color?: string;
}

// Pure spinner — no navigation dependency. Drop anywhere for a loading state.
export function Spinner({ size = 32, color = "white" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      style={{
        display: "block",
        width: size,
        height: size,
        borderRadius: "50%",
        border: `2px solid ${color}30`,
        borderTopColor: color,
        animation: "spin 0.7s linear infinite",
      }}
    />
  );
}
