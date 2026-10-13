import type { ViewDefinition } from '../view.ts';
import { GazaDemographicsView } from './GazaDemographicsView.tsx';

// Gaza demographics view: composes `useDataset()` with shared components for the Killed in Gaza dataset.
export { GazaDemographicsView };

export const view: ViewDefinition = {
  id: 'killed-in-gaza',
  label: 'Gaza demographics',
  title: 'Gaza demographics',
  Component: GazaDemographicsView,
};
