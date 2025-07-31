import React, { useState } from 'react';
import { Check, X, KeyRound, Bell, CreditCard, User, Bot, Users } from 'lucide-react';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [user, setUser] = useState({
    name: 'Demo User',
    email: 'demo@example.com',
    role: 'admin'
  });

  // Mock API data
  const apiKeys = [
    { name: 'Primary API Key', key: '••••••••••••••••3f9a', created: '2025-01-15', last_used: '2025-03-14' },
    { name: 'Development Key', key: '••••••••••••••••8c4d', created: '2025-02-20', last_used: '2025-03-10' }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Settings</h1>

      {/* Tabs navigation */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="border-b">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('general')}
              className={`py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'general'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'api'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              API Keys
            </button>
            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'whatsapp'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              WhatsApp Connection
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'notifications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Notifications
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'billing'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Billing
            </button>
          </nav>
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === 'general' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-6">Account Information</h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Full Name
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="name"
                          id="name"
                          defaultValue={user.name}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email Address
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="email"
                          id="email"
                          defaultValue={user.email}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                        Company Name
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="company"
                          id="company"
                          defaultValue={user.company}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-6">Password</h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor="current-password" className="block text-sm font-medium text-gray-700">
                        Current Password
                      </label>
                      <div className="mt-1">
                        <input
                          type="password"
                          name="current-password"
                          id="current-password"
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                        New Password
                      </label>
                      <div className="mt-1">
                        <input
                          type="password"
                          name="new-password"
                          id="new-password"
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                        Confirm New Password
                      </label>
                      <div className="mt-1">
                        <input
                          type="password"
                          name="confirm-password"
                          id="confirm-password"
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
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
          )}

          {activeTab === 'api' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">API Keys</h2>
                <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Generate New Key
                </button>
              </div>
              
              <p className="text-sm text-gray-500">
                These API keys allow full access to the Evolution API through your account.
                Keep them secure and do not share them in public areas.
              </p>

              <div className="mt-8 flex flex-col">
                <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                              Name
                            </th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                              API Key
                            </th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                              Created
                            </th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                              Last Used
                            </th>
                            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                              <span className="sr-only">Actions</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {apiKeys.map((key) => (
                            <tr key={key.name}>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                <div className="flex items-center">
                                  <KeyRound size={18} className="mr-2 text-gray-400" />
                                  {key.name}
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                  <code className="bg-gray-100 px-2 py-1 rounded">{key.key}</code>
                                  <button className="text-blue-600 hover:text-blue-800 text-xs">
                                    Show
                                  </button>
                                  <button className="text-blue-600 hover:text-blue-800 text-xs">
                                    Copy
                                  </button>
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {new Date(key.created).toLocaleDateString()}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {new Date(key.last_used).toLocaleDateString()}
                              </td>
                              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                <button className="text-red-600 hover:text-red-900">
                                  Revoke
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
            </div>
          )}

          {activeTab === 'whatsapp' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">WhatsApp Connection</h2>
                <p className="text-sm text-gray-500 mb-6">
                  Connect your WhatsApp Business account to start sending messages through the Evolution API.
                </p>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Check className="h-5 w-5 text-green-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Connected Successfully</h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>Your WhatsApp Business account is connected and active.</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-100 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                        <Bot size={24} className="text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-base font-medium text-gray-900">Business Account</h3>
                        <p className="text-sm text-gray-500">+1 555-123-4567</p>
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
                        <dd className="text-gray-900 font-medium">Example Corp</dd>
                      </div>
                      <div className="py-3 flex justify-between text-sm">
                        <dt className="text-gray-500">Connected On</dt>
                        <dd className="text-gray-900">March 1, 2025</dd>
                      </div>
                      <div className="py-3 flex justify-between text-sm">
                        <dt className="text-gray-500">Messages Sent (This Month)</dt>
                        <dd className="text-gray-900">14,582</dd>
                      </div>
                      <div className="py-3 flex justify-between text-sm">
                        <dt className="text-gray-500">API Status</dt>
                        <dd className="text-green-600 font-medium">Operational</dd>
                      </div>
                    </dl>
                  </div>
                  
                  <div className="mt-6 flex space-x-3">
                    <button
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Refresh Connection
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h2>
                <p className="text-sm text-gray-500 mb-6">
                  Decide which updates you want to receive and how.
                </p>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-medium text-gray-900 mb-3">Email Notifications</h3>
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
                          <label htmlFor="email-campaign-completed" className="font-medium text-gray-700">
                            Campaign completed
                          </label>
                          <p className="text-gray-500">Get notified when a campaign has finished sending messages.</p>
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
                          <label htmlFor="email-delivery-issues" className="font-medium text-gray-700">
                            Delivery issues
                          </label>
                          <p className="text-gray-500">Receive alerts about message delivery problems.</p>
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
                          <label htmlFor="email-account-updates" className="font-medium text-gray-700">
                            Account updates
                          </label>
                          <p className="text-gray-500">Get important updates about your account and billing.</p>
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
                          <label htmlFor="email-promotional" className="font-medium text-gray-700">
                            Marketing and product updates
                          </label>
                          <p className="text-gray-500">Receive product tips and promotional offers.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-base font-medium text-gray-900 mb-3">Browser Notifications</h3>
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
                          <label htmlFor="browser-campaign-completed" className="font-medium text-gray-700">
                            Campaign status updates
                          </label>
                          <p className="text-gray-500">Get browser notifications about campaign progress and completion.</p>
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
                          <label htmlFor="browser-new-responses" className="font-medium text-gray-700">
                            New message responses
                          </label>
                          <p className="text-gray-500">Be notified when customers respond to your messages.</p>
                        </div>
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
          )}

          {activeTab === 'billing' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Current Plan</h2>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">Pro Plan</h3>
                      <p className="text-blue-700 font-medium mt-1">$49/month</p>
                      <p className="text-sm text-gray-600 mt-2">
                        Your subscription renews on April 15, 2025
                      </p>
                    </div>
                    <button className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors">
                      Upgrade Plan
                    </button>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-blue-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Included in your plan:</h4>
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
                  <h3 className="text-base font-medium text-gray-900 mb-3">Usage This Month</h3>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Messages Sent</span>
                      <span className="font-medium">14,582 / 20,000</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '73%' }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Your plan resets in 17 days. Need more messages?{' '}
                      <a href="#" className="text-blue-600 hover:text-blue-800">
                        Upgrade your plan
                      </a>
                      .
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h2>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-gray-100 p-2 rounded mr-4">
                        <CreditCard size={20} className="text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Visa ending in 4242</p>
                        <p className="text-sm text-gray-500">Expires 12/2025</p>
                      </div>
                    </div>
                    <button className="text-blue-600 text-sm font-medium hover:text-blue-800">
                      Update
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Billing History</h2>
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                          Date
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Description
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Amount
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
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
                          <a href="#" className="text-blue-600 hover:text-blue-900">
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
                          <a href="#" className="text-blue-600 hover:text-blue-900">
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
                          <a href="#" className="text-blue-600 hover:text-blue-900">
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
  );
};

export default Settings;