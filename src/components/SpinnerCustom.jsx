import { Loader } from "react-feather";

function Spinner({ className = "", ...props }) {
  return (
    <Loader
      role="status"
      aria-label="Loading"
      className={`size-4 animate-spin ${className}`}
      {...props}
    />
  );
}

export function SpinnerCustom() {
  return (
    <div className="flex items-center gap-4">
      <Spinner />
    </div>
  );
}

export default SpinnerCustom;
