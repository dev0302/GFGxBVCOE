import MemberEnrollForm from "../components/MemberEnrollForm";

export default function MemberEnrollment() {
  return (
    <div className="min-h-full bg-[#1e1e2f] px-4 pb-16 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">GFG BVCOE</p>
          <h1 className="mt-3 text-3xl font-bold text-richblack-25 sm:text-4xl">Join VectorVision</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-gray-400 sm:text-base">
            Complete your face enrollment to help recognize society members in event photos.
          </p>
        </div>
        <MemberEnrollForm />
      </div>
    </div>
  );
}
