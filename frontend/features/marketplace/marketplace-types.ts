import type { CatalogJobPost, CatalogPackage, CreateJobPostRequest, CreatePackageRequest, UpdateJobPostRequest, UpdatePackageRequest } from "shared/schemas";

export type MarketplaceFormMode = "create" | "edit";

export type PackageFormValues = CreatePackageRequest;

export type JobFormValues = CreateJobPostRequest;

export type PackageRecord = CatalogPackage;
export type JobRecord = CatalogJobPost;
export type PackageUpdate = UpdatePackageRequest;
export type JobUpdate = UpdateJobPostRequest;

