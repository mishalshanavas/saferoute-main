import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks for hazard operations
export const fetchActiveHazards = createAsyncThunk(
  'hazards/fetchActive',
  async ({ lat, lng, radius = 10 }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/hazards/active?lat=${lat}&lng=${lng}&radius=${radius}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch hazards');
    }
  }
);

export const reportHazard = createAsyncThunk(
  'hazards/report',
  async (hazardData, { rejectWithValue }) => {
    try {
      const response = await api.post('/hazards/report', hazardData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to report hazard');
    }
  }
);

export const confirmHazard = createAsyncThunk(
  'hazards/confirm',
  async (hazardId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/hazards/${hazardId}/confirm`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to confirm hazard');
    }
  }
);

const initialState = {
  activeHazards: [],
  simulatedHazards: [],
  isLoading: false,
  isReporting: false,
  error: null,
  lastUpdated: null
};

const hazardSlice = createSlice({
  name: 'hazards',
  initialState,
  reducers: {
    addSimulatedHazard: (state, action) => {
      state.simulatedHazards.push({
        ...action.payload,
        id: Date.now(),
        isSimulated: true,
        createdAt: new Date().toISOString()
      });
    },
    removeSimulatedHazard: (state, action) => {
      state.simulatedHazards = state.simulatedHazards.filter(
        hazard => hazard.id !== action.payload
      );
    },
    clearSimulatedHazards: (state) => {
      state.simulatedHazards = [];
    },
    clearError: (state) => {
      state.error = null;
    },
    updateHazardStatus: (state, action) => {
      const { hazardId, status } = action.payload;
      const hazardIndex = state.activeHazards.findIndex(h => h.id === hazardId);
      if (hazardIndex !== -1) {
        state.activeHazards[hazardIndex].status = status;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Active Hazards
      .addCase(fetchActiveHazards.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchActiveHazards.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeHazards = action.payload.hazards;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchActiveHazards.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Report Hazard
      .addCase(reportHazard.pending, (state) => {
        state.isReporting = true;
        state.error = null;
      })
      .addCase(reportHazard.fulfilled, (state, action) => {
        state.isReporting = false;
        state.activeHazards.push(action.payload.hazard);
      })
      .addCase(reportHazard.rejected, (state, action) => {
        state.isReporting = false;
        state.error = action.payload;
      })
      
      // Confirm Hazard
      .addCase(confirmHazard.fulfilled, (state, action) => {
        const hazardIndex = state.activeHazards.findIndex(
          h => h.id === action.payload.hazard.id
        );
        if (hazardIndex !== -1) {
          state.activeHazards[hazardIndex] = action.payload.hazard;
        }
      });
  },
});

export const {
  addSimulatedHazard,
  removeSimulatedHazard,
  clearSimulatedHazards,
  clearError,
  updateHazardStatus
} = hazardSlice.actions;

export default hazardSlice.reducer;