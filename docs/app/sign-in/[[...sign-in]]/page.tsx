import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center">
      <SignIn
        forceRedirectUrl="/dashboard"
        signUpUrl="/sign-up"
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-[#111111] border border-[#222222]"
          }
        }}
      />
    </div>
  );
}
