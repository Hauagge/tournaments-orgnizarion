import React from 'react';

type RadioProps = {
  checked?: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  name: string;
};

export function Radio({
  checked = false,
  onCheckedChange,
  label,
  name,
}: RadioProps) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name={name}
        checked={checked}
        onClick={(e) => {
          if (checked) {
            // e.preventDefault();
            onCheckedChange(false);
          }
        }}
        onChange={(e) => {
          if (!checked) {
            onCheckedChange(e.target.checked);
          }
        }}
        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
      />
      <span className="select-none">{label}</span>
    </label>
  );
}
