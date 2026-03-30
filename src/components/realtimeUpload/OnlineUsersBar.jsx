import UserAvatar from "./UserAvatar";

export default function OnlineUsersBar({
  users = [],
  currentUserId,
  onAvatarClick,
  registerAvatarRef,
  selfAnchorRef,
}) {
  const peers = users.filter((u) => u?.id && u.id !== currentUserId);

  return (
    <div className="rounded-xl border border-gray-500/25 bg-[#252536]/60 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
          Realtime transfer
        </p>
        <span ref={selfAnchorRef} className="inline-flex h-2.5 w-2.5 rounded-full bg-cyan-300/70" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {peers.length ? (
          peers.map((u) => (
            <UserAvatar
              key={u.id}
              user={u}
              registerRef={registerAvatarRef}
              onClick={() => onAvatarClick?.(u)}
            />
          ))
        ) : (
          <span className="text-xs text-gray-500">No other users online</span>
        )}
      </div>
    </div>
  );
}
