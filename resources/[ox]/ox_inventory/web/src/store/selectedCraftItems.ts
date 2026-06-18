import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    data : {}
}

const craftItemsSlice = createSlice({
    name: 'craftItems',
    initialState,
    reducers: {
        updateCraftItems: (state:any, action:any) => {
            state.data = action.payload;
        },
        deleteCraftItems: (state:any) => {
            state.data = {};
        }
        
    }
})

export const { updateCraftItems, deleteCraftItems } = craftItemsSlice.actions;
export default craftItemsSlice.reducer;