import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import routeSlice from './slices/routeSlice';
import mapSlice from './slices/mapSlice';
import hazardSlice from './slices/hazardSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    routes: routeSlice,
    map: mapSlice,
    hazards: hazardSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});