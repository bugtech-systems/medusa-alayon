"use server"

import { sdk } from "@/lib/config"
import {
  getAuthHeaders,
  getCacheOptions,
  getCacheTag,
} from "@/lib/data/cookies"
import {
  StoreCompaniesResponse,
  StoreCompanyResponse,
  StoreCreateCompany,
  StoreCreateEmployee,
  StoreEmployeeResponse,
  StoreUpdateCompany,
  StoreUpdateEmployee,
} from "@/types"
import { track } from "@vercel/analytics/server"
import { revalidateTag } from "next/cache"
import { getCacheHeaders } from '../data1/cookies';
import { CompanyDTO } from "../types"

export const retrieveMerchant = async (
  companyId: string
): Promise<CompanyDTO> => {
  const { company }: { company: CompanyDTO } = await sdk.client.fetch(
    `/store/merchants/${companyId}`,
    {
      method: "GET",
      headers: {
        ...getCacheHeaders("merchants"),
      },
    }
  );

  return company;
}

export const retrieveCompany = async (companyId: string) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("companies")),
  }

  const { company } = await sdk.client.fetch<StoreCompanyResponse>(
    `/store/merchants/${companyId}`,
    {
      query: {
        fields:
          "+spending_limit_reset_frequency,*employees.customer,*approval_settings",
      },
      method: "GET",
      headers,
      next,
    }
  )

  return company
}

export const listCompanies = async (
  filter?: Record<string, string>
): Promise<CompanyDTO[]>  => {
  const query = new URLSearchParams(filter).toString();

  const { companies }: { companies: CompanyDTO[] } =
    await sdk.client.fetch(`/store/merchants?${query}`, {
      method: "GET",
      headers: {
        ...getCacheHeaders("companies"),
      },
    });
    

  return companies;
}

export async function retrieveCompanyByHandle(
  handle: string
): Promise<CompanyDTO> {
  const { companies }: { companies: CompanyDTO[] } =
    await sdk.client.fetch(`/store/merchants?handle=${handle}`, {
      method: "GET",
      headers: {
        ...getCacheHeaders("companies"),
      },
    });


  return companies[0];
}


export const createCompany = async (data: StoreCreateCompany) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const {
    companies: [company],
  } = await sdk.client.fetch<StoreCompaniesResponse>(`/store/companies`, {
    method: "POST",
    body: data,
    headers,
  })

  track("company_created", {
    company_id: company.id,
    company_name: company.name,
  })

  const cacheTag = await getCacheTag("companies")
  revalidateTag(cacheTag)

  return company
}

export const updateCompany = async (data: StoreUpdateCompany) => {
  const { id, ...companyData } = data

  const headers = {
    ...(await getAuthHeaders()),
  }

  const company = await sdk.client.fetch<StoreCompanyResponse>(
    `/store/companies/${id}`,
    {
      method: "POST",
      body: companyData,
      headers,
    }
  )

  const cacheTag = await getCacheTag("companies")
  revalidateTag(cacheTag)

  return company
}



export const createEmployee = async (data: StoreCreateEmployee) => {
  const { company_id, ...employeeData } = data

  const headers = {
    ...(await getAuthHeaders()),
  }

  const employee = await sdk.client.fetch<StoreEmployeeResponse>(
    `/store/companies/${company_id}/employees`,
    {
      method: "POST",
      body: employeeData,
      headers,
    }
  )

  track("employee_created", {
    employee_id: employee.employee.id,
  })

  const cacheTag = await getCacheTag("companies")
  revalidateTag(cacheTag)

  return employee
}

export const updateEmployee = async (data: StoreUpdateEmployee) => {
  const { id, company_id, ...employeeData } = data

  const headers = {
    ...(await getAuthHeaders()),
  }

  const employee = await sdk.client.fetch<StoreEmployeeResponse>(
    `/store/companies/${company_id}/employees/${id}`,
    {
      method: "POST",
      body: employeeData,
      headers,
    }
  )

  const cacheTag = await getCacheTag("companies")
  revalidateTag(cacheTag)

  return employee
}

export const deleteEmployee = async (companyId: string, employeeId: string) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.client.fetch(
    `/store/companies/${companyId}/employees/${employeeId}`,
    {
      method: "DELETE",
      headers,
    }
  )

  const cacheTag = await getCacheTag("companies")
  revalidateTag(cacheTag)
}

export const updateApprovalSettings = async (
  companyId: string,
  requiresAdminApproval: boolean
) => {
  const headers = {
    ...(await getAuthHeaders()),
    "Content-Type": "application/json",
    Accept: "plain/text",
  }

  await sdk.client.fetch(`/store/companies/${companyId}/approval-settings`, {
    method: "POST",
    body: {
      requires_admin_approval: requiresAdminApproval,
    },
    headers,
  })

  const cacheTag = await getCacheTag("companies")
  revalidateTag(cacheTag)
}
