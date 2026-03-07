import { createSlice } from "@reduxjs/toolkit";

const USER_STORAGE_KEY = "gfg_user";

function loadUserFromStorage() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveUserToStorage(user) {
  try {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

const initialState = {
  user: loadUserFromStorage(),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action) {
      state.user = action.payload || null;
      saveUserToStorage(state.user);
    },
  },
});

export const { setUser } = authSlice.actions;
export const AUTH_USER_STORAGE_KEY = USER_STORAGE_KEY;

export default authSlice.reducer;

