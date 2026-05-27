import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { ProfileForm } from "@/components/profiles/profile-form";

export default function NewProfilePage() {
  return (
    <div className="animate-in fade-in duration-300 ease-out">
      <Link
        href="/profiles"
        className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white mb-4 animate-in fade-in slide-in-from-left-2 duration-300 ease-out"
      >
        <ArrowLeft className="size-3" />
        Back to profiles
      </Link>
      <div
        className="animate-in fade-in slide-in-from-bottom-2 duration-[400ms] ease-out"
        style={{ animationDelay: "60ms", animationFillMode: "backwards" }}
      >
        <PageHeading
          title="New profile"
          subtitle="Capture the ideal conditions for a flower species."
        />
      </div>
      <div
        className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out"
        style={{ animationDelay: "120ms", animationFillMode: "backwards" }}
      >
        <ProfileForm />
      </div>
    </div>
  );
}
