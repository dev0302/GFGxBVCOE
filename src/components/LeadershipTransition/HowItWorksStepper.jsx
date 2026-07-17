import { Activity, UserPlus, UserCheck, Users, CheckCircle } from "react-feather";

export default function HowItWorksStepper() {
  const steps = [
    {
      id: 1,
      title: "Start Session",
      desc: "Initiate a new transition session.",
      icon: Users,
      color: "text-emerald-400",
      bg: "bg-emerald-500/[0.08]",
      border: "border-emerald-500/20",
    },
    {
      id: 2,
      title: "Add Changes",
      desc: "Queue promotions or end current sessions.",
      icon: UserPlus,
      color: "text-violet-400",
      bg: "bg-violet-500/[0.08]",
      border: "border-violet-500/20",
    },
    {
      id: 3,
      title: "Collect Approvals",
      desc: "Get approvals from required members.",
      icon: UserCheck,
      color: "text-blue-400",
      bg: "bg-blue-500/[0.08]",
      border: "border-blue-500/20",
    },
    {
      id: 4,
      title: "Apply & Update",
      desc: "Apply changes and notify the team.",
      icon: CheckCircle,
      color: "text-cyan-400",
      bg: "bg-cyan-500/[0.08]",
      border: "border-cyan-500/20",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-3 sm:px-6 lg:px-10 mt-8 mb-12">
      <div className="rounded-[20px] border border-white/[0.06] bg-[#1e1e2f]/40 px-3 py-5 backdrop-blur-sm sm:rounded-[24px] sm:p-8">
        <div className="flex items-center gap-2.5 mb-7 sm:mb-10">
          <Activity className="h-4 w-4 text-cyan-400" />
          <h2 className="text-[15px] md:text-[20px] font-semibold text-gray-200">How leadership transition works</h2>
        </div>
        
        <div className="relative flex flex-row justify-between gap-1 sm:gap-4 md:gap-0">
          {steps.map((step, idx) => (
            <div key={step.id} className="relative z-10 flex min-w-0 flex-1 flex-col items-center text-center">
              {/* Connecting line right side */}
              {idx < steps.length - 1 && (
                <div className="absolute top-5 left-[calc(50%+1.35rem)] flex w-[calc(100%-2.7rem)] items-center -z-10 sm:top-7 sm:left-[calc(50%+2rem)] sm:w-[calc(100%-4rem)]">
                  <div className="h-[1px] w-full border-t border-dashed border-white/[0.15]" />
                  <div className="w-2 h-2 border-t border-r border-white/[0.3] rotate-45 -ml-1" />
                </div>
              )}
              
              <div className={`flex h-10 w-10 items-center justify-center rounded-full border ${step.border} ${step.bg} mb-3 bg-[#1a1a2e] sm:h-14 sm:w-14 sm:mb-4`}>
                <step.icon className={`h-4 w-4 sm:h-6 sm:w-6 ${step.color}`} strokeWidth={1.5} />
              </div>
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#252545] border border-white/[0.08] text-[9px] text-gray-400 mb-2 font-medium sm:h-8 sm:w-8 sm:text-[12px] sm:mb-3">
                {step.id}
              </div>
              <h3 className="min-h-[2.25rem] text-[10px] font-normal leading-tight text-gray-200 mb-1 sm:min-h-0 sm:text-[18px] sm:mb-2">{step.title}</h3>
              <p className="max-w-[72px] text-[9px] font-normal leading-snug text-gray-400 sm:max-w-[140px] sm:text-[14px] sm:leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
