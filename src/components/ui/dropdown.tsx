import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "./utils";

export type DropdownOption = {
  label: string;
  value: string;
};

type DropdownProps = {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function Dropdown({
  options,
  value,
  onChange,
  placeholder = "Chọn một mục",
  className,
}: DropdownProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const selectedOption = options.find((option) => option.value === value) ?? null;

  const filteredOptions = useMemo(() => {
    return options;
  }, [options]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setHighlightedIndex(0);
  }, [isOpen]);

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement | HTMLInputElement>) => {
    if (!isOpen && (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      setIsOpen(true);
      return;
    }

    if (!isOpen) return;

    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((current) => Math.min(current + 1, Math.max(filteredOptions.length - 1, 0)));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === "Enter" && filteredOptions[highlightedIndex]) {
      event.preventDefault();
      handleSelect(filteredOptions[highlightedIndex].value);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-lg border px-4 text-left text-sm text-slate-800 shadow-sm transition-all",
          "focus:outline-none focus:ring-4",
          isOpen ? "bg-white" : "hover:border-slate-400"
        )}
        style={{
          borderColor: isOpen ? "#FF3300" : "rgba(255, 51, 0, 0.2)",
          backgroundColor: isOpen ? "#ffffff" : "#fff5f2",
          boxShadow: isOpen ? "0 0 0 4px rgba(255, 51, 0, 0.08)" : undefined,
        }}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={selectedOption ? "text-slate-800" : "text-slate-500"}>
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown
          size={18}
          className={cn("shrink-0 transition-transform duration-200", isOpen && "rotate-180")}
          style={{ color: isOpen ? "#FF3300" : "#6b7280" }}
        />
      </button>
 
      {isOpen && (
        <div
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 origin-top rounded-xl border bg-white shadow-xl animate-in fade-in-0 zoom-in-95 duration-150"
          style={{
            borderColor: "rgba(255, 51, 0, 0.16)",
            boxShadow: "0 24px 48px -28px rgba(255, 51, 0, 0.15)",
          }}
        >
          <div className="max-h-60 overflow-auto p-2">
            {filteredOptions.length === 0 ? (
              <div className="rounded-lg px-3 py-2 text-sm text-slate-500">Không có lựa chọn.</div>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = option.value === value;
                const isHighlighted = index === highlightedIndex;
 
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={cn(
                       "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                       "text-slate-700",
                       isSelected && "font-medium"
                    )}
                    style={{
                      backgroundColor: isHighlighted ? "rgba(255, 51, 0, 0.08)" : "#ffffff",
                      color: isHighlighted ? "#FF3300" : undefined,
                    }}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span>{option.label}</span>
                    {isSelected && <Check size={16} className="shrink-0" style={{ color: "#FF3300" }} />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

