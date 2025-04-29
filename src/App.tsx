import { Authenticated, Unauthenticated } from "convex/react";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { VideoEditor } from "./VideoEditor";
import { Toaster } from "sonner";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm p-4 flex justify-between items-center border-b">
        <h2 className="text-xl font-semibold accent-text">Video Editor</h2>
        <SignOutButton />
      </header>
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-7xl mx-auto">
          <Authenticated>
            <VideoEditor />
          </Authenticated>
          <Unauthenticated>
            <div className="text-center">
              <h1 className="text-5xl font-bold accent-text mb-4">Video Editor</h1>
              <p className="text-xl text-slate-600 mb-8">Sign in to start editing</p>
              <SignInForm />
            </div>
          </Unauthenticated>
        </div>
      </main>
      <Toaster />
    </div>
  );
}
