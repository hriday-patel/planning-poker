"use client";

import { useRouter } from "next/navigation";

export default function FAQPage() {
  const router = useRouter();

  const faqs = [
    {
      question: "What is Planning Poker?",
      answer:
        "Planning Poker is a consensus-based estimation technique used by agile teams to estimate the effort or relative size of development goals. Team members make estimates by playing numbered cards face-down, then revealing them simultaneously to avoid anchoring bias.",
    },
    {
      question: "Is this tool really free?",
      answer:
        "Yes! This Planning Poker tool is completely free with unlimited games and unlimited voting rounds. There are no hidden costs, premium tiers, or feature restrictions.",
    },
    {
      question: "How do I create a game?",
      answer:
        "Click 'Start New Game' on the homepage, sign in with your IBM W3ID credentials, then configure your game settings including name, voting system (Fibonacci, T-shirt sizes, etc.), and advanced options. Once created, share the game link with your team.",
    },
    {
      question: "What voting systems are supported?",
      answer:
        "We support Fibonacci (0, 1, 2, 3, 5, 8, 13, 21...), Modified Fibonacci, T-shirt sizes (XS, S, M, L, XL), Powers of 2, and custom decks. You can create your own custom deck with any values you prefer.",
    },
    {
      question: "How many people can join a game?",
      answer:
        "Up to 12 players can participate in a single game session. This ensures everyone can see each other's cards clearly and participate effectively in the estimation process.",
    },
    {
      question: "Can I use this tool on mobile devices?",
      answer:
        "Yes! The application is responsive and works on desktop, tablet, and mobile devices. However, the desktop experience is optimized for the best user experience.",
    },
    {
      question: "What is the facilitator role?",
      answer:
        "The facilitator is the person who created the game or was assigned the role. They have additional permissions like revealing cards (if configured), managing issues, and transferring the facilitator role to another player.",
    },
    {
      question: "Can I change game settings after creating a game?",
      answer:
        "Yes! The facilitator can access game settings during an active session by clicking the game name and selecting 'Game Settings'. You can modify permissions, toggle features, and even transfer the facilitator role.",
    },
    {
      question: "What is spectator mode?",
      answer:
        "Spectator mode allows users to join a game and observe without participating in voting. This is useful for stakeholders, managers, or team members who want to watch the estimation process without influencing the results.",
    },
    {
      question: "How does the timer work?",
      answer:
        "The built-in timer helps keep discussions focused. Set a duration, start the timer, and it will count down synchronously for all players. You can enable 'Time issues' to automatically reset the timer after each voting round.",
    },
    {
      question: "Can I see the history of past voting rounds?",
      answer:
        "Yes! Click the game name and select 'Voting History' to view all completed voting rounds, including issue titles, final estimates, timestamps, and individual votes from each participant.",
    },
    {
      question: "What happens if I lose connection during a game?",
      answer:
        "The application will automatically attempt to reconnect you to the game. Your voting state and game progress are preserved, so you can continue where you left off once reconnected.",
    },
    {
      question: "How is my data secured?",
      answer:
        "The application uses IBM W3ID SSO for authentication, ensuring enterprise-grade security. All data is transmitted over secure connections, and the application is self-hosted and internally controlled by your organization.",
    },
    {
      question: "Can I import issues from JIRA or other tools?",
      answer:
        "Issue import functionality is planned for future releases. Currently, you can manually add issues or import from CSV files and URLs.",
    },
    {
      question: "What browsers are supported?",
      answer:
        "The application works best on modern browsers including Chrome, Firefox, Safari, and Edge. We recommend using the latest version of your preferred browser for the best experience.",
    },
  ];

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-primary)",
      }}
    >
      {/* Navigation */}
      <nav className="border-b" style={{ borderColor: "var(--border-color)" }}>
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
        <h1 className="text-4xl font-bold mb-8">Frequently Asked Questions</h1>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border rounded-lg p-6"
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--border-color)",
              }}
            >
              <h2 className="text-xl font-semibold mb-3 text-blue-400">
                {faq.question}
              </h2>
              <p
                className="leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                {faq.answer}
              </p>
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-12 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">Still have questions?</h2>
          <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
            Can't find the answer you're looking for? Please reach out to our
            support team.
          </p>
          <a
            href="mailto:support@planningpoker.com"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}

// Made with Bob
