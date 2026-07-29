import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const navigate = useNavigate();
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 h-full bg-light">
      <div className="flex items-center mb-6 mt-4 gap-4">
        <button onClick={() => navigate(-1)} className="text-2xl">←</button>
        <h1 className="text-2xl font-bold text-textPrimary">Settings</h1>
      </div>
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-gray-100 font-medium text-textPrimary">Language</div>
        <div className="p-4 border-b border-gray-100 font-medium text-textPrimary">Dark Mode</div>
        <div className="p-4 font-medium text-red-500" onClick={() => navigate('/login')}>Logout</div>
      </div>
    </motion.div>
  );
}
