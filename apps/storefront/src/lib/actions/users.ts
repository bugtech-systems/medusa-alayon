"use server";

import { CreateDriverDTO, CreateCompanyEmployeeDTO } from "@/lib/types";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createSession, destroySession } from "@/lib/data1/sessions";
import { sdk } from "../config";
import {
  removeAuthToken,
  setAuthToken,
  getAuthHeaders,
  getCacheTag,
  getCacheOptions,
} from "../data/cookies"
import { createEmployee, retrieveMerchant } from "../data";
import { transferCart } from "../data/customer";
import { getCacheHeaders } from "../data1/cookies";

let country_code = process.env.NEXT_PUBLIC_DEFAULT_REGION;


type FormState =
  | {
      message?: string;
    }
  | undefined;

const redirecter = (actor_type: "company" | "driver") => {
  let redirectPatch;
  if (actor_type === "company") {
    redirectPatch = `/${country_code}/dashboard/company`;
  } else if (actor_type === "driver") {
    redirectPatch = `/${country_code}/dashboard/driver`;
  } else {
    redirectPatch = "/";
  }
  redirect(redirectPatch);
};

export async function logout() {
  await removeAuthToken();
  destroySession();
  redirect("/");
}

export async function signup(prevState: FormState, data: FormData) {
  const user_type = data.get("user_type") as string;
  const company_id = data.get("company_id") as string;
  const first_name = data.get("first_name") as string;
  const last_name = data.get("last_name") as string;
  const phone = data.get("phone") as string;
  const email = data.get("email") as string;
  const password = data.get("password") as string;
  const repeat_password = data.get("repeat_password") as string;



  if (password !== repeat_password) {
    return {
      message: "Passwords do not match",
    };
  }

  const actor_type = user_type as "company" | "driver";


  try {
  
    const company = await retrieveMerchant(company_id);
    


    // const token = await sdk.auth.register(actor_type, "emailpass", {
    //   email: email,
    //   password: password
    // })






    // await setAuthToken(token as string)
    // revalidateTag(await getCacheTag("users"));







    if (actor_type === "company" && company_id) {
      // createUserData.company_id = company_id;
        const customerForm = {
          email: email as string,
          first_name: first_name as string,
          last_name: last_name as string,
          phone: phone as string,
          company_name: company.name,
        }
      
          let token = await createAuthUser({
              email,
              password,
              actor_type,
              provider: "emailpass",
          
          })
    
    
    // createUserData.token = token
    
    
    
      console.log()
    
      
      
    const loginToken = await sdk.auth.login("company", "emailpass", {
      email: email,
      password,
    })
    await createSession(token as string);


    const customHeaders = { authorization: `Bearer ${loginToken}` }
      
    const { customer: createdCustomer } = await sdk.store.customer.create(
      customerForm,
      {},
      customHeaders
    )
      
       setAuthToken(token as string)

      
        console.log({
            company_id: company_id as string,
            customer_id: createdCustomer.id,
            is_admin: false,
            spending_limit: 0,
          }, 'HEEELL');
           await createEmployee({
            company_id: company_id as string,
            customer_id: createdCustomer.id,
            is_admin: true,
            spending_limit: 0,
          }).catch((err) => {
            console.log("error creating employee", err)
          })
          
          
    } else {
    
        const token = await createAuthUser({
      email,
      password,
      actor_type,
      provider: "emailpass",
    }).catch((error) => {
    console.log(error, 'ERRORs')
      throw new Error("Error creating auth user");
    });
    
    
        const createUserData: CreateUserType = {
      email,
      first_name,
      last_name,
      phone,
      actor_type,
      token,
      company_id: company_id
    };
    
    console.log(createUserData, 'user data')
    
        await createUser(createUserData).catch((error) => {
      throw new Error("Error creating user now");
    }); 
    
        setAuthToken(token as string)

    
    }



      // const loginToken = await sdk.auth.login(actor_type, "emailpass", {
      //   email: email,
      //   password,
      // })
      
  
    // revalidateTag(await getCacheTag("users"));
    // revalidateTag(await getCacheTag("customers"));
    revalidateTag(await getCacheTag("users"));
    // await transferCart()
  } catch (error) {
      console.log(error, 'ERRORs')
    return {
      message: "Error creating user end",
    };
  }

  redirecter(actor_type);
}

export async function login(prevState: FormState, data: FormData) {
  const email = data.get("email") as string;
  const password = data.get("password") as string;
  const actor_type = data.get("actor_type") as "company" | "driver";

  let token;

  try {
    token = await getToken({
      email,
      password,
      actor_type,
      provider: "emailpass",
    });
   
   
   console.log(token, 'TOKKENN')
   
   await destroySession();
    await createSession(token);

    revalidateTag(await getCacheTag("users"));
  } catch (error) {
  console.log('ERROR')
    return {
      message: "Invalid email or password",
    };
  }

  redirecter(actor_type);
}

export async function createAuthUser({
  email,
  password,
  actor_type,
  provider,
}: {
  email: string;
  password: string;
  actor_type: "company" | "driver";
  provider: "emailpass";
}) {


  const next = {
    ...(await getCacheOptions("users")),
  }


  const { token }: { token: string } = await sdk.client.fetch(
    `/auth/${actor_type}/${provider}/register`,
    {
      method: "POST",
      body: { entity_id: email, password, email },
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeaders())
      },
      next
    }
  );

  return token;
}

export type CreateUserType = (CreateDriverDTO | CreateCompanyEmployeeDTO) & {
  actor_type: string;
  company_id?: string;
  token: string;
};

export async function createUser(input: CreateUserType) {
  const { token, ...rest } = input;


  const next = {
    ...(await getCacheOptions("users")),
  }

  const res = await sdk.client.fetch("/store/users", {
    method: "POST",
    body: rest,
    headers: {
      "Content-Type": "application/json",
      ...(await getAuthHeaders()),
    },
    next
  });

  return res;
}

export async function getToken({
  email,
  password,
  actor_type,
  provider,
}: {
  email: string;
  password: string;
  actor_type: "company" | "driver";
  provider: "emailpass";
}) {

  const next = {
    ...(await getCacheOptions("users")),
  }

  const { token }: { token: string } = await sdk.client.fetch(
    `/auth/${actor_type}/${provider}`,
    {
      method: "POST",
      body: { email, password: password.toString() },
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeaders())
      },
      next
    }
  );
  
  
  return token;
}
