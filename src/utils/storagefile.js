const { StorageClient } = require("@supabase/storage-js");

const STORAGE_URL = "https://ahcdgbavrhtcenpncmmx.supabase.co/storage/v1";
const SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoY2RnYmF2cmh0Y2VucG5jbW14Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY3Mzg5NzA5NiwiZXhwIjoxOTg5NDczMDk2fQ.h5ekdNdurY5UbgV3RKzHlyDQySwhElO5d3xqmta5N0E";

const storageClient = new StorageClient(STORAGE_URL, {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
});

module.exports = { storageClient };
