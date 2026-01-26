import CompanyCategory from "@/components/store/restaurant/restaurant-category";
import { listCompanies } from "@/lib/data/companies";
import { Heading } from "@medusajs/ui";

export default async function Home() {
  const companies = await listCompanies();


  if (!companies) {
    return <Heading level="h1">No store open near you</Heading>;
  }

  return (
    <div className="flex flex-col gap-8">
      <CompanyCategory companies={companies} />
    </div>
  );
}
