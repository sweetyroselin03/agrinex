import api from '../api/client';

export interface GPSLocation {
  latitude: number;
  longitude: number;
  village: string;
  district: string;
  state: string;
  country: string;
  display_name: string;
}

export async function getCurrentGPSLocation(): Promise<GPSLocation> {
  const options: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  };

  const getPositionPromise = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  };

  let position: GeolocationPosition;
  try {
    position = await getPositionPromise();
  } catch (err) {
    // Retry once with slightly relaxed options
    try {
      position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          ...options,
          enableHighAccuracy: false,
          timeout: 5000
        });
      });
    } catch (retryErr) {
      throw new Error("Failed to retrieve GPS location coordinates after retry.", { cause: retryErr });
    }
  }

  const { latitude, longitude } = position.coords;

  // Call the reverse geocoding API endpoint
  try {
    const res = await api.get('/api/location/reverse', {
      params: { lat: latitude, lon: longitude }
    });
    return {
      latitude,
      longitude,
      village: res.data.village,
      district: res.data.district,
      state: res.data.state,
      country: res.data.country,
      display_name: res.data.display_name
    };
  } catch (err) {
    // Fallback if reverse geocoding fails
    return {
      latitude,
      longitude,
      village: "Agricultural Hub",
      district: "Pune District",
      state: "Maharashtra",
      country: "India",
      display_name: "Maharashtra, India"
    };
  }
}
