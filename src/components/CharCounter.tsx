interface CharCounterProps {
  count: number;
  min: number;
  max: number;
}

export const CharCounter = ({ count, min, max }: CharCounterProps) => {
  const isValid = count >= min && count <= max;
  const isUnderMin = count < min;
  const isOverMax = count > max;

  return (
    <div className="text-sm" aria-live="polite">
      <span className={`font-medium ${isValid ? "text-green-400" : isUnderMin ? "text-amber-400" : "text-red-400"}`}>
        {count.toLocaleString()}
      </span>
      <span className="text-white/70">
        {" "}
        znaków (wymagane: {min.toLocaleString()}-{max.toLocaleString()})
      </span>
      {isUnderMin && (
        <span className="text-amber-400 ml-2">Potrzebujesz jeszcze {(min - count).toLocaleString()} znaków</span>
      )}
      {isOverMax && <span className="text-red-400 ml-2">Usuń {(count - max).toLocaleString()} znaków</span>}
    </div>
  );
};
