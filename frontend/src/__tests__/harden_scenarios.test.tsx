import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';

// Use vi.hoisted to define global mock states on globalThis before module evaluations
vi.hoisted(() => {
  (globalThis as any).mockAuthState = {
    login: vi.fn(),
    isLoading: false,
    error: null as string | null,
    clearError: vi.fn(),
    user: {
      full_name: 'Dr. Swaminathan',
      village: 'Vasco',
      district: 'Goa',
    },
  };

  (globalThis as any).mockGet = vi.fn().mockImplementation((url) => {
    if (url.includes('/weather/current')) {
      return Promise.resolve({
        data: {
          temp: 29,
          feels_like: 32,
          condition: 'Sunny',
          humidity: 50,
          wind: 8,
          uv_index: 4,
          rain_probability: 5,
          location: 'Goa Farm, India',
          soil_moisture: 'Optimal — 55% moisture',
          farming_suitability: 'Excellent for sowing',
          alerts: [],
          forecast: [],
        },
      });
    }
    if (url.includes('/ai/scan-history')) {
      return Promise.resolve({
        data: [
          {
            id: 1,
            disease_name: 'Late Blight',
            detected_object: 'Potato Leaf',
            created_at: '2026-08-01T10:00:00Z',
            confidence: 94.5,
            image_url: 'http://test.com/tomato.jpg',
            is_valid_crop: true,
            severity_level: 'Critical',
          },
        ],
      });
    }
    return Promise.resolve({ data: {} });
  });

  // Mock navigator.geolocation to immediately trigger error callback to force fallback coords
  if (globalThis.navigator) {
    (globalThis.navigator as any).geolocation = {
      getCurrentPosition: vi.fn().mockImplementation((success, error) => {
        if (error) {
          error({ code: 1, message: "User denied Geolocation" });
        }
      }),
    };
  }

  // Mock Date.prototype.toLocaleDateString to be environment-agnostic and prevent JSDOM locale exceptions
  Date.prototype.toLocaleDateString = vi.fn().mockReturnValue('Aug 1, 10:00 AM');
});

// Mock framer-motion as HTML tag strings to naturally propagate all standard HTML events/attributes
vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    header: 'header',
    button: 'button',
    section: 'section',
    span: 'span',
    p: 'p',
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    h4: 'h4',
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock recharts fully including BarChart and Bar to prevent React 19 undefined element crashes
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Lock: () => <span data-testid="icon-lock" />,
  Mail: () => <span data-testid="icon-mail" />,
  Eye: () => <span data-testid="icon-eye" />,
  EyeOff: () => <span data-testid="icon-eye-off" />,
  Loader2: () => <span data-testid="icon-loader" />,
  AlertCircle: () => <span data-testid="icon-alert" />,
  Leaf: () => <span data-testid="icon-leaf" />,
  MessageSquare: () => <span data-testid="icon-message" />,
  Users: () => <span data-testid="icon-users" />,
  Sun: () => <span data-testid="icon-sun" />,
  CloudRain: () => <span data-testid="icon-cloud-rain" />,
  Wind: () => <span data-testid="icon-wind" />,
  Droplets: () => <span data-testid="icon-droplets" />,
  TrendingUp: () => <span data-testid="icon-trending" />,
  AlertTriangle: () => <span data-testid="icon-alert-triangle" />,
  ArrowRight: () => <span data-testid="icon-arrow-right" />,
  Sparkles: () => <span data-testid="icon-sparkles" />,
  Search: () => <span data-testid="icon-search" />,
  CheckCircle: () => <span data-testid="icon-check-circle" />,
  Clock: () => <span data-testid="icon-clock" />,
}));

vi.mock('../store/useAuthStore', () => ({
  useAuthStore: () => (globalThis as any).mockAuthState,
}));

vi.mock('../api/client', () => ({
  default: {
    get: (globalThis as any).mockGet,
    post: vi.fn().mockResolvedValue({ data: {} }),
  },
  api: {
    get: (globalThis as any).mockGet,
    post: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

describe('AgriNex Web Unit Hardening Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).mockAuthState.isLoading = false;
    (globalThis as any).mockAuthState.error = null;
  });

  afterEach(() => {
    cleanup();
  });

  describe('Login Page Component', () => {
    it('renders login layout, email input, and submit button successfully', () => {
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );

      expect(screen.getByText('Welcome Back')).toBeDefined();
      expect(screen.getByPlaceholderText('name@farm.com')).toBeDefined();
      expect(screen.getByRole('button', { name: /Secure Sign In/i })).toBeDefined();
    });

    it('validates empty inputs and renders validation error message', async () => {
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );

      const submitButton = screen.getByRole('button', { name: /Secure Sign In/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Please enter both email and password/i)).toBeDefined();
      });
    });

    it('renders full-screen spinner state when credentials are being verified', () => {
      (globalThis as any).mockAuthState.isLoading = true;
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );

      expect(screen.getByText(/Verifying Credentials.../i)).toBeDefined();
    });

    it('renders server-side auth error alerts when auth API fails', () => {
      (globalThis as any).mockAuthState.error = 'Invalid credentials or expired OTP session';
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );

      expect(screen.getByText(/Invalid credentials or expired OTP session/i)).toBeDefined();
    });
  });

  describe('Dashboard Page Component', () => {
    it('renders welcome banner and greets the user with name and location', async () => {
      render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Welcome, Dr. Swaminathan/i)).toBeDefined();
        expect(screen.getByText(/Vasco, Goa/i)).toBeDefined();
      });
    });

    it('displays agricultural weather intelligence parameters after API resolve', async () => {
      render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Goa Farm, India')).toBeDefined();
        expect(screen.getByText('29°')).toBeDefined();
        expect(screen.getByText('50%')).toBeDefined();
        expect(screen.getByText('8 km/h')).toBeDefined();
      });
    });

    it('renders recent AI diagnostics scan history with severity badges', async () => {
      render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Late Blight')).toBeDefined();
        expect(screen.getByText('Potato Leaf')).toBeDefined();
        expect(screen.getByText('Critical')).toBeDefined();
        expect(screen.getByText('95% conf')).toBeDefined();
      });
    });
  });
});
