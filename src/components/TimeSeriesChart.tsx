import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type BarShapeProps,
  type TooltipContentProps,
} from 'recharts';
import { formatCount } from './format.ts';
import {
  tooltipLines,
  yearLabel,
  yearTicks,
  type TimeSeriesMode,
  type TimeSeriesPoint,
} from './timeSeries.ts';
import styles from './TimeSeriesChart.module.css';

export type { TimeSeriesMode, TimeSeriesPoint };

// Only `src/components/*Chart.tsx` files import `recharts`, so the chart library can be swapped without touching
// anything else.

export interface TimeSeriesChartProps {
  /** Accessible name of the chart's SVG. */
  title: string;
  points: readonly TimeSeriesPoint[];
  /** `bars`: one column per point; `line`: a line without dots or fill. */
  mode: TimeSeriesMode;
}

// Recharts sizes in px; derive them from the root font size so the chart follows the user's text size.
function remToPx(rem: number): number {
  const root =
    typeof document === 'undefined'
      ? NaN
      : parseFloat(getComputedStyle(document.documentElement).fontSize);
  return rem * (Number.isFinite(root) ? root : 16);
}

const BAR_COLOR = 'var(--color-chart-bar)';
const TEXT_COLOR = 'var(--color-text-muted)';
const GRID_COLOR = 'var(--color-border)';
const SURFACE_COLOR = 'var(--color-surface)';

function PointTooltip({ active, payload }: TooltipContentProps) {
  const point = active ? (payload[0]?.payload as TimeSeriesPoint | undefined) : undefined;
  if (point === undefined) return null;
  const [label, value] = tooltipLines(point);
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      <p>{value}</p>
    </div>
  );
}

function barShape(props: BarShapeProps) {
  const point = props.payload as TimeSeriesPoint | undefined;
  if (point?.value == null) return <g />;
  return point.partial === true ? (
    <Rectangle {...props} fill={SURFACE_COLOR} stroke={BAR_COLOR} strokeWidth={1.5} />
  ) : (
    <Rectangle {...props} fill={BAR_COLOR} />
  );
}

// One series over time, in one neutral color: monthly columns or the cumulative line. Year ticks on the X axis, at
// most 4 Y ticks, no legend. Tapping shows the point's label and value; nothing depends on hover. No animation.
export function TimeSeriesChart({ title, points, mode }: TimeSeriesChartProps) {
  const [width, setWidth] = useState(0);
  const fontSize = remToPx(0.875);
  // Fits "80,000".
  const yAxisWidth = remToPx(3.5);
  // A year label is about four digits wide; ticks are centered on their point.
  const labelWidth = 4 * fontSize * 0.65 + fontSize;
  const slotWidth = (width - yAxisWidth) / Math.max(points.length, 1);
  const minGap = slotWidth > 0 ? Math.ceil(labelWidth / slotWidth) : Infinity;
  const data = points as TimeSeriesPoint[];
  const tick = { fill: TEXT_COLOR, fontSize };

  const xAxis = (
    <XAxis
      dataKey="key"
      ticks={yearTicks(
        points.map((p) => p.key),
        minGap,
      )}
      interval={0}
      tickFormatter={yearLabel}
      tick={tick}
      tickLine={false}
      axisLine={{ stroke: GRID_COLOR }}
    />
  );
  const yAxis = (
    <YAxis
      width={yAxisWidth}
      tickCount={4}
      interval={0}
      allowDecimals={false}
      domain={[(min: number) => Math.min(0, min), 'auto']}
      tickFormatter={(value: number) => formatCount(value)}
      tick={tick}
      tickLine={false}
      axisLine={false}
    />
  );
  const grid = <CartesianGrid vertical={false} stroke={GRID_COLOR} />;
  const tooltip = (
    <Tooltip
      trigger="click"
      cursor={mode === 'bars' ? { fill: GRID_COLOR, fillOpacity: 0.5 } : { stroke: GRID_COLOR }}
      isAnimationActive={false}
      content={(props) => <PointTooltip {...props} />}
    />
  );
  const margin = { top: fontSize / 2, right: fontSize / 2, bottom: 0, left: 0 };

  return (
    <ResponsiveContainer width="100%" height="100%" onResize={(w) => setWidth(w)}>
      {mode === 'bars' ? (
        <BarChart data={data} title={title} margin={margin} barCategoryGap="15%">
          {grid}
          {xAxis}
          {yAxis}
          {tooltip}
          <Bar dataKey="value" isAnimationActive={false} shape={barShape} />
        </BarChart>
      ) : (
        <LineChart data={data} title={title} margin={margin}>
          {grid}
          {xAxis}
          {yAxis}
          {tooltip}
          <Line
            dataKey="value"
            type="linear"
            stroke={BAR_COLOR}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: BAR_COLOR, stroke: SURFACE_COLOR }}
            isAnimationActive={false}
          />
        </LineChart>
      )}
    </ResponsiveContainer>
  );
}
