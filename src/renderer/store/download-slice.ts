import { createSlice } from '@reduxjs/toolkit';

export interface Download {
  id: string;
  filename: string;
  url: string;
  totalBytes: number;
  receivedBytes: number;
  state: 'progressing' | 'completed' | 'cancelled' | 'interrupted' | 'paused';
  savePath: string;
  startTime: number;
  speed: number;
  mimeType?: string;
  isPaused: boolean;
}

interface DownloadState {
  downloads: Download[];
  activeDownloadsCount: number;
}

const initialState: DownloadState = {
  downloads: [],
  activeDownloadsCount: 0,
};

const downloadSlice = createSlice({
  name: 'downloads',
  initialState,
  reducers: {
    addDownload(state, action) {
      state.downloads.unshift(action.payload);
      state.activeDownloadsCount = state.downloads.filter(
        d => d.state === 'progressing' || d.state === 'paused'
      ).length;
    },
    updateDownload(state, action) {
      const index = state.downloads.findIndex(d => d.id === action.payload.id);
      if (index !== -1) {
        state.downloads[index] = action.payload;
      }
      state.activeDownloadsCount = state.downloads.filter(
        d => d.state === 'progressing' || d.state === 'paused'
      ).length;
    },
    removeDownload(state, action) {
      state.downloads = state.downloads.filter(d => d.id !== action.payload.id);
      state.activeDownloadsCount = state.downloads.filter(
        d => d.state === 'progressing' || d.state === 'paused'
      ).length;
    },
    clearCompletedDownloads(state) {
      state.downloads = state.downloads.filter(
        d => d.state === 'progressing' || d.state === 'paused'
      );
      state.activeDownloadsCount = state.downloads.length;
    },
    clearAllDownloads(state) {
      state.downloads = [];
      state.activeDownloadsCount = 0;
    },
  },
});

export const downloadActions = downloadSlice.actions;
export default downloadSlice;
