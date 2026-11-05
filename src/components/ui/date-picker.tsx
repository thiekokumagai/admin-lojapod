import * as React from "react";
import { format, isValid, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * Substituto do <input type="date"> nativo, que quebra o layout no Safari do iPhone.
 * Recebe e devolve a data como string "yyyy-MM-dd" (mesmo formato do input nativo),
 * então pode trocar o input sem mudar o estado nem a API.
 */
export interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

const ISO = "yyyy-MM-dd";

function toDate(value: string): Date | undefined {
  if (!value) return undefined;
  // parse local (não usar new Date("yyyy-MM-dd"), que vira UTC e pode mostrar o dia anterior)
  const d = parse(value, ISO, new Date());
  return isValid(d) ? d : undefined;
}

export function DatePicker({
  value,
  onChange,
  id,
  placeholder = "Selecione",
  required,
  disabled,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = toDate(value);

  return (
    <div className="relative w-full min-w-0">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            style={{ WebkitTapHighlightColor: "transparent" }}
            className={cn(
              "h-10 w-full min-w-0 justify-start gap-2 px-3 text-left font-normal",
              !selected && "text-muted-foreground",
              className,
            )}
          >
            <CalendarIcon className="h-4 w-4 shrink-0 opacity-60" />
            <span className="truncate">{selected ? format(selected, "dd/MM/yyyy") : placeholder}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            locale={ptBR}
            selected={selected}
            defaultMonth={selected}
            onSelect={(d) => {
              onChange(d ? format(d, ISO) : "");
              setOpen(false);
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {required && (
        // mantém a validação nativa de "campo obrigatório" do <form>
        <input
          tabIndex={-1}
          aria-hidden
          required
          value={value}
          onChange={() => {}}
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px w-full opacity-0"
        />
      )}
    </div>
  );
}
