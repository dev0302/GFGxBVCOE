export const SectionTitle = ({ icon, children }) => (
  <div className="flex items-center gap-2 mb-4">
    <span className="text-2xl">{icon}</span>
    <h2 className="text-lg font-semibold text-white tracking-tight">{children}</h2>
    <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/40 to-transparent rounded" />
  </div>
);

export const inputClass =
  "w-full px-4 py-2.5 rounded-xl bg-[#252536] border border-gray-500/40 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition";
export const labelClass = "block text-sm font-medium text-gray-300 mb-1.5";
