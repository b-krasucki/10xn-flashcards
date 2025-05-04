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
      <span className={`font-medium ${isValid ? "text-green-600" : isUnderMin ? "text-amber-600" : "text-red-600"}`}>
        {count.toLocaleString()}
      </span>
      <span className="text-muted-foreground">
        {" "}
        characters (required: {min.toLocaleString()}-{max.toLocaleString()})
      </span>
      {isUnderMin && <span className="text-amber-600 ml-2">Need {(min - count).toLocaleString()} more characters</span>}
      {isOverMax && <span className="text-red-600 ml-2">Remove {(count - max).toLocaleString()} characters</span>}
    </div>
  );
};
