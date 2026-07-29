import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function EditProfile() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/profile?tab=settings', { replace: true });
  }, [navigate]);

  return null;
}
