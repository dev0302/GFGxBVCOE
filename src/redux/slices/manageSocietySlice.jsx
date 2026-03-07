import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  departments: [],
  departmentCounts: {},
  allPeopleList: [],
  hydrated: false,
};

const manageSocietySlice = createSlice({
  name: "manageSociety",
  initialState,
  reducers: {
    setDepartments(state, action) {
      state.departments = action.payload || [];
      state.hydrated = true;
    },
    setDepartmentCounts(state, action) {
      state.departmentCounts = action.payload || {};
      state.hydrated = true;
    },
    setAllPeopleList(state, action) {
      state.allPeopleList = action.payload || [];
      state.hydrated = true;
    },
    resetManageSociety(state) {
      state.departments = [];
      state.departmentCounts = {};
      state.allPeopleList = [];
      state.hydrated = false;
    },
  },
});

export const {
  setDepartments,
  setDepartmentCounts,
  setAllPeopleList,
  resetManageSociety,
} = manageSocietySlice.actions;

export default manageSocietySlice.reducer;

