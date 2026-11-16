import AuthLayout from "@/components/AuthLayout";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to access quizzes and bursaries."
    >
      <LoginForm />
      <p className="mt-4 text-center text-sm">
        <a href="/forgot-password" className="font-medium text-primary hover:underline">
          Forgot your password?
        </a>
      </p>
    </AuthLayout>
  );
}
