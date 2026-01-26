import { SignupForm } from "@/components/dashboard/signup-form";
import { Container, Heading } from "@medusajs/ui";
import { listCompanies } from "@/lib/data";

export default async function SignupPage() {
  const companies = await listCompanies();

  return (
    <Container className="flex flex-col gap-4">
      <Heading level="h1" className="text-xl">
        Create your Medusa Eats account
      </Heading>
      <SignupForm companies={companies} />
    </Container>
  );
}
