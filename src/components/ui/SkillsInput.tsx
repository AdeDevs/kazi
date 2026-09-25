import React, { useState } from 'react';
import { X } from 'lucide-react';
import { LIMITS } from '../../lib/inputRules';

interface SkillsInputProps {
  id: string;
  value: string[];
  onChange: (skills: string[]) => void;
}

const cleanSkill = (raw: string) =>
  raw.replace(/[^\p{L}\p{M}\d\s&/+.'’-]/gu, '').replace(/\s{2,}/g, ' ').trim().slice(0, LIMITS.skill);

/**
 * Skills as chips: type one and press Enter (or comma) to add it; × removes it. Duplicates are
 * ignored case-insensitively and the list is capped, so the saved array is always tidy.
 */
export const SkillsInput: React.FC<SkillsInputProps> = ({ id, value, onChange }) => {
  const [draft, setDraft] = useState('');
  const full = value.length >= LIMITS.skillsCount;

  const add = (raw: string) => {
    const skill = cleanSkill(raw);
    if (!skill || full) return;
    if (value.some(s => s.toLowerCase() === skill.toLowerCase())) return;
    onChange([...value, skill]);
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-1.5 focus-within:ring-2 focus-within:ring-navy-500/50">
      <div className="flex flex-wrap gap-1.5">
        {value.map(skill => (
          <span key={skill} className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200">
            {skill}
            <button
              type="button"
              onClick={() => onChange(value.filter(s => s !== skill))}
              aria-label={`Remove ${skill}`}
              className="p-0.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          type="text"
          value={draft}
          disabled={full}
          enterKeyHint="done"
          maxLength={LIMITS.skill}
          onChange={(e) => {
            const next = e.target.value;
            if (next.includes(',')) {
              next.split(',').slice(0, -1).forEach(add);
              setDraft(next.split(',').pop() || '');
            } else {
              setDraft(next);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add(draft);
              setDraft('');
            } else if (e.key === 'Backspace' && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => { add(draft); setDraft(''); }}
          placeholder={full ? `Up to ${LIMITS.skillsCount} skills` : value.length ? 'Add another' : 'e.g. Wiring, then press Enter'}
          className="flex-1 min-w-[8rem] px-2 py-1.5 bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
};
