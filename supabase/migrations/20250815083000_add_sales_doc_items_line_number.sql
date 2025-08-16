-- Add line_number column to sales_doc_items
-- This migration adds an integer line_number (item position) with a default value of 0

alter table sales_doc_items
  add column if not exists line_number integer not null default 0;

-- Optional index to speed up queries by sales_doc_id + line_number
create index if not exists idx_sales_doc_items_doc_line on sales_doc_items (sales_doc_id, line_number);
