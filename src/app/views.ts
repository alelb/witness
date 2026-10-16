import * as gazaDailyReports from '../features/gaza-daily-reports';
import * as gazaDemographics from '../features/gaza-demographics';
import type { ViewDefinition } from '../features/view.ts';

// Registered views, in menu order. Registering a view is one line here; the first entry is the default view.
export const views: readonly ViewDefinition[] = [gazaDemographics.view, gazaDailyReports.view];
