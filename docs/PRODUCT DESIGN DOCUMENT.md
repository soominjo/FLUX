Here is a clean, Agile-ready breakdown of your application **FLUX**. This overview synthesizes the best features of Strava, MyFitnessPal, and Nike Training Club into a cohesive, multi-role ecosystem.

### **App Overview: FLUX**

**Concept:** A holistic "Circle of Care" fitness platform. Unlike standard trackers that isolate the user, FLUX positions the Trainee at the center of a support network involving a **Personal Trainer**, **Gym Buddy**, and **Physiotherapist**. It combines granular workout/nutrition tracking with role-specific dashboards, allowing professionals to monitor progress and friends to provide accountability, all while prioritizing injury prevention and recovery.

**Monetization:** Freemium SaaS.

- **Free:** Basic tracking, 1 Buddy connection.
- **Premium:** Unlimited connections (Trainer/Physio), deep analytics, and advanced professional tools.

---

### **Epic 1: Identity & Role-Based Onboarding**

_Focus: Secure account creation and role verification, specifically for medical professionals._

- **Story 1.1:** As a **New User**, I want to select my primary role (Trainee, Trainer, Physiotherapist) during sign-up so the app tailors the UI to my needs.
- **Story 1.2:** As a **Physiotherapist**, I must upload my professional license/credential during registration so that I can be verified as a legitimate healthcare provider before accessing patient data.
- **Story 1.3:** As an **Admin**, I want a backend interface to review and approve/reject Physiotherapist documents to ensure platform safety.
- **Story 1.4:** As a **Trainee**, I want to set up my physical profile (age, weight, height, injuries) so the app can calculate my baselines.

### **Epic 2: The "Circle of Care" (Connectivity)**

_Focus: Managing relationships and permissions between the Trainee and their support network._

- **Story 2.1:** As a **Trainee**, I want to generate a unique invite link or QR code to connect with a Trainer, Gym Buddy, or Physiotherapist.
- **Story 2.2:** As a **Trainee**, I want to grant specific data permissions to each connection (e.g., Trainer sees everything; Buddy sees only workout frequency) to maintain privacy.
- **Story 2.3:** As a **Trainer**, I want to accept a client invitation so they appear on my "Client Roster" dashboard.
- **Story 2.4:** As a **Gym Buddy**, I want to accept a friend request so we can view each other’s activity feeds.

### **Epic 3: Workout & Strain Tracking**

_Focus: The core daily utility for the Trainee (inspired by Strava & Home Workout)._

- **Story 3.1:** As a **Trainee**, I want to log a workout by selecting specific **muscle groups targeted** (e.g., "Chest & Triceps") to visualize my training balance.
- **Story 3.2:** As a **Trainee**, I want to record my **rest/break times** between sets or exercises to track my workout intensity and density.
- **Story 3.3:** As a **Physiotherapist**, I want to assign specific "Rehab Movements" or "Mobility Drills" to a Trainee’s daily to-do list to address their specific injuries.
- **Story 3.4:** As a **Trainee**, I want to rate my "Pain Level" (1-10) after a workout if I am recovering from an injury, so my Physio gets an alert.

### **Epic 4: Nutrition & Fuel**

_Focus: Diet tracking for performance (inspired by MyFitnessPal)._

- **Story 4.1:** As a **Trainee**, I want to log my daily meals and macro overview (Protein/Carbs/Fats) quickly so my trainer can review my fueling.
- **Story 4.2:** As a **Trainee**, I want to upload a photo of my meal ("Ate this") for quick logging if I don't have time to weigh ingredients.
- **Story 4.3:** As a **Trainer**, I want to view my client's weekly calorie and protein average to advise them on dietary adjustments.

### **Epic 5: Professional Dashboards (Trainer & Physio)**

_Focus: High-level monitoring and intervention tools._

- **Story 5.1:** As a **Trainer**, I want a "Client Roster" view that flags clients who haven't worked out in 3+ days so I can send a nudge.
- **Story 5.2:** As a **Trainer**, I want to see a heat map of my client's "Targeted Muscle Groups" over the last month to identify neglected areas.
- **Story 5.3:** As a **Physiotherapist**, I want a specialized dashboard showing "Pain Trends" and "Mobility Compliance" for my patients.
- **Story 5.4:** As a **Physiotherapist**, I want to leave private clinical notes on a patient's profile that only I can see.

### **Epic 6: Social Accountability (The "Gym Buddy")**

_Focus: Motivation without invasion (inspired by Strava)._

- **Story 6.1:** As a **Gym Buddy**, I want to see a simplified "Streak Counter" and "Workouts Completed" for my friend to keep them accountable.
- **Story 6.2:** As a **Gym Buddy**, I want to send "Kudos" or pre-set motivational quick-replies (e.g., "Beast Mode!") when my friend finishes a workout.
- **Story 6.3:** As a **Trainee**, I want to see a leaderboard of just my connected Gym Buddies (not the whole world) to foster friendly competition.
- **Constraint Story:** As a **Trainee**, I want to ensure my Gym Buddy _cannot_ see my detailed body weight, calorie logs, or private medical notes from my Physio.

### **Epic 7: Analytics & Optimization (The "Flux" Logic)**

_Focus: Data synthesis for the user._

- **Story 7.1:** As a **Trainee**, I want to see a "Recovery vs. Strain" graph that combines my workout volume with my reported sleep/energy levels.
- **Story 7.2:** As a **Trainee**, I want a weekly "Optimization Report" that suggests what to focus on next week (e.g., "You hit legs hard; focus on mobility next week").
- **Story 7.3:** As a **Trainee**, I want to export my progress report as a PDF to share with offline doctors or specialists if needed.
