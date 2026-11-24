import { useState } from 'react';
import { AlertTriangle, CheckCircle, Calendar, IndianRupee } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useT } from '../hooks/useT';
import { salons } from '../data/salons';

export function SalonPortalPage() {
  const { paySalonCommission } = useApp();
  const tr = useT();
  const [selectedSalon, setSelectedSalon] = useState('');

  const salon = salons.find((s) => s.id === selectedSalon);
  const now = new Date();

  function getDaysLeft(paidUntil: string): number {
    const deadline = new Date(paidUntil);
    deadline.setDate(deadline.getDate() + 5);
    return Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  function isOverdue(s: typeof salons[0]): boolean {
    if (!s.commissionPaidUntil) return false;
    const graceEnd = new Date(s.commissionPaidUntil);
    graceEnd.setDate(graceEnd.getDate() + 5);
    return now > graceEnd && (s.commissionDue ?? 0) > 0;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl gold-gradient">{tr('salonPortal')}</h1>
      <p className="mt-2 text-[#9a8fa8]">{tr('salonOwner')}</p>

      <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <p className="text-sm font-medium text-amber-200">{tr('commissionWarning')}</p>
            <p className="mt-1 text-xs text-amber-200/70">
              {tr('monthlyFee')} · {tr('deadline')}: 1st of each month · {tr('gracePeriod')}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 luxe-card p-6">
        <label className="text-sm text-[#9a8fa8]">{tr('selectSalon')}</label>
        <select
          value={selectedSalon}
          onChange={(e) => setSelectedSalon(e.target.value)}
          className="luxe-input mt-2"
        >
          <option value="">Choose your salon...</option>
          {salons.map((s) => (
            <option key={s.id} value={s.id}>{s.name} — {s.area}</option>
          ))}
        </select>

        {salon && (
          <div className="mt-6 space-y-4 animate-fade-in">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-[#0f0d12]/60 p-4">
                <p className="text-xs text-[#9a8fa8]">{tr('monthlyFee')}</p>
                <p className="mt-1 flex items-center gap-1 font-display text-2xl text-[#c9a962]">
                  <IndianRupee className="h-5 w-5" />
                  {(salon.commissionDue ?? 0).toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-[#9a8fa8]">{tr('amountDue')}</p>
              </div>
              <div className="rounded-lg bg-[#0f0d12]/60 p-4">
                <p className="text-xs text-[#9a8fa8]">{tr('lastPaid')}</p>
                <p className="mt-1 flex items-center gap-1 font-display text-xl text-[#e8d5a3]">
                  <Calendar className="h-5 w-5 text-[#c9a962]" />
                  {salon.commissionPaidUntil ?? 'N/A'}
                </p>
                {salon.commissionPaidUntil && (
                  <p className={`text-xs ${getDaysLeft(salon.commissionPaidUntil) <= 5 ? 'text-red-400' : 'text-[#9a8fa8]'}`}>
                    {getDaysLeft(salon.commissionPaidUntil)} {tr('daysLeft')}
                  </p>
                )}
              </div>
            </div>

            {isOverdue(salon) ? (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                {tr('salonRemoved')}
              </div>
            ) : (salon.commissionDue ?? 0) > 0 ? (
              <button
                onClick={() => paySalonCommission(salon.id)}
                className="luxe-btn w-full flex items-center justify-center gap-2"
              >
                <IndianRupee className="h-5 w-5" /> {tr('payNow')} — {tr('payCommission')}
              </button>
            ) : (
              <div className="flex items-center gap-2 rounded-lg bg-green-500/10 p-4 text-green-400">
                <CheckCircle className="h-5 w-5" /> {tr('commissionPaid')}
              </div>
            )}
          </div>
        )}
      </div>

      <section className="mt-8">
        <h2 className="mb-4 font-display text-xl text-[#e8d5a3]">{tr('activeSalons')}</h2>
        <div className="space-y-2">
          {salons.map((s) => {
            const overdue = isOverdue(s);
            const due = (s.commissionDue ?? 0) > 0;
            return (
              <div key={s.id} className={`flex items-center justify-between rounded-lg px-4 py-3 ${
                overdue ? 'bg-red-500/10 border border-red-500/20' :
                due ? 'bg-amber-500/10 border border-amber-500/20' :
                'bg-green-500/5 border border-green-500/10'
              }`}>
                <span className="text-sm">{s.name} <span className="text-xs text-[#9a8fa8] font-mono">({s.id})</span></span>
                <span className={`text-xs ${overdue ? 'text-red-400' : due ? 'text-amber-400' : 'text-green-400'}`}>
                  {overdue ? tr('salonRemoved') : due ? `₹${s.commissionDue} due` : tr('commissionPaid')}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
