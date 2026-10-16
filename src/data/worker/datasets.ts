// Dataset registry shared by the worker and `useDataset()`. A new dataset adds an id, its data type, and a loader.
import type { SourceResult } from '../sources/fetchJson.ts';
import { loadGazaDailyReports, type GazaDailyReportsData } from './gazaDailyReports.ts';
import { loadGazaDemographics, type GazaDemographicsData } from './gazaDemographics.ts';

export interface DatasetData {
  'gaza-demographics': GazaDemographicsData;
  'gaza-daily-reports': GazaDailyReportsData;
}

export type DatasetId = keyof DatasetData;

export const loaders: { [K in DatasetId]: () => Promise<SourceResult<DatasetData[K]>> } = {
  'gaza-demographics': () => loadGazaDemographics(),
  'gaza-daily-reports': () => loadGazaDailyReports(),
};

/** Main thread → worker. */
export interface DatasetRequest {
  dataset: DatasetId;
}

/** Worker → main thread. Plain data only (structured-clone safe). */
export interface DatasetResponse<K extends DatasetId = DatasetId> {
  dataset: K;
  result: SourceResult<DatasetData[K]>;
}
