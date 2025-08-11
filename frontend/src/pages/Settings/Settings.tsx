import React, { useState } from "react";
import { Bot, Check, CreditCard, User, Bell, DollarSign } from "lucide-react";

// 1. Defina a interface para as props do componente Tab.
// Isso informa ao TypeScript os tipos esperados.
interface TabProps {
  id: string;
  label: string;
  icon: React.ElementType;
  setActiveTab: (id: string) => void;
  activeTab: string;
}

// 2. O componente Tab. Ele precisa ser definido antes de ser usado.
const Tab = ({ id, label, icon: Icon, setActiveTab, activeTab }: TabProps) => (
  <button
    onClick={() => setActiveTab(id)}
    className={`
      flex items-center space-x-3 px-4 py-2 rounded-md transition-colors
      ${
        activeTab === id
          ? "bg-gray-200 text-gray-900 font-semibold"
          : "text-gray-600 hover:bg-gray-100"
      }
    `}
  >
    <Icon size={20} />
    <span>{label}</span>
  </button>
);

const Settings = () => {
  // State to manage which tab is currently active. 'account' is the default.
  const [activeTab, setActiveTab] = useState("account");

  return (
    <div className="bg-white min-h-screen font-sans antialiased text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-1 border-r border-gray-200 pr-8">
            <h1 className="text-3xl font-extrabold mb-8">Settings</h1>
            <nav className="flex flex-col space-y-2">
              {/* 3. Agora, você pode usar o componente Tab e passar as props necessárias */}
              <Tab
                id="account"
                label="Account"
                icon={User}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
              <Tab
                id="notifications"
                label="Notifications"
                icon={Bell}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
              <Tab
                id="billing"
                label="Billing"
                icon={DollarSign}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
            </nav>
          </aside>

          {/* Main Content Area based on the active tab */}
          <div className="lg:col-span-3 mt-8 lg:mt-0">
            {/* Account Tab Content */}
            {activeTab === "account" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    Account
                  </h2>
                  <p className="text-sm text-gray-500 mb-6">
                    Manage your business account details and connections.
                  </p>
                  <div className="bg-gray-100 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                          <Bot size={24} className="text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-base font-medium text-gray-900">
                            Business Account
                          </h3>
                          <p className="text-sm text-gray-500">
                            +1 555-123-4567
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <dl className="divide-y divide-gray-200">
                        <div className="py-3 flex justify-between text-sm">
                          <dt className="text-gray-500">Business Name</dt>
                          <dd className="text-gray-900 font-medium">
                            Example Corp
                          </dd>
                        </div>
                        <div className="py-3 flex justify-between text-sm">
                          <dt className="text-gray-500">Connected On</dt>
                          <dd className="text-gray-900">March 1, 2025</dd>
                        </div>
                        <div className="py-3 flex justify-between text-sm">
                          <dt className="text-gray-500">
                            Messages Sent (This Month)
                          </dt>
                          <dd className="text-gray-900">14,582</dd>
                        </div>
                        <div className="py-3 flex justify-between text-sm">
                          <dt className="text-gray-500">API Status</dt>
                          <dd className="text-green-600 font-medium">
                            Operational
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Notifications Tab Content */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                {/* Adicione o conteúdo para Notificações aqui */}
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Notifications
                </h2>
                <p className="text-sm text-gray-500">
                  Manage your notification settings.
                </p>
              </div>
            )}
            {/* Billing Tab Content */}
            {activeTab === "billing" && (
              <div className="space-y-6">
                {/* Adicione o conteúdo para Faturamento aqui */}
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Billing
                </h2>
                <p className="text-sm text-gray-500">
                  Manage your billing information and payment methods.
                </p>
              </div>
            )}

            {/* Notifications Tab Content */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    Notification Preferences
                  </h2>
                  <p className="text-sm text-gray-500 mb-6">
                    Decide which updates you want to receive and how.
                  </p>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-base font-medium text-gray-900 mb-3">
                        Email Notifications
                      </h3>
                      <div className="space-y-4">
                        <div className="relative flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="email-campaign-completed"
                              name="email-campaign-completed"
                              type="checkbox"
                              defaultChecked
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label
                              htmlFor="email-campaign-completed"
                              className="font-medium text-gray-700"
                            >
                              Campaign completed
                            </label>
                            <p className="text-gray-500">
                              Get notified when a campaign has finished sending
                              messages.
                            </p>
                          </div>
                        </div>

                        <div className="relative flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="email-delivery-issues"
                              name="email-delivery-issues"
                              type="checkbox"
                              defaultChecked
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label
                              htmlFor="email-delivery-issues"
                              className="font-medium text-gray-700"
                            >
                              Delivery issues
                            </label>
                            <p className="text-gray-500">
                              Receive alerts about message delivery problems.
                            </p>
                          </div>
                        </div>

                        <div className="relative flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="email-account-updates"
                              name="email-account-updates"
                              type="checkbox"
                              defaultChecked
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label
                              htmlFor="email-account-updates"
                              className="font-medium text-gray-700"
                            >
                              Account updates
                            </label>
                            <p className="text-gray-500">
                              Get important updates about your account and
                              billing.
                            </p>
                          </div>
                        </div>

                        <div className="relative flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="email-promotional"
                              name="email-promotional"
                              type="checkbox"
                              defaultChecked={false}
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label
                              htmlFor="email-promotional"
                              className="font-medium text-gray-700"
                            >
                              Marketing and product updates
                            </label>
                            <p className="text-gray-500">
                              Receive product tips and promotional offers.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-medium text-gray-900 mb-3">
                        Browser Notifications
                      </h3>
                      <div className="space-y-4">
                        <div className="relative flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="browser-campaign-completed"
                              name="browser-campaign-completed"
                              type="checkbox"
                              defaultChecked
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label
                              htmlFor="browser-campaign-completed"
                              className="font-medium text-gray-700"
                            >
                              Campaign status updates
                            </label>
                            <p className="text-gray-500">
                              Get browser notifications about campaign progress
                              and completion.
                            </p>
                          </div>
                        </div>

                        <div className="relative flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="browser-new-responses"
                              name="browser-new-responses"
                              type="checkbox"
                              defaultChecked
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label
                              htmlFor="browser-new-responses"
                              className="font-medium text-gray-700"
                            >
                              New message responses
                            </label>
                            <p className="text-gray-500">
                              Be notified when customers respond to your
                              messages.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-5">
                    <button
                      type="button"
                      className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Billing Tab Content */}
            {activeTab === "billing" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    Current Plan
                  </h2>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          Pro Plan
                        </h3>
                        <p className="text-blue-700 font-medium mt-1">
                          $49/month
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                          Your subscription renews on April 15, 2025
                        </p>
                      </div>
                      <button className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors">
                        Upgrade Plan
                      </button>
                    </div>

                    <div className="mt-6 pt-6 border-t border-blue-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Included in your plan:
                      </h4>
                      <ul className="space-y-2">
                        <li className="flex items-center text-sm text-gray-600">
                          <Check size={16} className="text-green-500 mr-2" />
                          <span>Up to 20,000 messages per month</span>
                        </li>
                        <li className="flex items-center text-sm text-gray-600">
                          <Check size={16} className="text-green-500 mr-2" />
                          <span>Advanced analytics and reporting</span>
                        </li>
                        <li className="flex items-center text-sm text-gray-600">
                          <Check size={16} className="text-green-500 mr-2" />
                          <span>Unlimited templates and campaigns</span>
                        </li>
                        <li className="flex items-center text-sm text-gray-600">
                          <Check size={16} className="text-green-500 mr-2" />
                          <span>Priority support</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-base font-medium text-gray-900 mb-3">
                      Usage This Month
                    </h3>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500">Messages Sent</span>
                        <span className="font-medium">14,582 / 20,000</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{ width: "73%" }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Your plan resets in 17 days. Need more messages?{" "}
                        <a
                          href="#"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Upgrade your plan
                        </a>
                        .
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    Payment Method
                  </h2>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="bg-gray-100 p-2 rounded mr-4">
                          <CreditCard size={20} className="text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            Visa ending in 4242
                          </p>
                          <p className="text-sm text-gray-500">
                            Expires 12/2025
                          </p>
                        </div>
                      </div>
                      <button className="text-blue-600 text-sm font-medium hover:text-blue-800">
                        Update
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    Billing History
                  </h2>
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                          >
                            Date
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Description
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Amount
                          </th>
                          <th
                            scope="col"
                            className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                          >
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        <tr>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            Mar 15, 2025
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            Pro Plan - Monthly
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            $49.00
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <a
                              href="#"
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Download
                            </a>
                          </td>
                        </tr>
                        <tr>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            Feb 15, 2025
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            Pro Plan - Monthly
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            $49.00
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <a
                              href="#"
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Download
                            </a>
                          </td>
                        </tr>
                        <tr>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            Jan 15, 2025
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            Pro Plan - Monthly
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            $49.00
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <a
                              href="#"
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Download
                            </a>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

// Main App component to render the Settings page.
export const App = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <Settings />
    </div>
  );
};
