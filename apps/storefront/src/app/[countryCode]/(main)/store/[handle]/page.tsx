import { listCategories } from "@/lib/data/categories"
import { retrieveCustomer } from "@/lib/data/customer"
import SkeletonProductGrid from "@/modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@/modules/store/components/refinement-list"
import { SortOptions } from "@/modules/store/components/refinement-list/sort-products"
import StoreBreadcrumb from "@/modules/store/components/store-breadcrumb"
import PaginatedProducts from "@/modules/store/templates/paginated-products"
import { Metadata } from "next"
import { Suspense } from "react"

import RestaurantCategories from "@/components/store/restaurant/restaurant-categories";
import { retrieveCompanyByHandle } from "@/lib/data";
import {  Text } from "@medusajs/ui";
import { notFound } from "next/navigation";

type Params = {
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
  }>
  params: Promise<{
    countryCode?: string
    handle?: any
  }>
}

export default async function RestaurantPage(props: Params) {
  const searchParams = await props.searchParams
  const params = await props.params
  const { sortBy, page } = searchParams
  
  const sort = sortBy || "created_at"
  const pageNumber = page ? parseInt(page) : 1

  const company = await retrieveCompanyByHandle(params.handle);
  if (!company) return notFound();

  // Fetch all available categories
  const categoriesData = await listCategories();
  
  // Create a map for quick lookup of category objects by ID
  const categoryMap = new Map();
  categoriesData?.forEach(category => {
    if (category?.id) {
      categoryMap.set(category.id, category);
    }
  });

  // Initialize data structures
  const categories: any[] = [];
  const processedCategoryIds = new Set<string>();

  // Process products and their categories
  company.products?.forEach((product) => {
    if (product.categories) {
      product.categories.forEach((productCategory) => {
        const categoryId = productCategory?.id;
        
        if (!categoryId || processedCategoryIds.has(categoryId)) {
          return; // Skip if no ID or already processed
        }

        // Find the full category object from categoriesData
        const fullCategory = categoryMap.get(categoryId);
        
        if (fullCategory) {
          // Get all products for this category
          const categoryProducts = company.products?.filter(p => 
            p.categories?.some(c => c?.id === categoryId)
          ) || [];

          // Add the enriched category to the array
          categories.push({
            ...fullCategory,
            products: categoryProducts,
            // Preserve category_children if they exist
            category_children: fullCategory.category_children || []
          });
          
          processedCategoryIds.add(categoryId);
        }
      });
    }
  });

  const customer = await retrieveCustomer();

  return (
    <div className="bg-neutral-100">
      <div
        className="flex flex-col py-6 content-container gap-4"
        data-testid="category-container"
      >
        <StoreBreadcrumb />
        <div className="flex flex-col small:flex-row small:items-start gap-3">
          <RefinementList sortBy={sort} categories={categories} />
          <div className="w-full">
            <Suspense fallback={<SkeletonProductGrid />}>
              <PaginatedProducts
                sortBy={sort}
                page={pageNumber}
                countryCode={params.countryCode}
                customer={customer}
                company={company}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}