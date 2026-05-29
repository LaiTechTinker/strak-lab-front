import {
  store,
  uid,
  type ColumnMeta,
  type Dataset,
  type Report,
  type TrainingJob,
  type TrainingResults,
} from "./store";


const BASE_URL = "http://127.0.0.1:5000/api"; // adjust if needed

export async function listDatasets(): Promise<Dataset[]> {
  const res = await fetch(`${BASE_URL}/get_user_data`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  const data = await res.json();

  return data.map((d: any) => ({
    id: d.id,
    name: d.filename,
    rows: [], // placeholder for now
    columns: [], // placeholder
    createdAt: new Date(d.created_at).getTime(),
  }));
}

export async function uploadDataset(file: File): Promise<Dataset> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/db_upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: formData,
  });

  const data = await res.json();

  return {
    id: data.dataset_id,
    name: file.name,
    rows: [],
    columns: [],
    createdAt: Date.now(),
  };
}
export async function deleteDataset(id: string): Promise<void> {
  await fetch(`${BASE_URL}/data/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
}