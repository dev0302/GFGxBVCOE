import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice.jsx";
import profileReducer from "./slices/profileSlice.jsx";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
  },
});

export default store;

