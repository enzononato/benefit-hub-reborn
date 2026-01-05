import revalleLogo from "@/assets/revalle-logo.png";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  message?: string;
}

export function LoadingSpinner({ size = "md", message }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-20 h-20",
    lg: "w-32 h-32",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        {/* Outer spinning ring */}
        <div
          className={`${sizeClasses[size]} rounded-full border-4 border-primary/20 border-t-primary animate-spin`}
        />
        {/* Logo in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src={revalleLogo}
            alt="Revalle"
            className={`${
              size === "sm" ? "w-6 h-6" : size === "md" ? "w-10 h-10" : "w-16 h-16"
            } object-contain animate-logo-pulse`}
          />
        </div>
      </div>
      {message && (
        <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
      )}
    </div>
  );
}

export function FullPageLoading({ message = "Carregando..." }: { message?: string }) {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <LoadingSpinner size="lg" message={message} />
    </div>
  );
}
