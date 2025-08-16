'use client';

import { motion } from 'framer-motion';
import { Terminal, CheckCircle2, AlertCircle, Play } from 'lucide-react';

export default function QuickstartPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-50">
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Quickstart Guide</h1>
          <p className="text-xl text-gray-600 mb-12">
            Get started with FlowLock in less than 5 minutes
          </p>

          <div className="space-y-8">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-lg p-6"
            >
              <div className="flex items-center mb-4">
                <div className="bg-pink-100 rounded-full p-2 mr-4">
                  <Terminal className="w-6 h-6 text-pink-600" />
                </div>
                <h2 className="text-2xl font-semibold">Step 1: Initialize Your Project</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Start by initializing FlowLock in your project directory:
              </p>
              <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono">
                <div className="mb-2">
                  <span className="text-pink-400">$</span> npx @flowlock/cli init
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                This creates a <code className="bg-gray-100 px-2 py-1 rounded">uxspec.json</code> file 
                with a starter specification and adds helpful scripts to your package.json.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-lg p-6"
            >
              <div className="flex items-center mb-4">
                <div className="bg-pink-100 rounded-full p-2 mr-4">
                  <CheckCircle2 className="w-6 h-6 text-pink-600" />
                </div>
                <h2 className="text-2xl font-semibold">Step 2: Run Your First Audit</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Validate your UX specification and generate artifacts:
              </p>
              <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono">
                <div className="mb-2">
                  <span className="text-pink-400">$</span> uxcg audit
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                This runs all checks and generates:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-500 mt-2 ml-4">
                <li>Entity relationship diagrams (er.svg)</li>
                <li>Flow diagrams (flow.svg)</li>
                <li>Screen inventory (screens.csv)</li>
                <li>Test results (results.junit.xml)</li>
              </ul>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow-lg p-6"
            >
              <div className="flex items-center mb-4">
                <div className="bg-pink-100 rounded-full p-2 mr-4">
                  <Play className="w-6 h-6 text-pink-600" />
                </div>
                <h2 className="text-2xl font-semibold">Step 3: Enable Live Validation</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Watch for changes and get instant feedback:
              </p>
              <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono">
                <div className="mb-2">
                  <span className="text-pink-400">$</span> uxcg watch --cloud
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                This monitors your specification and code files, running checks automatically 
                when changes are detected. The <code className="bg-gray-100 px-2 py-1 rounded">--cloud</code> flag 
                enables sync with FlowLock Cloud for team collaboration.
              </p>
            </motion.div>

            {/* Core Checks */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-lg p-6 mt-12"
            >
              <h2 className="text-2xl font-semibold mb-4">Core Validation Checks</h2>
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-pink-600 mt-1 mr-3" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Honest Reads</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Ensures screens only read fields that are captured in forms, 
                        marked as derived (with provenance), or external (with declared source).
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-pink-600 mt-1 mr-3" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Creatable Needs Detail</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Every entity with a create form must have a detail screen 
                        with a discoverable navigation path.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-pink-600 mt-1 mr-3" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Reachability</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Success screens must be reachable from flow entry points 
                        within 3 steps (configurable).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Next Steps */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-lg shadow-lg p-6 mt-8"
            >
              <h2 className="text-2xl font-semibold mb-4">Next Steps</h2>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-pink-600 mr-2">→</span>
                  <div>
                    <strong>Customize your specification:</strong> Edit <code className="bg-gray-100 px-2 py-1 rounded">uxspec.json</code> to 
                    define your entities, screens, flows, and policies.
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-pink-600 mr-2">→</span>
                  <div>
                    <strong>Add to CI/CD:</strong> Use the GitHub Action to run checks on every pull request.
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-pink-600 mr-2">→</span>
                  <div>
                    <strong>Write custom checks:</strong> Extend the plugin SDK to add your own validation rules.
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-pink-600 mr-2">→</span>
                  <div>
                    <strong>Connect your team:</strong> Set up FlowLock Cloud for collaborative UX validation.
                  </div>
                </li>
              </ul>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}{/* FlowLock v0.1.2 note: audit now also generates gap_report.md and acceptance_criteria.feature in /artifacts */}
