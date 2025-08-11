import { useState } from 'react';
import { Plus, Search, Smartphone, Copy, Edit, Trash2 } from 'lucide-react';

const Templates = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data
  const templates = [
    {
      id: 1,
      name: 'Welcome Message',
      description: 'Initial message for new customers',
      previewText: 'Hello {{name}}, welcome to our service! We\'re excited to have you with us.',
      category: 'Onboarding',
      variables: ['name'],
      createdAt: '2025-02-15',
    },
    {
      id: 2,
      name: 'Product Announcement',
      description: 'Announce new product features',
      previewText: 'Exciting news, {{name}}! We just launched {{product}} with amazing new features.',
      category: 'Marketing',
      variables: ['name', 'product'],
      createdAt: '2025-02-20',
    },
    {
      id: 3,
      name: 'Payment Confirmation',
      description: 'Confirm payment receipt',
      previewText: 'Thank you, {{name}}! Your payment of {{amount}} has been received.',
      category: 'Transactional',
      variables: ['name', 'amount'],
      createdAt: '2025-02-25',
    },
    {
      id: 4,
      name: 'Order Update',
      description: 'Update order status',
      previewText: 'Your order #{{orderNumber}} has been {{status}}. Track it at: {{trackingLink}}',
      category: 'Transactional',
      variables: ['orderNumber', 'status', 'trackingLink'],
      createdAt: '2025-03-01',
    },
    {
      id: 5,
      name: 'Weekly Newsletter',
      description: 'Regular newsletter template',
      previewText: 'Hi {{name}}, here are this week\'s updates from {{company}}.',
      category: 'Marketing',
      variables: ['name', 'company'],
      createdAt: '2025-03-05',
    },
    {
      id: 6,
      name: 'Appointment Reminder',
      description: 'Remind about upcoming appointment',
      previewText: 'Reminder: You have an appointment with {{provider}} on {{date}} at {{time}}.',
      category: 'Service',
      variables: ['provider', 'date', 'time'],
      createdAt: '2025-03-10',
    }
  ];

  // Filter templates based on search query
  const filteredTemplates = templates.filter(template => 
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get unique categories for filter
  const categories = Array.from(new Set(templates.map(template => template.category)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Message Templates</h1>
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={16} />
          <span>New Template</span>
        </button>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search templates..."
            className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <select className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      {/* Templates list */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Template
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variables
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preview
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTemplates.map(template => (
                <tr key={template.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{template.name}</div>
                    <div className="text-sm text-gray-500">{template.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {template.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map(variable => (
                        <span key={variable} className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                          {variable}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 max-w-xs truncate">
                      {template.previewText}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(template.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Smartphone size={16} className="inline" />
                    </button>
                    <button className="text-gray-600 hover:text-gray-900">
                      <Copy size={16} className="inline" />
                    </button>
                    <button className="text-gray-600 hover:text-gray-900">
                      <Edit size={16} className="inline" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <Trash2 size={16} className="inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTemplates.length === 0 && (
          <div className="py-16 text-center">
            <div className="mx-auto w-16 h-16 mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Search size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-800">No templates found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your search criteria</p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Create New Template
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Templates;