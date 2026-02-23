You are a senior frontend architect and UI/UX specialist designing a production-grade medical AI interface.

We are building Project Hippocrates X, an advanced multimodal clinical reasoning system that processes:

Doctor’s notes (structured & unstructured)

Consultation transcripts

Medical images

Medical videos

The current dashboard looks like a generic SaaS admin panel. It lacks clinical authority, intelligence signaling, and cognitive depth.

Your task is to redesign and refactor the existing dashboard into a Clinical Intelligence Command Center while preserving the existing routing and backend integration.

Objectives

Transform the UI from a CRUD-style dashboard into a high-trust medical AI interface.

Introduce visual hierarchy, semantic color usage, and clinical-grade aesthetics.

Surface AI reasoning signals directly in the dashboard.

Improve layout structure, component modularity, and maintainability.

Maintain responsiveness and accessibility.

Required Improvements
1. Visual Identity Upgrade

Use a darker clinical palette (slate/graphite backgrounds with subtle depth).

Replace flat card design with layered surfaces and soft elevation.

Introduce semantic color coding:

Blue → Active reasoning

Green → Completed

Amber → Pending review

Red → Critical anomaly

Improve typography hierarchy (clear H1, H2, data emphasis).

2. Replace Generic Stats Cards

Refactor the 4 summary cards into:

Active Reasoning Sessions (with animated pulse indicator)

High-Risk Patients (severity badge)

AI Confidence Average (percentage + progress visualization)

Pending Clinical Reviews (priority indicator)

Each card should:

Include iconography

Display contextual metadata

Show state-based styling

Support loading skeleton states

3. Redesign Layout Structure

Convert the current dashboard into:

Top Section:

AI System Status Bar (system health, model status, uptime indicator)

Main Area (2-column layout):

Left: Consultation Pipeline (Active → Processing → Completed)

Right: Live AI Activity Feed (real-time reasoning logs)

Bottom Section:

Risk Distribution Overview (simple chart or visual bar breakdown)

Model Confidence Snapshot

4. Upgrade Empty States

Replace “No consultations yet” with:

Guided call-to-action

Explanation of system capability

Prominent “Begin AI-Assisted Consultation” button

Subtle illustration or icon

Empty states must educate and inspire confidence.

5. Enhance “Begin Consultation” CTA

Make it:

Prominent primary action

Visually elevated

Possibly floating or pinned

With micro-interaction (hover/active animation)

6. Introduce Intelligence Indicators

Add UI components that simulate reasoning depth:

Confidence badges (e.g., 92% certainty)

Risk severity tags

AI reasoning status indicator (Analyzing…, Synthesizing…, Reviewing evidence…)

Model version badge

These should be modular reusable components.

7. Improve Sidebar

Group items into:

Clinical Operations

Intelligence

Data

Add active state emphasis

Improve spacing and icon alignment

Add subtle hover transitions

8. Component Refactor Requirements

Extract reusable components (StatCard, StatusBadge, RiskTag, ActivityFeedItem, ConfidenceBar)

Improve state management clarity

Add proper loading, error, and empty states

Ensure accessibility (aria labels, contrast ratios)

Ensure mobile responsiveness

Constraints

Do not change API contracts.

Do not remove existing routes.

Keep the codebase scalable and modular.

Maintain TypeScript correctness if applicable.

Avoid overengineering animations; keep them subtle and professional.
