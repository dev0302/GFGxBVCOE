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
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-10 mt-8 mb-12">
      <div className="rounded-[24px] border border-white/[0.06] bg-[#1e1e2f]/40 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 mb-10">
          <Activity className="h-4 w-4 text-cyan-400" />
          <h2 className="text-[15px] md:text-[20px] font-semibold text-gray-200">How leadership transition works</h2>
        </div>
        
        <div className="relative flex flex-col md:flex-row justify-between gap-6 md:gap-0">
          {steps.map((step, idx) => (
            <div key={step.id} className="relative z-10 flex flex-col items-center text-center flex-1">
              {/* Connecting line right side for desktop */}
              {idx < steps.length - 1 && (
                <div className="hidden md:flex absolute top-7 left-[calc(50%+2rem)] w-[calc(100%-4rem)] items-center -z-10">
                  <div className="h-[1px] w-full border-t border-dashed border-white/[0.15]" />
                  <div className="w-2 h-2 border-t border-r border-white/[0.3] rotate-45 -ml-1" />
                </div>
              )}
              
              <div className={`flex h-14 w-14 items-center justify-center rounded-full border ${step.border} ${step.bg} mb-4 bg-[#1a1a2e]`}>
                <step.icon className={`h-6 w-6 ${step.color}`} strokeWidth={1.5} />
              </div>
              <div className="flex h-6 w-6 md:h-8 md:w-8 items-center justify-center rounded-full bg-[#252545] border border-white/[0.08] text-[10px] md:text-[12px] text-gray-400 mb-3 font-medium">
                {step.id}
              </div>
              <h3 className="text-[12px] md:text-[18px] font-normal text-gray-200 mb-2">{step.title}</h3>
              <p className="text-[11px] md:text-[14px] font-normal text-gray-400 max-w-[140px] leading-relaxed">
                {step.desc}
              </p>
              {/* Arrow for mobile between steps */}
              {idx < steps.length - 1 && (
                <div className="md:hidden mt-6 flex flex-col items-center">
                  <div className="h-8 w-[1px] border-l border-dashed border-white/[0.15]" />
                  <div className="w-2 h-2 border-b border-r border-white/[0.3] rotate-45 -mt-1" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
