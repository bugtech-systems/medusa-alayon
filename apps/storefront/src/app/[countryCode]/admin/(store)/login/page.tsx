import { LoginForm } from "@/components/dashboard/login-form";
import { Container, Heading } from "@medusajs/ui";

export default async function LoginPage() {
  // Read cookies server-side

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <Container className="flex flex-col gap-4">
        <Heading level="h1" className="text-xl text-center">
          {process.env.NEXT_PUBLIC_DEMO_MODE === "true"
            ? "Log in as a demo admin"
            : "Log in to your Alayon account"}
        </Heading>
        <LoginForm />
      </Container>
    </div>
  );
}
