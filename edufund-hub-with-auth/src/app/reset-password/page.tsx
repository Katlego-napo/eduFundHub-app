import AuthLayout from "@/components/AuthLayout";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export const metadata = { title: "Reset password | EduFund Hub" };

export default function ResetPasswordPage() {
  return (
    <AuthLayout title="Set a new password" subtitle="Choose a new password for your account.">
      <ResetPasswordForm />
    </AuthLayout>
  );
}
