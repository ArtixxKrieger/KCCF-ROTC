export type InventoryStatus =
  | "Available"
  | "Issued"
  | "Damaged"
  | "Under-maintenance";

export type InventoryItem = {
  id: string;
  name: string;
  category: string;
  item_type: "Armory Equipment" | "Other Supplies";
  quantity: number;
  available_quantity: number;
  issued_quantity: number;
  damaged_quantity: number;
  condition: "Excellent" | "Good" | "Fair" | "Damaged";
  status: InventoryStatus;
  storage_location: string;
  min_stock_level: number;
  unit: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type Transaction = {
  id: string;
  inventory_id: string | null;
  transaction_type: "Receiving" | "Issuance" | "Return" | "Adjustment";
  quantity: number;
  source_destination: string | null;
  reference_number: string | null;
  notes: string | null;
  performed_by: string | null;
  created_at: string;
};

export type RequestItem = {
  id: string;
  requested_by: string;
  inventory_id: string | null;
  item_name: string;
  quantity: number;
  purpose: string | null;
  status: "Pending" | "Approved" | "Rejected";
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
};

export type Issuance = {
  id: string;
  inventory_id: string;
  issued_to: string;
  quantity: number;
  purpose: string | null;
  issued_at: string;
  due_at: string | null;
  returned_at: string | null;
  condition_on_return: "Excellent" | "Good" | "Fair" | "Damaged" | "Missing" | null;
  status: "Issued" | "Returned" | "Overdue" | "Damaged" | "Missing";
  reference_number: string | null;
  issued_by: string | null;
};

export type AppUser = {
  id: string;
  full_name: string;
  email: string;
  role: "Admin" | "Supply Officer" | "Personnel";
  active: boolean;
  created_at: string;
};
