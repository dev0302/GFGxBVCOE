import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Lock } from "react-feather";
import { SectionTitle } from "../../components/EventDashboard/SectionTitle";
import { Spinner } from "@/components/ui/spinner";
import {
  getAllUsers,
  getLeadershipConfig,
  addLeadershipAllowedUser,
  removeLeadershipAllowedUser,
  getAccountTypeLabel,
  isSocietyRole,
  getMe,
} from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { subscribeLeadershipUpdates } from "../../services/socket";
import { cloudinaryTinyAvatarUrl } from "../../utils/cloudinary";

function userDisplayName(user) {
  return `${user.firstName || ""} ${user.lastName || ""}`.trim();
}

function UserAvatar({ user, name }) {
  const avatarSrc = user.image ? cloudinaryTinyAvatarUrl(user.image) : "";
  const initials = (name || user.email || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  if (avatarSrc) {
    return (
      <img
        src={avatarSrc}
        alt=""
        className="h-10 w-10 shrink-0 rounded-full border border-gray-500/40 object-cover"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-600/25 text-xs font-semibold text-cyan-100">
      {initials || "?"}
    </div>
  );
}

function AllowedUserRow({ user, removable, removingId, onRemove }) {
  const name = userDisplayName(user);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-500/20 bg-[#151525]/60 px-4 py-3">
      <UserAvatar user={user} name={name} />

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-richblack-25">
          {name || user.email}
        </div>
        <div className="truncate text-xs text-gray-500">{user.email}</div>
      </div>

      <span className="hidden shrink-0 rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] font-medium text-cyan-300 sm:inline-flex">
        {getAccountTypeLabel(user.accountType) || user.accountType}
      </span>

      {removable ? (
        <button
          type="button"
          disabled={removingId === user._id}
          onClick={() => onRemove(user._id)}
          className="shrink-0 rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/25 disabled:opacity-50"
        >
          {removingId === user._id ? "Removing…" : "Remove"}
        </button>
      ) : (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1.5 text-[10px] font-medium text-gray-400">
          <Lock className="h-3 w-3" />
          Always allowed
        </span>
      )}
    </div>
  );
}

function applyConfigData(data, setBuiltinUsers, setAllowedUsers) {
  if (!data) return;
  setBuiltinUsers(data.builtinAllowedUsers || []);
  setAllowedUsers(data.allowedUsers || []);
}

export default function PersonsAllowed() {
  const { setUser } = useAuth();
  const [builtinUsers, setBuiltinUsers] = useState([]);
  const [allowedUsers, setAllowedUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [pickerValue, setPickerValue] = useState("");
  const [search, setSearch] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [configRes, usersRes] = await Promise.all([
        getLeadershipConfig(),
        getAllUsers(),
      ]);
      if (configRes.success && configRes.data) {
        applyConfigData(configRes.data, setBuiltinUsers, setAllowedUsers);
      }
      if (usersRes.success) setAllUsers(usersRes.data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    return subscribeLeadershipUpdates(() => {
      loadData();
    });
  }, [loadData]);

  const allowedIdSet = useMemo(() => {
    const ids = new Set([
      ...builtinUsers.map((u) => String(u._id)),
      ...allowedUsers.map((u) => String(u._id)),
    ]);
    return ids;
  }, [builtinUsers, allowedUsers]);

  const pickerOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allUsers
      .filter((u) => !allowedIdSet.has(String(u._id)))
      .filter((u) => !isSocietyRole(u.accountType))
      .filter((u) => {
        if (!q) return true;
        const name = userDisplayName(u).toLowerCase();
        return (
          name.includes(q) ||
          (u.email || "").toLowerCase().includes(q) ||
          (u.accountType || "").toLowerCase().includes(q)
        );
      });
  }, [allUsers, allowedIdSet, search]);

  const handleAdd = async () => {
    const userId = pickerValue.trim();
    if (!userId) return;
    setAdding(true);
    try {
      const res = await addLeadershipAllowedUser(userId);
      applyConfigData(res.data, setBuiltinUsers, setAllowedUsers);
      setPickerValue("");
      setSearch("");
      toast.success("Person added. They will see Leadership Transition in their menu.");
      const me = await getMe();
      if (me.user) setUser(me.user);
    } catch (err) {
      toast.error(err.message || "Failed to add");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (userId) => {
    setRemovingId(userId);
    try {
      const res = await removeLeadershipAllowedUser(userId);
      applyConfigData(res.data, setBuiltinUsers, setAllowedUsers);
      toast.success("Person removed.");
      const me = await getMe();
      if (me.user) setUser(me.user);
    } catch (err) {
      toast.error(err.message || "Failed to remove");
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-full w-full items-center justify-center bg-[#1e1e2f] pb-20">
        <Spinner className="size-6 text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="flex min-h-full w-full justify-center bg-[#1e1e2f] pb-20 px-4 sm:px-6 lg:px-10">
      <div className="flex w-full max-w-3xl flex-col gap-10 py-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-richblack-25 sm:text-4xl">
            Persons allowed
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Faculty Incharge, Chairperson, Vice-Chairperson, and all Department Leads
            always have access. Add other registered members who should also use
            Leadership Transition.
          </p>
        </div>

        <section className="rounded-2xl border border-gray-500/20 bg-gradient-to-br from-[#1e1e2f]/80 to-[#2c2c3e]/80 p-6 shadow-xl md:p-8">
          <SectionTitle icon="👤">Allowed users</SectionTitle>

          <div className="mt-4 space-y-6">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Always allowed
              </p>
              {builtinUsers.length === 0 ? (
                <p className="rounded-xl border border-dashed border-gray-500/25 bg-[#151525]/30 px-4 py-6 text-sm text-gray-500">
                  No default Leadership Transition role accounts are registered yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {builtinUsers.map((u) => (
                    <AllowedUserRow key={u._id} user={u} removable={false} />
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Additionally allowed
              </p>
              {allowedUsers.length === 0 ? (
                <p className="rounded-xl border border-dashed border-gray-500/25 bg-[#151525]/30 px-4 py-6 text-sm text-gray-500">
                  No extra users added yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {allowedUsers.map((u) => (
                    <AllowedUserRow
                      key={u._id}
                      user={u}
                      removable
                      removingId={removingId}
                      onRemove={handleRemove}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-500/20 bg-gradient-to-br from-[#1e1e2f]/80 to-[#2c2c3e]/80 p-6 shadow-xl md:p-8">
          <SectionTitle icon="➕">Add from registered users</SectionTitle>
          <p className="mt-2 text-xs text-gray-500">
            Default Leadership Transition roles are excluded because they already have access.
          </p>

          <div className="mt-4 space-y-3">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users…"
              className="w-full rounded-xl border border-gray-500/30 bg-[#151525] px-4 py-2.5 text-sm text-gray-200 placeholder:text-gray-500 focus:border-cyan-500/50 focus:outline-none"
            />

            <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-500/20">
              {pickerOptions.length === 0 ? (
                <p className="p-4 text-sm text-gray-500">No matching users.</p>
              ) : (
                pickerOptions.map((u) => {
                  const name = userDisplayName(u);
                  const selected = pickerValue === String(u._id);
                  return (
                    <button
                      key={u._id}
                      type="button"
                      onClick={() => setPickerValue(String(u._id))}
                      className={`flex w-full items-center gap-3 border-b border-gray-500/10 px-4 py-3 text-left transition last:border-0 ${
                        selected ? "bg-cyan-500/15" : "hover:bg-gray-500/10"
                      }`}
                    >
                      <UserAvatar user={u} name={name} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm text-richblack-25">{name}</div>
                        <div className="truncate text-xs text-gray-500">{u.email}</div>
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {getAccountTypeLabel(u.accountType) || u.accountType}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <button
              type="button"
              disabled={!pickerValue || adding}
              onClick={handleAdd}
              className="rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {adding ? "Adding…" : "Add selected user"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
