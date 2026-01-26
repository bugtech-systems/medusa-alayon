import AccountBadge from "@/components/dashboard/account-badge";
import DeliveryColumn from "@/components/dashboard/delivery-column";
import RealtimeClient from "@/components/dashboard/realtime-client";
import CompanyStatus from "@/components/dashboard/company/company-status";
import { retrieveCompany, retrieveMerchant } from "@/lib/data";
import { retrieveRestaurant, retrieveUser } from "@/lib/data1";
import { DeliveryStatus, CompanyEmployeeDTO } from "@/lib/types";
import { Container, Heading, StatusBadge, Text } from "@medusajs/ui";
import { Link } from "next-view-transitions";
import { notFound, redirect } from "next/navigation";
import { EditCompanyDrawer } from "@/components/dashboard/company/company-profile-drawer";

export default async function RestaurantDashboardPage() {
  const user = (await retrieveUser()) as CompanyEmployeeDTO;

console.log(user, 'USERR')


  if (!user || !user.id.includes("emp_")) {
    redirect("/admin/login");
  }


  if (!user.company_id) {
    return notFound();
  }


  const companyId = user.company_id;
  const company = await retrieveMerchant(companyId);
  console.log(company, 'COMPANY')
  
  
  const { name, deliveries, is_open } = company;

  return (
    <>
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-2">
          <Heading level="h1" className="text-2xl">
            {name} | Store Dashboard
          </Heading>
          <Text>View and manage your store&apos;s orders.</Text>
        </div>
        <Container className="grid grid-cols-1 md:grid-cols-3 p-6 md:p-8 gap-4">
          <div className="flex flex-col justify-between gap-2">
            <Text className="font-semibold">Store Status</Text>
            <div className="flex gap-2">
              <Text>Store status: </Text>{" "}
              <StatusBadge
                color={is_open ? "green" : "red"}
                className="flex pl-1 pr-2 py-1 gap-1 w-fit"
              >
                {is_open ? "Taking orders" : "Closed"}
              </StatusBadge>
                <CompanyStatus company={company} />
            </div>
            <div className="flex gap-2">
              <Text>Connection status: </Text>{" "}
              <RealtimeClient companyId={companyId} />
            </div>
          </div>
          <div className="justify-center hidden md:flex">
            {process.env.NEXT_PUBLIC_DEMO_MODE !== "true" && (
              <div className="flex flex-col justify-between">
                <Text className="font-semibold">Quick actions</Text>
                <Link
                  href="/dashboard/company/menu"
                  className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover text-sm"
                >
                  Edit menu
                </Link>
                <Text
                  className="text-ui-fg-disabled text-sm"
                  aria-disabled={true}
                >
                  Edit settings
                </Text>

                <EditCompanyDrawer
                  company={company}
                  children={
                    <Text
                  className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover text-sm"
                >
                  Edit profile
                </Text>
                  }
                />
              </div>
            )}
          </div>
          <div className="flex md:justify-end">
            <AccountBadge data={company} type="company" />
          </div>
        </Container>
      </div>

      <div className="overflow-x-auto whitespace-nowrap">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-px">
          <DeliveryColumn
            title="Incoming orders"
            deliveries={deliveries}
            statusFilters={[
              DeliveryStatus.PENDING,
              DeliveryStatus.RESTAURANT_ACCEPTED,
            ]}
            type="company"
          />
          <DeliveryColumn
            title="Ready to prepare"
            deliveries={deliveries}
            statusFilters={[DeliveryStatus.PICKUP_CLAIMED]}
            type="company"
          />
          <DeliveryColumn
            title="Preparing"
            deliveries={deliveries}
            statusFilters={[DeliveryStatus.RESTAURANT_PREPARING]}
            type="company"
          />
          <DeliveryColumn
            title="In transit"
            deliveries={deliveries}
            statusFilters={[
              DeliveryStatus.READY_FOR_PICKUP,
              DeliveryStatus.IN_TRANSIT,
            ]}
            type="company"
          />
          <DeliveryColumn
            title="Completed"
            deliveries={deliveries}
            statusFilters={[
              DeliveryStatus.DELIVERED,
              DeliveryStatus.RESTAURANT_DECLINED,
            ]}
            type="company"
          />
        </div>
      </div>
    </>
  );
}
