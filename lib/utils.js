import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount) {
  const num = typeof amount === 'number' ? amount : Number(amount);
  if (isNaN(num) || amount === null || amount === undefined) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatNumber(num) {
  const n = typeof num === 'number' ? num : Number(num);
  if (isNaN(n) || num === null || num === undefined) return '0';
  return new Intl.NumberFormat('en-IN').format(n);
}

export function formatDate(timestamp) {
  if (!timestamp) return 'Just now';
  
  let date;
  if (typeof timestamp === 'object' && timestamp.toDate) {
    date = timestamp.toDate();
  } else if (typeof timestamp === 'object' && timestamp.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'number' || typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else {
    return 'Recently';
  }

  if (isNaN(date.getTime())) return 'Recently';

  const now = new Date();
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function getStockStatus(quantity, reorderLevel) {
  const qty = Number(quantity) || 0;
  const reorder = Number(reorderLevel) || 5;

  if (qty === 0) {
    return {
      status: 'outofstock',
      label: 'Out of Stock',
      color: 'red',
      badgeClass: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/60',
      dotClass: 'bg-red-500 shadow-red-500/50',
      barClass: 'bg-red-500',
    };
  }

  if (qty <= reorder) {
    return {
      status: 'lowstock',
      label: 'Low Stock',
      color: 'amber',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
      dotClass: 'bg-amber-500 shadow-amber-500/50 animate-pulse',
      barClass: 'bg-amber-500',
    };
  }

  return {
    status: 'instock',
    label: 'In Stock',
    color: 'emerald',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    dotClass: 'bg-emerald-500 shadow-emerald-500/50',
    barClass: 'bg-emerald-500',
  };
}

export function generateSku(categoryName = 'GEN', itemName = 'ITEM') {
  const catPrefix = (categoryName || 'GEN')
    .replace(/[^a-zA-Z]/g, '')
    .substring(0, 3)
    .toUpperCase() || 'CAF';
  
  const itemWords = (itemName || 'ITM')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .split(/\s+/);
  
  let itemCode = '';
  if (itemWords.length >= 2) {
    itemCode = (itemWords[0].substring(0, 2) + itemWords[1].substring(0, 2)).toUpperCase();
  } else {
    itemCode = (itemWords[0] || 'ITM').substring(0, 3).toUpperCase();
  }

  const randomNum = Math.floor(100 + Math.random() * 900);
  return `${catPrefix}-${itemCode}-${randomNum}`;
}

export function exportToCsv(items, categories = []) {
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));
  
  const headers = [
    'SKU',
    'Product Name',
    'Category',
    'Quantity',
    'Unit',
    'Unit Price (INR ₹)',
    'Total Value (INR ₹)',
    'Reorder Level',
    'Stock Status',
    'Supplier',
    'Last Updated',
  ];

  const rows = items.map(item => {
    const status = getStockStatus(item.quantity, item.reorderLevel).label;
    const catName = categoryMap.get(item.categoryId) || 'Uncategorized';
    const totalVal = ((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)).toFixed(2);
    
    return [
      `"${item.sku || ''}"`,
      `"${(item.name || '').replace(/"/g, '""')}"`,
      `"${catName}"`,
      item.quantity || 0,
      `"${item.unit || 'units'}"`,
      (Number(item.unitPrice) || 0).toFixed(2),
      totalVal,
      item.reorderLevel || 5,
      `"${status}"`,
      `"${(item.supplier || '').replace(/"/g, '""')}"`,
      `"${formatDate(item.updatedAt)}"`,
    ];
  });

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `cafepulse_inventory_inr_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
