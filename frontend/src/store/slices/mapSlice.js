import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const initialState = {
  currentLocation: null,
  mapCenter: [9.9312, 76.2673], // Kochi, Kerala default
  mapZoom: 12,
  selectedRoute: null,
  visibleLayers: {
    unsafeZones: true,
    hazards: true,
    traffic: false,
    satellites: false
  },
  mapStyle: 'default' // 'default', 'satellite', 'terrain'
};

const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    setCurrentLocation: (state, action) => {
      state.currentLocation = action.payload;
    },
    setMapCenter: (state, action) => {
      state.mapCenter = action.payload;
    },
    setMapZoom: (state, action) => {
      state.mapZoom = action.payload;
    },
    setSelectedRoute: (state, action) => {
      state.selectedRoute = action.payload;
    },
    toggleLayer: (state, action) => {
      const layer = action.payload;
      state.visibleLayers[layer] = !state.visibleLayers[layer];
    },
    setMapStyle: (state, action) => {
      state.mapStyle = action.payload;
    },
    resetMapView: (state) => {
      state.mapCenter = [9.9312, 76.2673];
      state.mapZoom = 12;
      state.selectedRoute = null;
    }
  }
});

export const {
  setCurrentLocation,
  setMapCenter,
  setMapZoom,
  setSelectedRoute,
  toggleLayer,
  setMapStyle,
  resetMapView
} = mapSlice.actions;

export default mapSlice.reducer;