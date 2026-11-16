import AuthLayout from "@/components/AuthLayout";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export const metadata = { title: "Forgot password | EduFund Hub" };

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a link to reset it."
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
