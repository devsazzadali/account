import React, { useState } from "react";
import { Shield, CreditCard, Bell, Save, Lock, Globe, Eye, EyeOff, Check } from "lucide-react";

const TABS = ["General", "Payments", "Security", "Notifications"] as const;
type Tab = typeof TABS[number];

export function AdminSettings() {
  const [activeTab, setActiveTab] = useState<Tab>("General");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-white min-h-screen font-sans">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">
        <h2 className="text-[20px] font-bold text-slate-900">Settings</h2>
        <p className="text-[13px] text-slate-400 mt-0.5">Manage your store configuration, payments, security, and notifications.</p>
      </div>

      <div className="flex">
        {/* Sidebar Tabs */}
        <div className="w-48 border-r border-slate-200 bg-slate-50 min-h-[calc(100vh-120px)] shrink-0">
          <div className="py-2">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-5 py-2.5 text-[13px] font-medium transition-all border-l-3 ${
                  activeTab === tab
                    ? "bg-white text-primary-600 font-bold border-l-[3px] border-primary-600"
                    : "text-slate-700 hover:bg-white hover:text-slate-900 border-l-[3px] border-transparent"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 max-w-3xl">
          {/* Save Toast */}
          {saved && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 bg-emerald-500 text-white text-[13px] font-bold rounded shadow-lg flex items-center gap-2">
              <Check size={16} /> Settings saved successfully
            </div>
          )}

          {activeTab === "General" && <GeneralTab onSave={handleSave} />}
          {activeTab === "Payments" && <PaymentsTab onSave={handleSave} />}
          {activeTab === "Security" && <SecurityTab onSave={handleSave} />}
          {activeTab === "Notifications" && <NotificationsTab onSave={handleSave} />}
        </div>
      </div>
    </div>
  );
}

/* ── General Tab ── */
function GeneralTab({ onSave }: { onSave: () => void }) {
  return (
    <div className="space-y-6">
      <SectionCard title="Store Profile">
        <Field label="Platform Name">
          <input type="text" defaultValue="Titan Digital Assets" className="w-full border border-slate-200 rounded px-3 py-2 text-[13px] focus:outline-none focus:border-primary-600 bg-white" />
        </Field>
        <Field label="Support Email">
          <input type="email" defaultValue="support@titanstore.io" className="w-full border border-slate-200 rounded px-3 py-2 text-[13px] focus:outline-none focus:border-primary-600 bg-white" />
        </Field>
        <Field label="Store URL">
          <input type="text" defaultValue="https://titanstore.io" className="w-full border border-slate-200 rounded px-3 py-2 text-[13px] focus:outline-none focus:border-primary-600 bg-white" />
        </Field>
        <Field label="Store Description">
          <textarea rows={3} defaultValue="Premium digital asset marketplace for game accounts, software keys, and more." className="w-full border border-slate-200 rounded px-3 py-2 text-[13px] focus:outline-none focus:border-primary-600 bg-white resize-none" />
        </Field>
      </SectionCard>

      <SectionCard title="Maintenance Mode">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-bold text-slate-900">Enable Maintenance Mode</p>
            <p className="text-[11px] text-slate-400">Limit store access to administrators only</p>
          </div>
          <ToggleSwitch />
        </div>
      </SectionCard>

      <button onClick={onSave} className="px-6 py-2.5 bg-primary-600 text-white text-[13px] font-bold rounded hover:bg-primary-700 transition-colors flex items-center gap-2">
        <Save size={14} /> Save Changes
      </button>
    </div>
  );
}

/* ── Payments Tab ── */
function PaymentsTab({ onSave }: { onSave: () => void }) {
  return (
    <div className="space-y-6">
      <SectionCard title="Payment Gateway">
        <div className="p-4 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded border border-slate-200">
              <CreditCard size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-slate-900">Stripe</p>
              <p className="text-[11px] text-slate-400">Automatic payouts enabled</p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded text-[11px] font-bold">ACTIVE</span>
        </div>

        <Field label="Stripe Publishable Key">
          <input type="text" defaultValue="pk_live_••••••••••••••••" className="w-full border border-slate-200 rounded px-3 py-2 text-[13px] focus:outline-none focus:border-primary-600 bg-white" />
        </Field>
        <Field label="Stripe Secret Key">
          <input type="password" defaultValue="sk_live_••••••••••••••••" className="w-full border border-slate-200 rounded px-3 py-2 text-[13px] focus:outline-none focus:border-primary-600 bg-white" />
        </Field>
        <Field label="Webhook Endpoint">
          <input type="text" defaultValue="https://titanstore.io/api/webhook" className="w-full border border-slate-200 rounded px-3 py-2 text-[13px] focus:outline-none focus:border-primary-600 bg-white" />
        </Field>
      </SectionCard>

      <SectionCard title="Currency Settings">
        <Field label="Default Currency">
          <select className="w-full border border-slate-200 rounded px-3 py-2 text-[13px] focus:outline-none focus:border-primary-600 bg-white">
            <option>USD - US Dollar</option>
            <option>EUR - Euro</option>
            <option>GBP - British Pound</option>
            <option>BDT - Bangladeshi Taka</option>
          </select>
        </Field>
        <div className="flex items-center justify-between mt-3">
          <div>
            <p className="text-[13px] font-bold text-slate-900">Auto-conversion</p>
            <p className="text-[11px] text-slate-400">Automatically convert prices for international buyers</p>
          </div>
          <ToggleSwitch />
        </div>
      </SectionCard>

      <button onClick={onSave} className="px-6 py-2.5 bg-primary-600 text-white text-[13px] font-bold rounded hover:bg-primary-700 transition-colors flex items-center gap-2">
        <Save size={14} /> Save Payment Settings
      </button>
    </div>
  );
}

