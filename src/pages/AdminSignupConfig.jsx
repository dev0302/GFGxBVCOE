import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getSignupConfigs, addSignupEmail, removeSignupEmail, getAccountTypeLabel, isSocietyRole } from "../services/api";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

const AdminSignupConfig = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState({});
  const [removing, setRemoving] = useState({});
  const [newEmail, setNewEmail] = useState({});

  useEffect(() => {
    if (authLoading) return;
    if (!isSocietyRole(user?.accountType)) {
      navigate("/", { replace: true });
      return;
    }
    getSignupConfigs()
      .then((res) => setConfigs(res.data || []))
      .catch((err) => {
        toast.error(err.message || "Failed to load config");
        setConfigs([]);
      })
      .finally(() => setLoading(false));
  }, [user, authLoading, navigate]);

  const handleAdd = async (department) => {
    const email = (newEmail[department] || "").trim().toLowerCase();
    if (!email) {
      toast.error("Enter an email");
      return;
    }
    setAdding((p) => ({ ...p, [department]: true }));
    try {
      const res = await addSignupEmail(department, email);
      setConfigs((prev) =>
        prev.map((c) =>
          c.department === department ? { ...c, allowedEmails: [...(c.allowedEmails || []), email] } : c
        )
      );
      setNewEmail((p) => ({ ...p, [department]: "" }));
      toast.success("Email added");
    } catch (err) {
      toast.error(err.message || "Failed to add");
    } finally {
      setAdding((p) => ({ ...p, [department]: false }));
    }
  };

  const handleRemove = async (department, email) => {
    const key = `${department}-${email}`;
    setRemoving((p) => ({ ...p, [key]: true }));
    try {
      await removeSignupEmail(department, email);
      setConfigs((prev) =>
        prev.map((c) =>
          c.department === department
            ? { ...c, allowedEmails: (c.allowedEmails || []).filter((e) => e !== email) }
            : c
        )
      );
      toast.success("Email removed");
    } catch (err) {
      toast.error(err.message || "Failed to remove");
    } finally {
      setRemoving((p) => ({ ...p, [key]: false }));
    }
  };

  if (authLoading || (user && !isSocietyRole(user.accountType))) {
    return null;
  }

  return (
    <div className="min-h-screen darkthemebg pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400 text-sm">
            Manage allowed emails for all departments. Add or remove emails below; only listed emails can sign up for that department.
          </p>
        </div>

        {loading ? (
          <p className="text-gray-400"><Spinner className="size-4 text-gray-400" /></p>
        ) : (
          <div className="space-y-6">
            {configs.map((config) => (
              <div
                key={config.department}
                className="bg-gradient-to-br from-[#1e1e2f]/90 to-[#2c2c3e]/90 border border-gray-500/30 rounded-xl p-5 shadow-lg"
              >
                <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  {getAccountTypeLabel(config.department) || config.department}
                </h2>
                <p className="text-xs text-gray-500 mb-4">
                  {(config.allowedEmails || []).length} allowed email(s)
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {(config.allowedEmails || []).map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#252536] border border-gray-500/30 text-gray-200 text-sm"
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() => handleRemove(config.department, email)}
                        disabled={removing[`${config.department}-${email}`]}
                        className="ml-1 w-5 h-5 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/40 flex items-center justify-center text-xs font-bold disabled:opacity-50"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="email"
                    value={newEmail[config.department] || ""}
                    onChange={(e) => setNewEmail((p) => ({ ...p, [config.department]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && handleAdd(config.department)}
                    placeholder="Add email address"
                    className="flex-1 px-4 py-2 rounded-lg bg-[#252536] border border-gray-500/40 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 outline-none text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleAdd(config.department)}
                    disabled={adding[config.department]}
                    className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm disabled:opacity-50"
                  >
                    {adding[config.department] ? "Adding…" : "Add"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSignupConfig;
