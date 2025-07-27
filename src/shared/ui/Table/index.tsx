'use client';
import React, { useState } from 'react';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from 'react-icons/md';
import { cn } from '@/shared/utils/utils';

interface TableProps<T extends object> {
  data: T[];
  columns: ColumnDef<T>[];
  pageSize?: number;
  headerStyles?: string;
  bodyStyles?: string;
  rowStyles?: string;
}

const Table = <T extends object>({
  data,
  columns,
  pageSize = 20,
  headerStyles = 'bg-transparent top-0 z-10',
  bodyStyles = 'bg-transparent',
  rowStyles,
}: TableProps<T>) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const mergeClassNameRowStyles = cn(
    'px-6 py-4 text-sm text-gray-500 whitespace-nowrap',
    rowStyles,
  );
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        pageSize,
        pageIndex: 0,
      },
    },
  });

  return (
    <div className="w-full overflow-x-auto">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden">
          <table className="min-w-full">
            <thead className={headerStyles}>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header, index) => (
                    <th
                      key={header.id}
                      className="px-6 py-3.5 text-sm font-semibold text-gray-900 cursor-pointer"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div
                        className={`flex items-center ${
                          index === headerGroup.headers.length - 1
                            ? 'justify-end'
                            : 'justify-start'
                        }`}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getIsSorted() && (
                          <span className="ml-2 relative">
                            {header.column.getIsSorted() === 'desc' ? (
                              <MdKeyboardArrowDown className="h-4 w-4" />
                            ) : (
                              <MdKeyboardArrowUp className="h-4 w-4" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className={`${bodyStyles} `}>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell, index) => (
                    <td key={cell.id} className={mergeClassNameRowStyles}>
                      <div
                        className={`flex ${
                          index === row.getVisibleCells().length - 1
                            ? 'justify-end'
                            : 'justify-start'
                        }`}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Table;