/* ── Security Tab ── */
function SecurityTab({ onSave }: { onSave: () => void }) {
  const [showPass, setShowPass] = useState(false);

  return (
    <div className="space-y-6">
      <SectionCard title="Change Password">
        <Field label="Current Password">
          <div className="relative">
            <input type={showPass ? "text" : "password"} placeholder="Enter current password" className="w-full border border-slate-200 rounded px-3 py-2 pr-10 text-[13px] focus:outline-none focus:border-primary-600 bg-white" />
            <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900">
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </Field>
        <Field label="New Password">
          <input type="password" placeholder="Enter new password" className="w-full border border-slate-200 rounded px-3 py-2 text-[13px] focus:outline-none focus:border-primary-600 bg-white" />
        </Field>
        <Field label="Confirm New Password">
          <input type="password" placeholder="Confirm new password" className="w-full border border-slate-200 rounded px-3 py-2 text-[13px] focus:outline-none focus:border-primary-600 bg-white" />
        </Field>
      </SectionCard>

      <SectionCard title="Two-Factor Authentication">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-bold text-slate-900">Enable 2FA</p>
            <p className="text-[11px] text-slate-400">Add an extra layer of security to your admin account</p>
          </div>
          <ToggleSwitch />
        </div>
      </SectionCard>

      <SectionCard title="Session Management">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-bold text-slate-900">Auto Logout</p>
            <p className="text-[11px] text-slate-400">Automatically log out after inactivity</p>
          </div>
          <select className="border border-slate-200 rounded px-3 py-1.5 text-[12px] bg-white focus:outline-none focus:border-primary-600">
            <option>30 minutes</option>
            <option>1 hour</option>
            <option>4 hours</option>
            <option>Never</option>
          </select>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div>
            <p className="text-[13px] font-bold text-slate-900">Login IP Restriction</p>
            <p className="text-[11px] text-slate-400">Only allow login from specific IP addresses</p>
          </div>
          <ToggleSwitch />
        </div>
      </SectionCard>

      <button onClick={onSave} className="px-6 py-2.5 bg-primary-600 text-white text-[13px] font-bold rounded hover:bg-primary-700 transition-colors flex items-center gap-2">
        <Save size={14} /> Save Security Settings
      </button>
    </div>
  );
}

/* ── Notifications Tab ── */
function NotificationsTab({ onSave }: { onSave: () => void }) {
  return (
    <div className="space-y-6">
      <SectionCard title="Email Notifications">
        <NotifRow title="New Order" desc="Get notified when a new order is placed" defaultOn={true} />
        <NotifRow title="Order Delivered" desc="Confirmation when an order is marked as delivered" defaultOn={true} />
        <NotifRow title="New Message" desc="Receive alerts for new customer messages" defaultOn={true} />
        <NotifRow title="Low Stock Alert" desc="Get notified when product stock falls below 5" defaultOn={false} />
        <NotifRow title="New User Registration" desc="Alert when a new user signs up" defaultOn={false} />
      </SectionCard>

      <SectionCard title="Push Notifications">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-bold text-slate-900">Enable Browser Notifications</p>
            <p className="text-[11px] text-slate-400">Show desktop notifications for important events</p>
          </div>
          <ToggleSwitch />
        </div>
      </SectionCard>

      <SectionCard title="Notification Sound">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-bold text-slate-900">Play Sound</p>
            <p className="text-[11px] text-slate-400">Play a sound when new notifications arrive</p>
          </div>
          <ToggleSwitch />
        </div>
      </SectionCard>

      <button onClick={onSave} className="px-6 py-2.5 bg-primary-600 text-white text-[13px] font-bold rounded hover:bg-primary-700 transition-colors flex items-center gap-2">
        <Save size={14} /> Save Notification Settings
      </button>
    </div>
  );
}

/* ── Shared Components ── */

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-slate-200 rounded">
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
        <h3 className="text-[13px] font-bold text-slate-900">{title}</h3>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[12px] text-slate-700 font-medium block mb-1">{label}</label>
      {children}
    </div>
  );
}

function ToggleSwitch() {
  const [on, setOn] = useState(false);
  return (
    <button
      onClick={() => setOn(!on)}
      className={`w-10 h-[22px] rounded-full p-[2px] transition-colors ${on ? "bg-emerald-500" : "bg-[#ccc]"}`}
    >
      <div className={`w-[18px] h-[18px] bg-white rounded-full shadow-sm transition-transform ${on ? "translate-x-[18px]" : "translate-x-0"}`} />
    </button>
  );
}

function NotifRow({ title, desc, defaultOn }: { title: string; desc: string; defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-b-0">
      <div>
        <p className="text-[13px] font-bold text-slate-900">{title}</p>
        <p className="text-[11px] text-slate-400">{desc}</p>
      </div>
      <button
        onClick={() => setOn(!on)}
        className={`w-10 h-[22px] rounded-full p-[2px] transition-colors ${on ? "bg-emerald-500" : "bg-[#ccc]"}`}
      >
        <div className={`w-[18px] h-[18px] bg-white rounded-full shadow-sm transition-transform ${on ? "translate-x-[18px]" : "translate-x-0"}`} />
      </button>
    </div>
  );
}
