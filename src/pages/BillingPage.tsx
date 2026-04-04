import React from 'react';
import { CreditCard, Check, Shield, Zap, Download, ExternalLink, Plus } from 'lucide-react';

export const BillingPage: React.FC = () => {
  const invoices = [
    { id: 'INV-001', date: '2024-03-01', amount: '$120.00', status: 'Paid' },
    { id: 'INV-002', date: '2024-02-01', amount: '$120.00', status: 'Paid' },
    { id: 'INV-003', date: '2024-01-01', amount: '$120.00', status: 'Paid' },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <header className="px-6 py-4 border-b border-gray-200 dark:border-border-dark">
        <h1 className="text-lg font-semibold">Billing & Subscription</h1>
        <p className="text-sm text-gray-400">Manage your organization's plan and payment methods.</p>
      </header>

      <div className="p-6 space-y-8 max-w-5xl">
        {/* Current Plan */}
        <div className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">Current Plan</span>
                <h2 className="text-2xl font-bold">Standard Plan</h2>
              </div>
              <p className="text-sm text-gray-400">Your next billing date is <strong>April 1, 2024</strong> for <strong>$120.00</strong>.</p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 rounded-lg border border-gray-200 dark:border-border-dark text-sm font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition-all">Cancel Plan</button>
              <button className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">Upgrade Plan</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-8 border-t border-gray-100 dark:border-border-dark">
            <div className="space-y-1">
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Users</p>
              <p className="text-lg font-bold">10 / Unlimited</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Storage</p>
              <p className="text-lg font-bold">2.4 GB / 10 GB</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Billing Cycle</p>
              <p className="text-lg font-bold">Monthly</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Method */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Payment Method</h3>
            <div className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-8 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                  <CreditCard size={20} className="text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-bold">Visa ending in 4242</p>
                  <p className="text-xs text-gray-400">Expires 12/26</p>
                </div>
              </div>
              <button className="text-xs text-primary font-bold hover:underline">Edit</button>
            </div>
            <button className="text-xs text-primary font-bold flex items-center gap-1 hover:underline">
              <Plus size={12} /> Add new payment method
            </button>
          </div>

          {/* Billing Email */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Billing Email</h3>
            <div className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-xl p-4 flex items-center justify-between">
              <p className="text-sm font-medium">billing@linearis.app</p>
              <button className="text-xs text-primary font-bold hover:underline">Change</button>
            </div>
            <p className="text-[10px] text-gray-400 italic">Invoices will be sent to this address.</p>
          </div>
        </div>

        {/* Invoice History */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Invoice History</h3>
          <div className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-black/10 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-200 dark:border-border-dark">
                <tr>
                  <th className="px-6 py-3">Invoice ID</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-border-dark">
                {invoices.map(invoice => (
                  <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium">{invoice.id}</td>
                    <td className="px-6 py-4 text-gray-400">{invoice.date}</td>
                    <td className="px-6 py-4 font-bold">{invoice.amount}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold uppercase">{invoice.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400">
                        <Download size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
