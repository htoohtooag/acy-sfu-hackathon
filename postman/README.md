# Freelancer sample work Postman data

Import the collection and environment, then set `freelancerToken` to a current Supabase bearer token for a user with a freelancer profile. Set `freelancerProfileId` to that profile UUID and set `sampleImagePath` to a local JPEG, PNG, or WebP file no larger than 10 MB.

Run Create sample work first. Copy the returned `data.id` into `sampleId`, then run the edit, replacement, reorder, public profile, and delete requests. The order request must contain every owned sample ID exactly once. For a single sample, the example order is valid. Do not commit real tokens or private keys.

Before uploads, create the private Supabase Storage bucket named by `SUPABASE_FREELANCER_SAMPLE_WORK_BUCKET`, normally `freelancer-sample-work`, and set its image content type and object size limits. The API owns all upload, delete, and signed URL operations.
