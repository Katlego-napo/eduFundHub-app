import AuthLayout from "@/components/AuthLayout";
import SignupForm from "@/components/SignupForm";

export default function SignupPage() {
  return (
    <AuthLayout
      title="Create your account"
      subtitle="Save bursaries, papers, and track your application deadlines."
    >
      <SignupForm />
    </AuthLayout>
  );
}
