# Plan: Home Project Collaboration App (Prototype)

## Executive Summary
The goal is to build an iPhone app that leverages neighborhood density to negotiate better deals for home services. By identifying vendors already working in a specific zip code or for specific neighbors, the app allows new users to "piggyback" on existing engagements, reducing vendor travel costs and passing those savings to the neighbors as discounts.

## Phase 1: Discovery & UX Prototyping (Current Focus)

### To-Do List
1.  **Define User Personas:** Detail the "Homeowner" (saving money) and the "Vendor" (gaining efficiency).
2.  **User Flow Mapping:** 
    *   Search -> Result (Showing neighbors' current vendors) -> "Join Project" or "Request Quote."
3.  **Data Schema Design:** Define attributes for `Vendors`, `Projects`, `Users`, and `Neighborhoods`.
4.  **Low-Fidelity UX Prototype:** Create a mobile-responsive web mock-up to test the search and "Join Deal" interaction.
5.  **Vendor Database Seeding:** Create a JSON/CSV database of initial vendors (Name, Category, Zip, Contact).

## Phase 2: Technical Scaffolding
6.  **Environment Setup:** Initialize a React Native (Expo) or PWA environment.
7.  **Search Logic:** Build the filtering system for Zip Codes and Categories.
8.  **Proximity Matching:** Implement logic to show "Trending Vendors" in a specific neighborhood.

## Phase 3: MVP Development
9.  **Real-time Collaboration:** Add the ability for neighbors to "upvote" or "join" a service request.
10. **Vendor Notification:** Basic system to notify vendors of a "Group Buy" opportunity.

---

## Clarification Questions
1.  **Project State:** Does "already engaged" mean a vendor is **physically present** in the neighborhood on a specific date, or simply that they are the **preferred/active provider** for a neighbor's ongoing project?
Ans: they are the **preferred/active provider** for a neighbor's ongoing project. We can later on extend this to a vendor is **physically present** in the neighborhood on a specific date depending on the service. For example, if it is a one or two hour task, he can finish his current task and go the neighbouring  house and finish that task also.

2.  **Discount Mechanism:** Is the discount automatic (e.g., $10 \%$ off if 3 neighbors sign up) or is it a manual negotiation facilitated through the app?
Ans: To start with it will be a manual negotiation facilitated through the app. We can then explore the option of automatic discounting based on other factors.

3.  **Tech Preference:** Since we are starting with a prototype, would you like a **Mobile-First Web App** (accessible via browser) or a full **React Native** project (which requires XCode/Android Studio to run)?
Ans: I want to start with the a **Mobile-First Web App** (accessible via browser)

4.  **Vendor Data:** Do you have an existing list of vendors to start with, or should I generate a mock dataset of local vendors to test the prototype?
Ans: Generate a mock dataset of local vendors to test the prototype?
