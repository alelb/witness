import type { ViewDefinition } from '../view.ts';
import { GazaDailyReportsView } from './GazaDailyReportsView.tsx';

// Gaza over time view: composes `useDataset()` with shared components for the Gaza daily reports dataset.
export { GazaDailyReportsView };

export const view: ViewDefinition = {
  id: 'gaza-daily-reports',
  label: 'Gaza over time',
  title: 'Gaza over time',
  datasets: 'Gaza daily reports',
  Component: GazaDailyReportsView,
};
