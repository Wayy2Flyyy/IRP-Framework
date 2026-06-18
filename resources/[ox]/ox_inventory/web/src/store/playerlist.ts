import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    data : {
        playerlist: [],
        slot: {},
        count: 0,
    }
}

const playerSlice = createSlice({
    name: 'playerlist',
    initialState,
    reducers: {
        updatePlayerList: (state:any, action:any) => {
            state.data = action.payload;
        },
        kosonginPlayerlist: (state:any) => {
            state.data.playerlist = [];
        },
    }
})

export const { updatePlayerList, kosonginPlayerlist } = playerSlice.actions;
export default playerSlice.reducer;