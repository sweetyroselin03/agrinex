import { motion } from 'framer-motion';

export default function Schemes() {
  const schemes = [
    { title: "PM Kisan Samman Nidhi", desc: "₹6000/year support.", status: "Active" },
    { title: "Kisan Credit Card (KCC)", desc: "Short term credit limit.", status: "Open" }
  ];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 h-full bg-light">
      <h1 className="text-2xl font-bold text-textPrimary mb-6 mt-4">Gov. Schemes</h1>
      <div className="space-y-4">
        {schemes.map((s, i) => (
          <div key={i} className="glass-card p-5 border-l-4 border-l-accent">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-textPrimary text-base">{s.title}</h4>
              <span className="bg-green-100 text-primary text-[10px] px-2 py-1 rounded-full font-bold uppercase">{s.status}</span>
            </div>
            <p className="text-sm text-textSecondary mb-4">{s.desc}</p>
            <button className="bg-gray-50 px-4 py-2 rounded-xl text-sm font-semibold text-textPrimary">Apply / Check</button>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
