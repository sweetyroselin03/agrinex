import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getCurrentGPSLocation } from '../utils/gps';
import api from '../api/client';

// Mock api client
vi.mock('../api/client', () => {
  return {
    default: {
      get: vi.fn(),
    },
  };
});

describe('GPS and Geolocation Intelligence Module', () => {
  let originalGeolocation: any;

  beforeEach(() => {
    vi.clearAllMocks();
    originalGeolocation = (globalThis.navigator as any).geolocation;
  });

  afterEach(() => {
    if (globalThis.navigator) {
      Object.defineProperty(globalThis.navigator, 'geolocation', {
        value: originalGeolocation,
        configurable: true,
        writable: true,
      });
    }
  });

  it('should successfully get high accuracy GPS location and reverse geocode', async () => {
    const mockPosition = {
      coords: {
        latitude: 18.5204,
        longitude: 73.8567,
      },
    };

    const mockGeolocation = {
      getCurrentPosition: vi.fn().mockImplementation((success) => {
        success(mockPosition);
      }),
    };

    Object.defineProperty(globalThis.navigator, 'geolocation', {
      value: mockGeolocation,
      configurable: true,
      writable: true,
    });

    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        village: 'Khed Shivapur',
        district: 'Pune District',
        state: 'Maharashtra',
        country: 'India',
        display_name: 'Khed Shivapur, Pune, MH, India',
      },
    });

    const location = await getCurrentGPSLocation();

    expect(location.latitude).toBe(18.5204);
    expect(location.longitude).toBe(73.8567);
    expect(location.village).toBe('Khed Shivapur');
    expect(location.district).toBe('Pune District');
    expect(location.state).toBe('Maharashtra');
    expect(location.country).toBe('India');
    expect(location.display_name).toBe('Khed Shivapur, Pune, MH, India');
    
    expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith('/api/location/reverse', {
      params: { lat: 18.5204, lon: 73.8567 },
    });
  });

  it('should retry with relaxed parameters if high accuracy fails, then geocode', async () => {
    const mockPosition = {
      coords: {
        latitude: 19.076,
        longitude: 72.8777,
      },
    };

    const mockGeolocation = {
      getCurrentPosition: vi.fn()
        .mockImplementationOnce((success, error) => {
          error(new Error('Timeout or accuracy failure'));
        })
        .mockImplementationOnce((success) => {
          success(mockPosition);
        }),
    };

    Object.defineProperty(globalThis.navigator, 'geolocation', {
      value: mockGeolocation,
      configurable: true,
      writable: true,
    });

    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        village: 'Bandra',
        district: 'Mumbai Suburban',
        state: 'Maharashtra',
        country: 'India',
        display_name: 'Bandra, Mumbai, MH, India',
      },
    });

    const location = await getCurrentGPSLocation();

    expect(location.latitude).toBe(19.076);
    expect(location.longitude).toBe(72.8777);
    expect(location.village).toBe('Bandra');
    expect(location.display_name).toBe('Bandra, Mumbai, MH, India');
    
    // Expect getCurrentPosition called twice due to retry logic
    expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledTimes(2);
  });

  it('should fail cleanly if both high accuracy and relaxed geolocation fail', async () => {
    const mockGeolocation = {
      getCurrentPosition: vi.fn().mockImplementation((success, error) => {
        error(new Error('Permission Denied'));
      }),
    };

    Object.defineProperty(globalThis.navigator, 'geolocation', {
      value: mockGeolocation,
      configurable: true,
      writable: true,
    });

    await expect(getCurrentGPSLocation()).rejects.toThrow(
      'Failed to retrieve GPS location coordinates after retry.'
    );
    expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledTimes(2);
  });

  it('should use default agricultural fallbacks if reverse geocoding request fails', async () => {
    const mockPosition = {
      coords: {
        latitude: 18.5204,
        longitude: 73.8567,
      },
    };

    const mockGeolocation = {
      getCurrentPosition: vi.fn().mockImplementation((success) => {
        success(mockPosition);
      }),
    };

    Object.defineProperty(globalThis.navigator, 'geolocation', {
      value: mockGeolocation,
      configurable: true,
      writable: true,
    });

    // Mock API throw
    vi.mocked(api.get).mockRejectedValueOnce(new Error('Nominatim timeout'));

    const location = await getCurrentGPSLocation();

    expect(location.latitude).toBe(18.5204);
    expect(location.longitude).toBe(73.8567);
    expect(location.village).toBe('Agricultural Hub');
    expect(location.district).toBe('Pune District');
    expect(location.state).toBe('Maharashtra');
    expect(location.country).toBe('India');
    expect(location.display_name).toBe('Maharashtra, India');
  });
});
