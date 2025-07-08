import { type Receipt } from "@shared/schema";

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export const googleDrive = {
  async uploadReceipt(
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<Receipt> {
    const formData = new FormData();
    formData.append('receipt', file);

    const response = await fetch('/api/receipts/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    return await response.json();
  },

  async getReceipts(): Promise<Receipt[]> {
    const response = await fetch('/api/receipts');
    if (!response.ok) {
      throw new Error('Failed to fetch receipts');
    }
    return await response.json();
  },

  async getRecentReceipts(limit: number = 20): Promise<Receipt[]> {
    const response = await fetch(`/api/receipts/recent?limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch recent receipts');
    }
    return await response.json();
  },

  async getReceipt(id: number): Promise<Receipt> {
    const response = await fetch(`/api/receipts/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch receipt');
    }
    return await response.json();
  },

  async deleteReceipt(id: number): Promise<void> {
    const response = await fetch(`/api/receipts/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete receipt');
    }
  },
};
