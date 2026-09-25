interface ChoiceChipsProps<T extends string> {
  value: T | '';
  options: readonly T[];
  onChange: (value: T) => void;
  /** Accessible name for the group. */
  label: string;
  labelledBy?: string;
}

/** Single-choice chips for a short, fixed set of values -- picked, never typed. */
export function ChoiceChips<T extends string>({ value, options, onChange, label, labelledBy }: ChoiceChipsProps<T>) {
  return (
    <div role="radiogroup" aria-label={labelledBy ? undefined : label} aria-labelledby={labelledBy} className="flex flex-wrap gap-1.5">
      {options.map(option => {
        const selected = option === value;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option)}
            className={`px-3 py-1.5 rounded-full border text-xs font-bold cursor-pointer transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/60 ${
              selected
                ? 'bg-navy-800 border-navy-800 text-white dark:bg-navy-600 dark:border-navy-600'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-navy-500/50'
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
