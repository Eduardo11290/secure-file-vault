import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/client';

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const formData = new URLSearchParams();
      formData.append('username', credentials.email);
      formData.append('password', credentials.password);
      
      const response = await api.post('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response.data);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
        await api.post('/auth/logout');
        return true;
    } catch (err) {
        return rejectWithValue(err.response.data);
    }
  }
);

const initialState = {
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  is2FARequired: false,
  tempToken: null,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      state.isAuthenticated = false;
      state.is2FARequired = false;
      state.tempToken = null;
      state.error = null;
      localStorage.removeItem('token');
    },
    setToken(state, action) {
      state.token = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem('token', action.payload);
    },
    clearError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (action.payload['2fa_required']) {
          state.is2FARequired = true;
          state.tempToken = action.payload.access_token;
        } else {
          state.token = action.payload.access_token;
          state.isAuthenticated = true;
          localStorage.setItem('token', action.payload.access_token);
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.detail || 'Login failed';
      })
      .addCase(logoutUser.fulfilled, (state) => {
          state.token = null;
          state.isAuthenticated = false;
          state.is2FARequired = false;
          state.tempToken = null;
          localStorage.removeItem('token');
      });
  },
});

export const { logout, setToken, clearError } = authSlice.actions;
export default authSlice.reducer;
