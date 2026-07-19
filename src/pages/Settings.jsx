import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  ChevronRight,
  Cloud,
  CreditCard,
  Database,
  HardDrive,
  Link,
  Lock,
  Mail,
  Info,
  Server,
  RefreshCw,
  RotateCcw,
  Settings as Sliders,
  Shield,
  Users,
  User,
} from "react-feather";
import { FiSettings } from "react-icons/fi";
import {
  fetchCloudinaryStorageUsage,
  fetchDatabaseAnalytics,
  fetchEmailServiceAnalytics,
} from "../services/api";

const societyItems = [
  { id: "overview", label: "Overview", icon: Users },
  { id: "cloudinary-storage", label: "Cloudinary Storage", icon: Cloud },
  { id: "database", label: "MongoDB", icon: Database },
  { id: "redis-storage", label: "Redis Storage", icon: HardDrive },
  { id: "email-service", label: "Email Service", icon: Mail },
];

const personalItems = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
];

const otherItems = [
  { id: "team-roles", label: "Team Roles", icon: Users },
  { id: "manage-members", label: "Manage Members", icon: Users },
  { id: "billing-usage", label: "Billing & Usage", icon: CreditCard },
  { id: "backup-restore", label: "Backup & Restore", icon: Cloud },
];

const allItems = [...societyItems, ...personalItems, ...otherItems];
const CLOUDINARY_ESTIMATED_FREE_PLAN_GB = 25;
const CLOUDINARY_ESTIMATED_FREE_PLAN_BYTES =
  CLOUDINARY_ESTIMATED_FREE_PLAN_GB * 1024 ** 3;

