import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks for route operations
export const calculateRoute = createAsyncThunk(
  'routes/calculateRoute',
  async (routeData, { rejectWithValue }) => {
    try {
      const response = await api.post('/routes/calculate', routeData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to calculate route');
    }
  }
);

export const fetchRouteHistory = createAsyncThunk(
  'routes/fetchHistory',
  async ({ page = 1, limit = 20, routeType } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ page, limit });
      if (routeType) params.append('routeType', routeType);
      
      const response = await api.get(`/routes/history?${params}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch route history');
    }
  }
);

export const fetchSavedRoutes = createAsyncThunk(
  'routes/fetchSaved',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/routes/saved');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch saved routes');
    }
  }
);

export const saveRoute = createAsyncThunk(
  'routes/saveRoute',
  async ({ routeId, name }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/routes/${routeId}/save`, { name });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to save route');
    }
  }
);

export const fetchPopularRoutes = createAsyncThunk(
  'routes/fetchPopular',
  async ({ lat, lng, radius = 10 }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/routes/popular?lat=${lat}&lng=${lng}&radius=${radius}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch popular routes');
    }
  }
);

const initialState = {
  currentRoutes: null, // { fastest: Route, safest: Route }
  routeHistory: [],
  savedRoutes: [],
  popularRoutes: [],
  nearbyRoutes: [],
  currentRouteType: 'fastest',
  isCalculating: false,
  isLoading: false,
  error: null,
  calculationMetrics: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  }
};

const routeSlice = createSlice({
  name: 'routes',
  initialState,
  reducers: {
    setCurrentRouteType: (state, action) => {
      state.currentRouteType = action.payload;
    },
    clearCurrentRoutes: (state) => {
      state.currentRoutes = null;
      state.calculationMetrics = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateRouteInHistory: (state, action) => {
      const { routeId, updates } = action.payload;
      const routeIndex = state.routeHistory.findIndex(route => route._id === routeId);
      if (routeIndex !== -1) {
        state.routeHistory[routeIndex] = { ...state.routeHistory[routeIndex], ...updates };
      }
    },
    addRouteToSaved: (state, action) => {
      const route = action.payload;
      const existingIndex = state.savedRoutes.findIndex(r => r._id === route._id);
      if (existingIndex === -1) {
        state.savedRoutes.unshift(route);
      }
    },
    removeRouteFromSaved: (state, action) => {
      const routeId = action.payload;
      state.savedRoutes = state.savedRoutes.filter(route => route._id !== routeId);
    }
  },
  extraReducers: (builder) => {
    builder
      // Calculate Route
      .addCase(calculateRoute.pending, (state) => {
        state.isCalculating = true;
        state.error = null;
      })
      .addCase(calculateRoute.fulfilled, (state, action) => {
        state.isCalculating = false;
        state.currentRoutes = action.payload.routes;
        state.calculationMetrics = {
          calculationTime: action.payload.calculationTime,
          unsafeZonesCount: action.payload.unsafeZonesCount,
          activeHazardsCount: action.payload.activeHazardsCount,
          routeId: action.payload.routeId
        };
        state.error = null;
      })
      .addCase(calculateRoute.rejected, (state, action) => {
        state.isCalculating = false;
        state.error = action.payload;
      })
      
      // Fetch Route History
      .addCase(fetchRouteHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRouteHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.routeHistory = action.payload.routes;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchRouteHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Saved Routes
      .addCase(fetchSavedRoutes.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchSavedRoutes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.savedRoutes = action.payload.routes;
      })
      .addCase(fetchSavedRoutes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Save Route
      .addCase(saveRoute.fulfilled, (state, action) => {
        const { route } = action.payload;
        // Update the route in history if it exists
        const historyIndex = state.routeHistory.findIndex(r => r._id === route.id);
        if (historyIndex !== -1) {
          state.routeHistory[historyIndex].isSaved = route.isSaved;
          state.routeHistory[historyIndex].name = route.name;
        }
        
        // Add to or remove from saved routes
        if (route.isSaved) {
          const existingIndex = state.savedRoutes.findIndex(r => r._id === route.id);
          if (existingIndex === -1) {
            // Add to saved routes (you'll need the full route object from history)
            const fullRoute = state.routeHistory.find(r => r._id === route.id);
            if (fullRoute) {
              state.savedRoutes.unshift(fullRoute);
            }
          }
        } else {
          state.savedRoutes = state.savedRoutes.filter(r => r._id !== route.id);
        }
      })
      
      // Fetch Popular Routes
      .addCase(fetchPopularRoutes.fulfilled, (state, action) => {
        state.popularRoutes = action.payload.popularRoutes;
        state.nearbyRoutes = action.payload.nearbyRoutes;
      });
  },
});

export const {
  setCurrentRouteType,
  clearCurrentRoutes,
  clearError,
  updateRouteInHistory,
  addRouteToSaved,
  removeRouteFromSaved
} = routeSlice.actions;

export default routeSlice.reducer;