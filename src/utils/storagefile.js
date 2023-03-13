const { StorageClient } = require("@supabase/storage-js");

const STORAGE_URL = "https://xgjahiyquzsfpqisbwwm.supabase.co/storage/v1";
const SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnamFoaXlxdXpzZnBxaXNid3dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY3ODY0Njg5NSwiZXhwIjoxOTk0MjIyODk1fQ.BZ6QvdJCoi1SzS296Kp5XUqCW5Y-PO_CauV2kdvmL40";

const storageClient = new StorageClient(STORAGE_URL, {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
});

module.exports = { storageClient };