const metricCards = [
  {
    id: "cloudinary-storage",
    title: "Cloudinary Storage",
    value: "Not connected yet",
    caption: "Storage usage",
    percent: null,
    icon: Cloud,
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    bar: "bg-sky-400",
  },
  {
    id: "redis-storage",
    title: "Redis Memory",
    value: "Not connected yet",
    caption: "No Redis analytics connected",
    percent: null,
    icon: HardDrive,
    color: "text-red-400",
    bg: "bg-red-500/10",
    bar: "bg-red-400",
  },
  {
    id: "database",
    title: "Database Storage",
    value: "Not connected yet",
    caption: "MongoDB usage",
    percent: null,
    icon: Database,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    bar: "bg-emerald-400",
  },
  {
    id: "email-service",
    title: "Email Service",
    value: "Not connected yet",
    caption: "Delivery service status",
    percent: null,
    icon: Mail,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
];

const societyCards = [
  {
    id: "cloudinary-storage",
    title: "Cloudinary Storage",
    desc: "Manage media files, folders, upload presets and storage usage.",
    icon: Cloud,
    color: "text-sky-400",
    bg: "bg-sky-500/10",
  },
  {
    id: "redis-storage",
    title: "Redis Storage",
    desc: "View cache statistics, memory usage, TTL and manage keys.",
    icon: HardDrive,
    color: "text-red-400",
    bg: "bg-red-500/10",
  },
  {
    id: "database",
    title: "Database",
    desc: "Monitor database performance, collections, and storage details.",
    icon: Database,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    id: "email-service",
    title: "Email Service",
    desc: "Configure email templates, SMTP settings and sending limits.",
    icon: Mail,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    id: "api-integrations",
    title: "API & Integrations",
    desc: "Manage third-party APIs, webhooks and integrations.",
    icon: Link,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  {
    id: "logs-activity",
    title: "Logs & Activity",
    desc: "View system logs, user activities and audit trails.",
    icon: RotateCcw,
    color: "text-teal-400",
    bg: "bg-teal-500/10",
  },
];

const personalCards = [
  {
    id: "profile",
    title: "Profile",
    desc: "Update your profile information and avatar.",
    icon: User,
    color: "text-sky-300",
    bg: "bg-sky-500/10",
  },
  {
    id: "notifications",
    title: "Notifications",
    desc: "Manage email and activity notifications.",
    icon: Bell,
    color: "text-orange-300",
    bg: "bg-orange-500/10",
  },
];

const otherCards = [
  {
    id: "team-roles",
    title: "Team Roles",
    desc: "Manage roles and permissions.",
    icon: Users,
    color: "text-orange-300",
    bg: "bg-orange-500/10",
  },
  {
    id: "manage-members",
    title: "Manage Members",
    desc: "Add, remove or update members.",
    icon: Users,
    color: "text-violet-300",
    bg: "bg-violet-500/10",
  },
  {
    id: "billing-usage",
    title: "Billing & Usage",
    desc: "View plans, usage and billing details.",
    icon: CreditCard,
    color: "text-emerald-300",
    bg: "bg-emerald-500/10",
  },
  {
    id: "backup-restore",
    title: "Backup & Restore",
    desc: "Backup or restore your data.",
    icon: Cloud,
    color: "text-sky-300",
    bg: "bg-sky-500/10",
  },
];

function SidebarGroup({ title, tone, items, activeTab, onSelect }) {
  return (
    <div className="w-full border-b border-white/10 pb-3 last:border-b-0 last:pb-0 lg:pb-5">
      <p
        className={`hidden px-1 pb-2 text-xs font-bold uppercase tracking-wide lg:block ${tone}`}
      >
        {title}
      </p>
      <div className="flex flex-col items-center gap-1.5 lg:items-stretch lg:gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.id === activeTab;
          return (
            <button
              key={item.id}
              type="button"
              title={item.label}
              aria-label={item.label}
              onClick={() => onSelect(item.id)}
              className={`relative flex items-center justify-center gap-3 overflow-hidden rounded-lg p-2.5 text-sm font-semibold transition-all duration-200 lg:w-full lg:justify-start lg:px-3 lg:py-2.5 ${
                active
                  ? "bg-emerald-400/18 text-emerald-100 shadow-inner shadow-emerald-950/30"
                  : "text-gray-300 hover:bg-white/[0.07] hover:text-richblack-25"
              }`}
            >
              <span
                className={`absolute left-0 top-1/2 hidden h-7 w-1 -translate-y-1/2 rounded-r-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.55)] transition-all duration-200 lg:block ${
                  active ? "opacity-100 scale-y-100" : "opacity-0 scale-y-50"
                }`}
              />
              <Icon
                className={`h-5 w-5 shrink-0 transition-colors duration-200 lg:h-4 lg:w-4 ${
                  active ? "text-emerald-300" : ""
                }`}
              />
              <span className="hidden truncate lg:inline">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MetricCard({ item, onSelect }) {
  const Icon = item.icon;
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3 shadow-lg shadow-black/10 sm:p-4">
      <div className="flex items-start gap-2.5 sm:gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10 ${item.bg} ${item.color}`}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold text-richblack-25 sm:text-sm">{item.title}</p>
          <p className="mt-3 text-lg font-bold text-richblack-25 sm:mt-5 sm:text-2xl">
            {item.value}
          </p>
          <p className="mt-1 text-xs text-gray-400 sm:text-sm">{item.caption}</p>
        </div>
      </div>
      {item.percent == null && item.action ? (
        <button
          type="button"
          onClick={() => onSelect?.(item.id)}
          className="mt-4 flex w-full items-center justify-end gap-1 text-xs font-bold text-violet-300 transition hover:text-violet-200 sm:mt-5 sm:text-sm"
        >
          {item.action}
          <ChevronRight className="h-4 w-4" />
        </button>
      ) : item.percent != null ? (
        <div className="mt-4 flex items-center gap-3 sm:mt-5 sm:gap-4">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full ${item.bar}`}
              style={{ width: `${item.percent}%` }}
            />
          </div>
          <span className="w-8 text-right text-[11px] text-gray-300 sm:w-9 sm:text-xs">
            {item.percent}%
          </span>
        </div>
      ) : null}
    </div>
  );
}

function SettingsCard({ item, compact = false, onSelect }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect?.(item.id)}
      className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-2.5 text-left transition hover:border-white/20 hover:bg-white/[0.06] sm:gap-4 sm:p-4"
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-11 sm:w-11 ${item.bg} ${item.color}`}>
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-bold text-richblack-25 sm:text-sm">
          {item.title}
        </span>
        <span className={`mt-1 block text-gray-400 ${compact ? "text-[11px]" : "text-[11px] sm:text-sm"}`}>
          {item.desc}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 sm:h-5 sm:w-5" />
    </button>
  );
}

function Panel({ title, subtitle, children }) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.035] p-3 shadow-xl shadow-black/10 sm:p-5">
      {(title || subtitle) && (
        <div className="mb-3 sm:mb-5">
          {title && <h2 className="text-sm font-bold text-richblack-25 sm:text-lg">{title}</h2>}
          {subtitle && <p className="mt-1 text-[11px] text-gray-400 sm:text-sm">{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

function OverviewContent({ onSelect }) {
  const [overviewData, setOverviewData] = useState({
    cloudinary: null,
    database: null,
    email: null,
  });
  const [overviewErrors, setOverviewErrors] = useState({});
  const [overviewLoading, setOverviewLoading] = useState(true);

  const loadOverview = async () => {
    setOverviewLoading(true);
    const results = await Promise.allSettled([
      fetchCloudinaryStorageUsage(),
      fetchDatabaseAnalytics(),
      fetchEmailServiceAnalytics(),
    ]);

    setOverviewData({
      cloudinary: results[0].status === "fulfilled" ? results[0].value : null,
      database: results[1].status === "fulfilled" ? results[1].value : null,
      email: results[2].status === "fulfilled" ? results[2].value : null,
    });
    setOverviewErrors({
      cloudinary: results[0].status === "rejected",
      database: results[1].status === "rejected",
      email: results[2].status === "rejected",
    });
    setOverviewLoading(false);
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const liveMetricCards = useMemo(() => {
    const cloudinaryUsedBytes = overviewData.cloudinary?.storage?.usedBytes;
    const cloudinaryPercent =
      cloudinaryUsedBytes != null
        ? Math.min(
            Math.round(
              (Number(cloudinaryUsedBytes || 0) /
                CLOUDINARY_ESTIMATED_FREE_PLAN_BYTES) *
                100,
            ),
            100,
          )
        : null;
    const databaseStorageMb = overviewData.database?.summary?.storageMb;
    const emailConnected = overviewData.email?.connected === true;

    return metricCards.map((card) => {
      if (overviewLoading) {
        return {
          ...card,
          value: "Checking...",
          caption: "Loading live details",
          percent: null,
        };
      }

      if (card.id === "cloudinary-storage") {
        return {
          ...card,
          value:
            cloudinaryUsedBytes != null && !overviewErrors.cloudinary
              ? formatStorageFromBytes(cloudinaryUsedBytes)
              : "Not connected yet",
          caption:
            cloudinaryUsedBytes != null && !overviewErrors.cloudinary
              ? `Used of estimated ${CLOUDINARY_ESTIMATED_FREE_PLAN_GB} GB`
              : "Cloudinary analytics unavailable",
          percent:
            cloudinaryUsedBytes != null && !overviewErrors.cloudinary
              ? cloudinaryPercent
              : null,
        };
      }

      if (card.id === "database") {
        return {
          ...card,
          value:
            databaseStorageMb != null && !overviewErrors.database
              ? `${databaseStorageMb} MB`
              : "Not connected yet",
          caption:
            databaseStorageMb != null && !overviewErrors.database
              ? `${formatNumber(overviewData.database?.summary?.totalCollections)} collections`
              : "MongoDB analytics unavailable",
        };
      }

      if (card.id === "email-service") {
        return {
          ...card,
          value:
            overviewData.email && !overviewErrors.email
              ? emailConnected
                ? "Connected"
                : "Not connected yet"
              : "Not connected yet",
          caption:
            overviewData.email && !overviewErrors.email
              ? `${formatNumber(overviewData.email?.summary?.sentToday)} emails sent today`
              : "Email analytics unavailable",
        };
      }

      return card;
    });
  }, [overviewData, overviewErrors, overviewLoading]);

  return (
    <div className="space-y-3 sm:space-y-4">
      <Panel title="Society Overview" subtitle="Quick summary of your society's system and services.">
        <div className="mb-4 flex justify-end sm:mb-8 sm:-mt-14">
          <button
            type="button"
            onClick={loadOverview}
            disabled={overviewLoading}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-xs font-semibold text-gray-200 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:py-2 sm:text-sm"
          >
            <RefreshCw className={`h-4 w-4 ${overviewLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          {liveMetricCards.map((item) => (
            <MetricCard key={item.title} item={item} onSelect={onSelect} />
          ))}
        </div>
      </Panel>

      <Panel title="Society Settings" subtitle="Configure and manage your society preferences.">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
          {societyCards.map((item) => (
            <SettingsCard key={item.title} item={item} onSelect={onSelect} />
          ))}
        </div>
      </Panel>

      <Panel title="Personal Settings" subtitle="Manage your account, security and preferences.">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          {personalCards.map((item) => (
            <SettingsCard key={item.title} item={item} compact onSelect={onSelect} />
          ))}
        </div>
      </Panel>

      <Panel title="Others">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          {otherCards.map((item) => (
            <SettingsCard key={item.title} item={item} compact onSelect={onSelect} />
          ))}
        </div>
      </Panel>
    </div>
  );
}

function PlaceholderContent({ activeTab }) {
  const activeItem = allItems.find((item) => item.id === activeTab);
  const Icon = activeItem?.icon || Lock;

  return (
    <Panel title={activeItem?.label || "Settings"} subtitle="This settings area is ready for the next implementation step.">
      <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.025] px-4 text-center sm:min-h-[360px] sm:px-6">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300 sm:h-14 sm:w-14">
          <Icon className="h-5 w-5 sm:h-7 sm:w-7" />
        </span>
        <h3 className="mt-3 text-base font-bold text-richblack-25 sm:mt-5 sm:text-xl">
          {activeItem?.label}
        </h3>
        <p className="mt-2 max-w-md text-xs leading-6 text-gray-400 sm:text-sm">
          The tab is connected in the sidebar. Add the actual controls here when
          you share the next requirements.
        </p>
      </div>
    </Panel>
  );
}

function formatStorageFromBytes(bytes) {
  if (bytes == null) return "Not reported";
  const numeric = Number(bytes || 0);
  if (numeric < 1024 ** 3) {
    return `${(numeric / 1024 ** 2).toFixed(2)} MB`;
  }
  return `${(numeric / 1024 ** 3).toFixed(2)} GB`;
}

function formatStorage(value) {
  if (value == null) return "Not reported";
  return `${Number(value || 0).toFixed(2)} GB`;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

function AnalyticsCard({ label, value, icon: Icon, tone = "text-emerald-300", subtext }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3 shadow-lg shadow-black/10 sm:p-4">
      <div className="flex items-start justify-between gap-2.5 sm:gap-3">
        <div>
          <p className="text-[11px] font-semibold text-gray-400 sm:text-sm">{label}</p>
          <p className="mt-2 text-lg font-bold text-richblack-25 sm:text-2xl">{value}</p>
          {subtext && <p className="mt-1 text-[10px] text-gray-500 sm:text-xs">{subtext}</p>}
        </div>
        {Icon && (
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] sm:h-10 sm:w-10 ${tone}`}>
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </span>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-lg border border-white/10 bg-white/[0.04] sm:h-28" />
        ))}
      </div>
      <div className="h-52 animate-pulse rounded-lg border border-white/10 bg-white/[0.04] sm:h-72" />
    </div>
  );
}

function AnalyticsHeader({ title, subtitle, updatedAt, loading, onRefresh, connected }) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5 sm:mb-5 sm:gap-3">
      <div>
        <h2 className="text-sm font-bold text-richblack-25 sm:text-lg">{title}</h2>
        {subtitle && <p className="mt-1 text-[11px] text-gray-400 sm:text-sm">{subtitle}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-2.5 text-[11px] text-gray-500 sm:gap-3 sm:text-xs">
          {connected != null && (
            <span className={connected ? "text-emerald-300" : "text-red-300"}>
              {connected ? "Connected" : "Unavailable"}
            </span>
          )}
          <span>
            {updatedAt ? `Last refreshed ${new Date(updatedAt).toLocaleString("en-IN")}` : "Not refreshed yet"}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-xs font-semibold text-gray-200 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:py-2 sm:text-sm"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        Refresh
      </button>
    </div>
  );
}

function CloudinaryStorageContent() {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsage = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchCloudinaryStorageUsage();
      setUsage(data);
    } catch (err) {
      setError(err?.message || "Failed to load Cloudinary storage usage");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsage();
  }, []);

  const storage = usage?.storage || {};
  const folders = usage?.folders || [];
  const usedBytes = Number(storage.usedBytes || 0);
  const estimatedRemainingBytes = Math.max(
    CLOUDINARY_ESTIMATED_FREE_PLAN_BYTES - usedBytes,
    0,
  );
  const estimatedPercentUsed = Math.min(
    Math.round((usedBytes / CLOUDINARY_ESTIMATED_FREE_PLAN_BYTES) * 100),
    100,
  );

  return (
    <div className="space-y-3 sm:space-y-4">
      <Panel
        title="Cloudinary Storage"
        subtitle="Actual Cloudinary storage usage and folder breakdown."
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5 sm:mb-5 sm:gap-3">
          <div className="text-[11px] text-gray-400 sm:text-sm">
            {usage?.updatedAt
              ? `Last updated ${new Date(usage.updatedAt).toLocaleString("en-IN")}`
              : "Live usage from Cloudinary"}
          </div>
          <button
            type="button"
            onClick={loadUsage}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-xs font-semibold text-gray-200 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:py-2 sm:text-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {loading && (
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-6 text-center text-xs text-gray-400 sm:p-8 sm:text-sm">
            Loading Cloudinary usage...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-red-400/20 bg-red-500/10 p-4 text-xs text-red-200 sm:p-5 sm:text-sm">
            {error}
          </div>
        )}

        {!loading && !error && usage && (
          <div className="space-y-4 sm:space-y-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
              <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3 sm:p-4">
                <p className="text-xs font-semibold text-gray-400 sm:text-sm">Used</p>
                <p className="mt-2 text-xl font-bold text-richblack-25 sm:text-3xl">
                  {formatStorageFromBytes(storage.usedBytes)}
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3 sm:p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 sm:text-sm">
                  <span>Roughly Remaining</span>
                  <span
                    className="group relative inline-flex"
                    tabIndex={0}
                    aria-label="Remaining storage estimate information"
                  >
                    <Info className="h-4 w-4 text-emerald-300/80" />
                    <span className="pointer-events-none absolute left-1/2 top-6 z-20 hidden w-56 -translate-x-1/2 rounded-lg border border-white/10 bg-[#171827] px-3 py-2 text-[11px] font-normal leading-5 text-gray-200 shadow-xl group-hover:block group-focus:block sm:w-72 sm:text-xs">
                      Estimated based on Cloudinary's credit system. Actual
                      available storage may vary because credits are shared
                      across storage, bandwidth, and transformations.
                    </span>
                  </span>
                </div>
                <p className="mt-2 text-xl font-bold text-emerald-200 sm:text-3xl">
                  ~{formatStorageFromBytes(estimatedRemainingBytes)}
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3 sm:p-4">
                <p className="text-xs font-semibold text-gray-400 sm:text-sm">Estimated Max</p>
                <p className="mt-2 text-xl font-bold text-richblack-25 sm:text-3xl">
                  {CLOUDINARY_ESTIMATED_FREE_PLAN_GB.toFixed(2)} GB
                </p>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-xs sm:text-sm">
                <span className="font-semibold text-gray-300">
                  Estimated free-plan storage used
                </span>
                <span className="text-gray-400">{estimatedPercentUsed}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.45)] transition-all duration-300"
                  style={{ width: `${estimatedPercentUsed}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-4">
              {[
                ["Total Assets", usage.assets?.total],
                ["Images", usage.assets?.image],
                ["Videos", usage.assets?.video],
                ["Raw Files", usage.assets?.raw],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 sm:p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 sm:text-xs">
                    {label}
                  </p>
                  <p className="mt-2 text-lg font-bold text-richblack-25 sm:text-2xl">
                    {value ?? 0}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Panel>

      {!loading && !error && usage && (
        <Panel title="Storage By Folder" subtitle="Grouped by the top-level Cloudinary folder.">
          {usage.partial && (
            <div className="mb-4 rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-100 sm:px-4 sm:py-3 sm:text-sm">
              Showing a large-account sample from Cloudinary. Some assets may be outside this breakdown.
            </div>
          )}

          {folders.length ? (
            <div className="space-y-2 sm:hidden">
              {folders.map((folder) => (
                <div key={folder.folder} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 truncate text-xs font-semibold text-richblack-25">
                      {folder.folder}
                    </p>
                    <span className="shrink-0 text-xs text-emerald-300">
                      {folder.percentOfUsed}%
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-gray-500">
                    {folder.image} images · {folder.video} videos · {folder.raw} raw
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-gray-300">
                    <span>{formatStorage(folder.gb)}</span>
                    <span>{folder.assets} assets</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.025] p-6 text-center text-xs text-gray-400 sm:hidden">
              No Cloudinary assets found.
            </div>
          )}

          {folders.length ? (
            <div className="hidden rounded-lg border border-white/10 sm:block">
              <div className="grid grid-cols-[minmax(0,1fr)_110px_100px_90px] gap-3 border-b border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-bold uppercase tracking-wide text-gray-400">
                <span>Folder</span>
                <span className="text-right">Used</span>
                <span className="text-right">Assets</span>
                <span className="text-right">Share</span>
              </div>
              <div className="divide-y divide-white/10">
                {folders.map((folder) => (
                  <div
                    key={folder.folder}
                    className="grid grid-cols-[minmax(0,1fr)_110px_100px_90px] items-center gap-3 px-4 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-richblack-25">
                        {folder.folder}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {folder.image} images - {folder.video} videos - {folder.raw} raw
                      </p>
                    </div>
                    <span className="text-right font-semibold text-gray-200">
                      {formatStorage(folder.gb)}
                    </span>
                    <span className="text-right text-gray-300">{folder.assets}</span>
                    <span className="text-right text-emerald-300">
                      {folder.percentOfUsed}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="hidden rounded-lg border border-dashed border-white/15 bg-white/[0.025] p-8 text-center text-sm text-gray-400 sm:block">
              No Cloudinary assets found.
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}

function DatabaseAnalyticsContent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      setData(await fetchDatabaseAnalytics());
    } catch (err) {
      setError(err?.message || "Failed to load database analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const summary = data?.summary || {};
  const collections = data?.collections || [];

  return (
    <div className="space-y-3 sm:space-y-4">
      <Panel>
        <AnalyticsHeader
          title="MongoDB Analytics"
          subtitle="Read-only database storage, documents, collections and index usage."
          updatedAt={data?.updatedAt}
          loading={loading}
          onRefresh={load}
          connected={!error}
        />
        {loading && <LoadingSkeleton />}
        {!loading && error && (
          <div className="rounded-lg border border-red-400/20 bg-red-500/10 p-4 text-xs text-red-200 sm:p-5 sm:text-sm">
            {error}
          </div>
        )}
        {!loading && !error && data && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
            <AnalyticsCard label="Database Storage Used" value={`${summary.storageMb ?? 0} MB`} icon={Database} tone="text-emerald-300" />
            <AnalyticsCard label="Total Documents" value={formatNumber(summary.totalDocuments)} icon={Users} tone="text-sky-300" />
            <AnalyticsCard label="Total Collections" value={formatNumber(summary.totalCollections)} icon={Server} tone="text-violet-300" />
            <AnalyticsCard label="Total Index Size" value={`${summary.indexMb ?? 0} MB`} icon={HardDrive} tone="text-amber-300" />
          </div>
        )}
      </Panel>

      {!loading && !error && data && (
        <>
          <Panel title="Collection Analytics" subtitle="Important MongoDB collections by document volume.">
            <div className="space-y-2.5 sm:space-y-3">
              {collections.map((collection) => (
                <div key={collection.name} className="rounded-lg border border-white/10 bg-white/[0.03] p-3 sm:p-4">
                  <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2.5 sm:mb-3 sm:gap-3">
                    <div>
                      <p className="text-sm font-bold text-richblack-25">{collection.name}</p>
                      <p className="text-[11px] text-gray-500 sm:text-xs">
                        {formatNumber(collection.documents)} documents · {collection.storageMb} MB storage · {collection.indexMb} MB indexes
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-emerald-300 sm:text-sm">
                      {collection.percentOfDocuments}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.35)]"
                      style={{ width: `${Math.min(collection.percentOfDocuments, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Database Distribution" subtitle="Collections containing the most documents.">
            <div className="grid grid-cols-4 gap-2 rounded-lg border border-white/10 bg-white/[0.025] p-3 sm:flex sm:h-72 sm:items-end sm:gap-3 sm:p-4">
              {collections.slice(0, 8).map((collection) => (
                <div key={collection.name} className="flex flex-col items-center gap-1.5 sm:min-w-0 sm:flex-1 sm:gap-2">
                  <div className="flex h-20 w-full items-end rounded-md bg-white/[0.04] sm:h-48">
                    <div
                      className="w-full rounded-md bg-gradient-to-t from-emerald-500 to-cyan-300 shadow-[0_0_14px_rgba(52,211,153,0.22)]"
                      style={{ height: `${Math.max(collection.percentOfDocuments, 4)}%` }}
                      title={`${collection.name}: ${formatNumber(collection.documents)} documents`}
                    />
                  </div>
                  <p className="w-full truncate text-center text-[9px] text-gray-400 sm:text-xs" title={collection.name}>
                    {collection.name}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}

function EmailServiceAnalyticsContent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async ({ refresh = false } = {}) => {
    try {
      setLoading(true);
      setError("");
      setData(await fetchEmailServiceAnalytics({ refresh }));
    } catch (err) {
      setError(err?.message || "Failed to load email service analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const summary = data?.summary || {};
  const performance = data?.performance || {};
  const dailyLimit = summary.dailyLimit || 0;
  const sent = summary.sentToday || 0;
  const remaining = summary.remaining;
  const usagePercent = dailyLimit > 0 ? Math.min(Math.round((sent / dailyLimit) * 100), 100) : 0;

  return (
    <div className="space-y-3 sm:space-y-4">
      <Panel>
        <AnalyticsHeader
          title="Email Service"
          subtitle="Brevo transactional email usage and delivery health."
          updatedAt={data?.updatedAt}
          loading={loading}
          onRefresh={() => load({ refresh: true })}
          connected={data?.connected && !error}
        />
        {loading && <LoadingSkeleton />}
        {!loading && error && (
          <div className="rounded-lg border border-red-400/20 bg-red-500/10 p-4 text-xs text-red-200 sm:p-5 sm:text-sm">
            {error}
          </div>
        )}
        {!loading && !error && data && (
          <div className="space-y-4 sm:space-y-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
              <AnalyticsCard label="Emails Sent Today" value={formatNumber(sent)} icon={Mail} tone="text-sky-300" />
              <AnalyticsCard
                label="Daily Limit / Remaining"
                value={dailyLimit ? `${formatNumber(dailyLimit)} / ${formatNumber(remaining ?? 0)}` : "Not reported"}
                icon={CreditCard}
                tone="text-emerald-300"
                subtext={dailyLimit ? "limit / remaining" : "Set BREVO_DAILY_EMAIL_LIMIT for fallback"}
              />
              <AnalyticsCard label="Emails Delivered" value={formatNumber(summary.delivered)} icon={Shield} tone="text-violet-300" />
              <AnalyticsCard label="Failed / Bounced" value={formatNumber(summary.failed)} icon={RotateCcw} tone="text-red-300" />
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 sm:p-4">
              <div className="mb-2 flex items-center justify-between text-xs sm:text-sm">
                <span className="font-semibold text-gray-300">Email Usage</span>
                <span className="text-gray-400">
                  {dailyLimit ? `${formatNumber(sent)} / ${formatNumber(dailyLimit)} emails sent today` : `${formatNumber(sent)} emails sent today`}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.45)]"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              {remaining != null && (
                <p className="mt-2 text-xs text-emerald-300 sm:text-sm">
                  {formatNumber(remaining)} emails remaining
                </p>
              )}
            </div>
          </div>
        )}
      </Panel>

      {!loading && !error && data && (
        <>
          <Panel title="Email Performance" subtitle="Available Brevo SMTP metrics for today.">
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
              {[
                ["Delivery rate", `${performance.deliveryRate || 0}%`],
                ["Open rate", `${performance.openRate || 0}%`],
                ["Click rate", `${performance.clickRate || 0}%`],
                ["Bounce rate", `${performance.bounceRate || 0}%`],
                ["Unsubscribes", formatNumber(performance.unsubscribed)],
                ["Spam complaints", formatNumber(performance.spamReports)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 sm:p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 sm:text-xs">{label}</p>
                  <p className="mt-2 text-lg font-bold text-richblack-25 sm:text-2xl">{value}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Recent Email Activity" subtitle="Safe Brevo event metadata only. Recipient addresses and content are hidden.">
            {data.recentActivity?.length ? (
              <div className="divide-y divide-white/10 overflow-hidden rounded-lg border border-white/10">
                {data.recentActivity.map((event, index) => (
                  <div key={`${event.sentAt}-${index}`} className="grid gap-1 px-3 py-2.5 text-xs sm:gap-2 sm:px-4 sm:py-3 sm:text-sm md:grid-cols-[minmax(0,1fr)_140px_190px]">
                    <span className="truncate font-semibold text-richblack-25">{event.subject}</span>
                    <span className="capitalize text-emerald-300">{event.status}</span>
                    <span className="text-gray-400">
                      {event.sentAt ? new Date(event.sentAt).toLocaleString("en-IN") : "Time unavailable"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.025] p-6 text-center text-xs text-gray-400 sm:p-8 sm:text-sm">
                No recent safe email activity available from Brevo.
              </div>
            )}
            {(data.reportUnavailable || data.eventsUnavailable) && (
              <p className="mt-3 text-[11px] text-amber-200 sm:text-xs">
                Some Brevo analytics were unavailable: {data.reportUnavailable || data.eventsUnavailable}
              </p>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}

function Settings() {
  const [activeTab, setActiveTab] = useState("overview");
  const activeLabel = useMemo(
    () => allItems.find((item) => item.id === activeTab)?.label || "Overview",
    [activeTab],
  );

  return (
    <main className="h-screen w-full overflow-hidden bg-gradient-to-br from-[#181829] via-[#1d1e31] to-[#151a2a] px-2 pt-20 text-richblack-25 sm:px-4 sm:pt-20 lg:px-10 lg:pt-24">
      <div className="mx-auto flex h-full min-h-0 max-w-[1740px] flex-col">
        {/* <header className="mb-4 flex shrink-0 items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-richblack-700">
            <FiSettings className="text-base text-yellow-50" />
          </div>

          <h1 className="font-nunito text-[26px] font-bold tracking-normal text-richblack-25">
            Settings
          </h1>
        </header> */}

        <div className="grid min-h-0 w-full flex-1 grid-cols-[56px_minmax(0,1fr)] gap-2 sm:grid-cols-[64px_minmax(0,1fr)] sm:gap-3 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-6">
          <aside className="h-full min-h-0 overflow-y-auto rounded-lg border border-white/10 bg-white/[0.035] p-1.5 shadow-xl shadow-black/10 sm:p-2 lg:p-5 lg:scrollbar-thin lg:scrollbar-track-transparent lg:scrollbar-thumb-emerald-400/20 hover:lg:scrollbar-thumb-emerald-400/35">
            <div className="flex flex-col gap-2 lg:gap-6">
              <SidebarGroup
                title="Society Settings"
                tone="text-emerald-300"
                items={societyItems}
                activeTab={activeTab}
                onSelect={setActiveTab}
              />
              <SidebarGroup
                title="Personal Settings"
                tone="text-violet-300"
                items={personalItems}
                activeTab={activeTab}
                onSelect={setActiveTab}
              />
              <SidebarGroup
                title="Others"
                tone="text-amber-300"
                items={otherItems}
                activeTab={activeTab}
                onSelect={setActiveTab}
              />
            </div>
          </aside>

          <section
            className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden"
            aria-label={`${activeLabel} settings`}
          >
            <div className="min-h-0 flex-1 overflow-y-auto pr-1 sm:pr-2 lg:scrollbar-thin lg:scrollbar-track-transparent lg:scrollbar-thumb-emerald-400/20 hover:lg:scrollbar-thumb-emerald-400/35">
              {activeTab === "overview" ? (
                <OverviewContent onSelect={setActiveTab} />
              ) : activeTab === "cloudinary-storage" ? (
                <CloudinaryStorageContent />
              ) : activeTab === "database" ? (
                <DatabaseAnalyticsContent />
              ) : activeTab === "email-service" ? (
                <EmailServiceAnalyticsContent />
              ) : (
                <PlaceholderContent activeTab={activeTab} />
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default Settings;
