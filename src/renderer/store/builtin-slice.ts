import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { BuiltinAppId } from '../builtin/types';

type BuiltinState = {
  /** Modal builtins that stay in the dock until explicitly closed. */
  openModalIds: BuiltinAppId[];
  /** Currently visible modal panel; null = open but hidden to dock. */
  activeModalId: BuiltinAppId | null;
};

const initialState: BuiltinState = {
  openModalIds: [],
  activeModalId: null,
};

const builtinSlice = createSlice({
  name: 'builtin',
  initialState,
  reducers: {
    openModal(state, action: PayloadAction<BuiltinAppId>) {
      const id = action.payload;
      if (!state.openModalIds.includes(id)) {
        state.openModalIds.push(id);
      }
      state.activeModalId = id;
    },
    /** Hide panel but keep dock icon (e.g. backdrop click). */
    hideModal(state) {
      state.activeModalId = null;
    },
    /** Fully close one modal and drop its dock icon. */
    closeModal(state, action: PayloadAction<BuiltinAppId | undefined>) {
      const id = action.payload ?? state.activeModalId;
      if (id) {
        state.openModalIds = state.openModalIds.filter((x) => x !== id);
      }
      if (!id || state.activeModalId === id) {
        state.activeModalId = null;
      }
    },
    /** Close every modal overlay (e.g. workspace switch). */
    closeAllModals(state) {
      state.openModalIds = [];
      state.activeModalId = null;
    },
    toggleModal(state, action: PayloadAction<BuiltinAppId>) {
      const id = action.payload;
      if (state.activeModalId === id) {
        state.activeModalId = null;
        return;
      }
      if (!state.openModalIds.includes(id)) {
        state.openModalIds.push(id);
      }
      state.activeModalId = id;
    },
  },
});

export const builtinActions = builtinSlice.actions;
export default builtinSlice;
