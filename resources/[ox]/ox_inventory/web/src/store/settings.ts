import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    data : {}
}

const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: {
        updateSettings: (state:any, action:any) => {
            state.data = action.payload;
        },
    }
})

export const { updateSettings } = settingsSlice.actions;
export default settingsSlice.reducer;