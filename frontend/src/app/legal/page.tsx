"use client";

import { useRouter } from "next/navigation";

export default function LegalPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#1a2035] text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-700">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 hover:text-blue-400 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Home
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Legal Notice</h1>

        <div className="space-y-8 text-gray-300">
          {/* Terms of Service */}
          <section className="bg-[#0f1729] border border-gray-700 rounded-lg p-8">
            <h2 className="text-2xl font-semibold mb-4 text-white">
              Terms of Service
            </h2>
            <div className="space-y-4">
              <p>
                <strong>Last Updated:</strong> April 20, 2026
              </p>
              <p>
                Welcome to Planning Poker. By accessing or using this
                application, you agree to be bound by these Terms of Service.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-2">
                1. Acceptance of Terms
              </h3>
              <p>
                By using Planning Poker, you acknowledge that you have read,
                understood, and agree to be bound by these Terms of Service and
                our Privacy Policy.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-2">
                2. Use of Service
              </h3>
              <p>
                Planning Poker is provided for internal use within your
                organization. You agree to use the service only for lawful
                purposes and in accordance with these Terms.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-2">
                3. User Accounts
              </h3>
              <p>
                Access to Planning Poker requires authentication through IBM
                W3ID SSO. You are responsible for maintaining the
                confidentiality of your account credentials.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-2">
                4. Intellectual Property
              </h3>
              <p>
                The Planning Poker application, including its design, features,
                and functionality, is owned by the organization and is protected
                by copyright and other intellectual property laws.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-2">
                5. Limitation of Liability
              </h3>
              <p>
                Planning Poker is provided "as is" without warranties of any
                kind. We shall not be liable for any indirect, incidental,
                special, consequential, or punitive damages resulting from your
                use of the service.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-2">
                6. Changes to Terms
              </h3>
              <p>
                We reserve the right to modify these Terms at any time. Changes
                will be effective immediately upon posting. Your continued use
                of the service constitutes acceptance of the modified Terms.
              </p>
            </div>
          </section>

          {/* Privacy Policy */}
          <section className="bg-[#0f1729] border border-gray-700 rounded-lg p-8">
            <h2 className="text-2xl font-semibold mb-4 text-white">
              Privacy Policy
            </h2>
            <div className="space-y-4">
              <p>
                <strong>Last Updated:</strong> April 20, 2026
              </p>
              <p>
                This Privacy Policy describes how Planning Poker collects, uses,
                and protects your personal information.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-2">
                1. Information We Collect
              </h3>
              <p>
                We collect information you provide directly to us, including:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>User ID and display name from IBM W3ID authentication</li>
                <li>Profile photo (if uploaded)</li>
                <li>Game data including votes, issues, and session history</li>
                <li>Usage data and analytics</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-2">
                2. How We Use Your Information
              </h3>
              <p>We use the information we collect to:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>
                  Provide, maintain, and improve the Planning Poker service
                </li>
                <li>Authenticate users and manage access</li>
                <li>Store game sessions and voting history</li>
                <li>Analyze usage patterns to improve the application</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-2">
                3. Data Security
              </h3>
              <p>
                We implement appropriate technical and organizational measures
                to protect your personal information against unauthorized
                access, alteration, disclosure, or destruction. All data is
                transmitted over secure connections and stored in encrypted
                databases.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-2">
                4. Data Retention
              </h3>
              <p>
                We retain your personal information for as long as necessary to
                provide the service and fulfill the purposes outlined in this
                Privacy Policy. Game data and voting history are retained
                indefinitely unless you request deletion.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-2">
                5. Third-Party Services
              </h3>
              <p>
                Planning Poker uses IBM W3ID for authentication. Your use of
                W3ID is subject to IBM's privacy policy and terms of service.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-2">
                6. Your Rights
              </h3>
              <p>You have the right to:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Export your data</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-2">
                7. Changes to Privacy Policy
              </h3>
              <p>
                We may update this Privacy Policy from time to time. We will
                notify you of any changes by posting the new Privacy Policy on
                this page and updating the "Last Updated" date.
              </p>
            </div>
          </section>

          {/* Cookie Policy */}
          <section className="bg-[#0f1729] border border-gray-700 rounded-lg p-8">
            <h2 className="text-2xl font-semibold mb-4 text-white">
              Cookie Policy
            </h2>
            <div className="space-y-4">
              <p>
                Planning Poker uses cookies and similar technologies to provide
                and improve the service.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-2">
                Types of Cookies We Use
              </h3>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>
                  <strong>Essential Cookies:</strong> Required for
                  authentication and session management
                </li>
                <li>
                  <strong>Functional Cookies:</strong> Remember your preferences
                  and settings
                </li>
                <li>
                  <strong>Analytics Cookies:</strong> Help us understand how
                  users interact with the application
                </li>
              </ul>

              <p className="mt-4">
                You can control cookies through your browser settings. However,
                disabling essential cookies may affect the functionality of
                Planning Poker.
              </p>
            </div>
          </section>

          {/* Contact Information */}
          <section className="bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-8">
            <h2 className="text-2xl font-semibold mb-4 text-white">
              Contact Us
            </h2>
            <p>
              If you have any questions about these legal terms or our privacy
              practices, please contact us:
            </p>
            <div className="mt-4 space-y-2">
              <p>
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:legal@planningpoker.com"
                  className="text-blue-400 hover:text-blue-300"
                >
                  legal@planningpoker.com
                </a>
              </p>
              <p>
                <strong>Support:</strong>{" "}
                <a
                  href="mailto:support@planningpoker.com"
                  className="text-blue-400 hover:text-blue-300"
                >
                  support@planningpoker.com
                </a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// Made with Bob
