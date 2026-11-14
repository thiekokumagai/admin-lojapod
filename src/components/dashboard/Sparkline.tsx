import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface SparklineProps {
  values: number[];
  /** Cor CSS da linha (ex.: "hsl(var(--primary))" ou "#059669"). */
  color: string;
  /** Identificador único do gradiente (vários minigráficos na mesma tela). */
  id: string;
}

/** Minigráfico de tendência, sem eixos nem tooltip. Some se não há variação para mostrar. */
export function Sparkline({ values, color, id }: SparklineProps) {
  if (values.length < 2 || values.every((v) => v === 0)) return null;
  const data = values.map((v, i) => ({ i, v }));
  return (
    <div className="h-12 w-full" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            fill={`url(#spark-${id})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
