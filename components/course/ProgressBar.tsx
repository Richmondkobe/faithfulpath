export default function ProgressBar({
  done,
  total,
  label,
}: {
  done: number;
  total: number;
  label?: string;
}) {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between text-[13px] uppercase tracking-[0.12em] text-gold-text font-medium">
        <span>{label ?? "Progress"}</span>
        <span>
          {done} of {total} complete
        </span>
      </div>
      <div
        className="mt-2 h-1.5 w-full overflow-hidden rounded-xl bg-line"
        role="progressbar"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={label ?? "Course progress"}
      >
        <div
          className="h-full bg-gold-text transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
