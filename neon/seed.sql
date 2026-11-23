insert into users (full_name, email, role, department, rank, active)
values
  ('Alex Morgan', 'alex.morgan@kccf.mil', 'Admin', 'Headquarters', 'Major', true),
  ('Jordan Blake', 'jordan.blake@kccf.mil', 'Supply Officer', 'Logistics', 'Captain', true),
  ('Taylor Reed', 'taylor.reed@kccf.mil', 'Personnel', 'Operations', 'Sergeant', true),
  ('Casey Young', 'casey.young@kccf.mil', 'Personnel', 'Training', 'Corporal', true)
on conflict (email) do update set
  full_name = excluded.full_name,
  role = excluded.role,
  department = excluded.department,
  rank = excluded.rank,
  active = excluded.active;

insert into inventory
  (name, category, item_type, quantity, available_quantity, issued_quantity, damaged_quantity, condition, status, storage_location, min_stock_level, unit, description)
values
  ('M4A1 Training Rifle', 'Small Arms', 'Armory Equipment', 24, 18, 6, 0, 'Excellent', 'Available', 'Armory A-1', 5, 'rifles', 'Standard training rifle'),
  ('Ballistic Vest, IIIA', 'Protective Gear', 'Armory Equipment', 40, 31, 8, 1, 'Good', 'Available', 'Armory B-3', 8, 'vests', 'Level IIIA soft armor vest'),
  ('Tactical Radio PRC-152', 'Communication', 'Armory Equipment', 16, 12, 4, 0, 'Excellent', 'Available', 'Comms Cage C-2', 3, 'radios', 'Portable field radio'),
  ('Night Vision Monocular', 'Optics', 'Armory Equipment', 12, 7, 5, 0, 'Good', 'Issued', 'Armory D-4', 3, 'units', 'Single-eye night vision device'),
  ('First Aid Kit', 'Medical', 'Other Supplies', 60, 52, 6, 2, 'Good', 'Available', 'Supply Room 2', 12, 'kits', 'Combat lifesaver first aid kit'),
  ('Field Rations - MRE', 'Rations', 'Other Supplies', 240, 198, 42, 0, 'Excellent', 'Available', 'Storeroom 1', 50, 'cases', '24-hour meal ration cases'),
  ('Camouflage Uniform Set', 'Clothing', 'Other Supplies', 100, 84, 16, 0, 'Good', 'Available', 'Supply Room 4', 20, 'sets', 'Woodland camouflage set'),
  ('Portable Generator', 'Equipment', 'Other Supplies', 8, 5, 2, 1, 'Fair', 'Under-maintenance', 'Maintenance Yard', 2, 'units', '5 kW portable generator');

insert into transactions
  (inventory_id, transaction_type, quantity, source_destination, reference_number, notes, performed_by)
select i.id, 'Receiving', i.quantity, 'Central Logistics Depot', 'RCV-' || substr(i.id::text, 1, 8),
       'Opening inventory receipt', 'Jordan Blake'
from inventory i;

insert into requests
  (requested_by, inventory_id, item_name, quantity, purpose, status, requested_at)
select 'Sergeant Taylor Reed', i.id, i.name, 2, 'Field exercise support',
       (case when i.name = 'Portable Generator' then 'Approved' else 'Pending' end)::request_status,
       now() - interval '2 days'
from inventory i
where i.name in ('Tactical Radio PRC-152', 'Portable Generator', 'First Aid Kit');

insert into issuances
  (inventory_id, issued_to, quantity, purpose, due_at, status, reference_number, issued_by)
select i.id,
       'Corporal Casey Young',
       least(i.issued_quantity, 2),
       'Weekend field training',
       now() + interval '7 days',
       'Issued',
       'ISS-' || substr(i.id::text, 1, 8),
       'Jordan Blake'
from inventory i
where i.issued_quantity > 0
limit 4;
