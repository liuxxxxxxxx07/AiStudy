interface DifficultySelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const difficulties = [
  { label: 'Easy', value: 'easy', color: 'text-green-500' },
  { label: 'Medium', value: 'medium', color: 'text-yellow-500' },
  { label: 'Hard', value: 'hard', color: 'text-red-500' },
];

export default function DifficultySelector({ value, onChange }: DifficultySelectorProps) {
  return (
    <div className="flex items-center gap-1">
      {difficulties.map((d) => {
        const selected = value === d.value;
        return (
          <button
            key={d.value}
            type="button"
            onClick={() => onChange(d.value)}
            className={`rounded-md px-2 py-0.5 text-sm font-medium transition-colors ${
              selected ? 'bg-input-bg text-white' : `${d.color} bg-transparent`
            }`}
          >
            {d.label}
          </button>
        );
      })}
    </div>
  );
}