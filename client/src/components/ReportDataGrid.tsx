'use client';

import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { FileText } from 'lucide-react';

interface ReportDataGridProps {
  data: any[];
  columns: string[];
}

export default function ReportDataGrid({ data, columns }: ReportDataGridProps) {
  // Dynamically create column definitions from the result set keys
  const tableColumns = React.useMemo<ColumnDef<any>[]>(
    () =>
      columns.map((col) => ({
        header: col,
        accessorKey: col,
        cell: (info) => {
          const value = info.getValue();
          if (typeof value === 'number') {
            // Check if it looks like currency or just a large number
            return new Intl.NumberFormat('en-US', {
              maximumFractionDigits: 2,
            }).format(value);
          }
          return value;
        },
      })),
    [columns]
  );

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/50 text-slate-400">
        No data to display. Configure your report and run the query.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/50 overflow-hidden shadow-2xl">
      <div className="overflow-x-auto max-h-[700px]">
        <table className="w-full text-sm text-left relative">
          <thead className="text-xs uppercase bg-slate-800 text-slate-300 sticky top-0 z-10 shadow-sm border-b border-slate-700">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-6 py-4 font-semibold whitespace-nowrap">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-800/50 text-slate-300">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-slate-800/50 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-3 whitespace-nowrap tabular-nums">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-slate-800/80 px-4 py-3 border-t border-slate-700 text-xs text-slate-400 flex justify-between items-center">
        <span>Showing {data.length.toLocaleString()} rows</span>
        <span className="italic">Results limited to 10k rows</span>
      </div>
    </div>
  );
}
