// Dispatcher: routes calls to the real backend when VITE_API_URL is set,
// otherwise falls back to the in-app mock so the preview keeps working.
import * as mock from "./mockApi";
import * as backend from "./backendApi";

const useBackend = Boolean(backend.API_URL);

export const isBackendEnabled = useBackend;

export const uploadDataset = useBackend ? backend.uploadDataset : mock.uploadDataset;
export const listDatasets = useBackend ? backend.listDatasets : mock.listDatasets;
export const getDataset = useBackend ? backend.getDataset : mock.getDataset;
export const deleteDataset = useBackend ? backend.deleteDataset : mock.deleteDataset;

export const generateReport = useBackend ? backend.generateReport : mock.generateReport;
export const getReportByDataset = useBackend ? backend.getReportByDataset : mock.getReportByDataset;
export const chatWithReport = useBackend ? backend.chatWithReport : mock.chatWithReport;

export const downloadReportPdf = useBackend ? backend.downloadReportPdf : (reportId: string) =>
  mock.downloadReportPdf?.(reportId) ?? Promise.resolve();



export const startTraining = useBackend ? backend.startTraining : mock.startTraining;
export const subscribeJob = useBackend ? backend.subscribeJob : mock.subscribeJob;
export const getJob = useBackend ? backend.getJob : mock.getJob;
export const getJobsByDataset = useBackend ? backend.getJobsByDataset : mock.getJobsByDataset;

// Auth: only meaningful with backend; mocks resolve instantly.
export async function login(email: string, password: string) {
  if (useBackend) return backend.login(email, password);
  return { id: "mock", email };
}
export async function signup(email: string, password: string) {
  if (useBackend) return backend.signup(email, password);
  return { id: "mock", email };
}
export function logout() {
  if (useBackend) backend.logout();
}
