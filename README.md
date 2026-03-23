🧠 MindLog: AI Wellness Journal for Students
"Your mind deserves the same effort you give your academics."

MindLog is a serverless, local-first web application designed to help engineering students process exam pressure, placement anxiety, and hostel life. Powered by Google's Gemini AI, it analyzes daily free-form journal entries to provide personalized emotional insights, actionable recommendations, and longitudinal wellness tracking—all without ever sending your private data to a database.

✨ Key Features
Deep Emotional Analysis: Uses Gemini AI to evaluate free-write entries and determine stress levels, dominant emotions, root causes, and immediate personal needs in under 15 seconds.

100% Private & Local-First: All journal entries, profiles, and historical data are stored exclusively in the browser's localStorage. There are no user accounts, no cloud databases, and no tracking.

Personalized Context: Recommendations are tailored to the user's specific stressors (e.g., placements, exams) and interests (e.g., coding, fitness) selected during onboarding.

Pattern Tracking: Features interactive mood trend lines, 12-week calendar heatmaps, emotion frequency donut charts, and streak tracking.

Curated Expert Directory: Recommends verified mental health YouTube channels (e.g., Huberman Lab, Therapy in a Nutshell, HealthyGamerGG) based on the user's detected emotional state.

Dynamic Theming: Users can seamlessly switch between three distinct UI themes: Warm Blossom, Cool Periwinkle, and Dark Forest.

🛠️ Tech Stack
Frontend: Pure HTML5, CSS3 (CSS Variables for theming), and Vanilla JavaScript (ES6+). No heavy frameworks (React/Vue) to ensure lightning-fast load times.

AI Integration: Google Gemini API (gemini-2.5-flash model) via REST calls.

Data Storage: Native Browser localStorage for persistent data and sessionStorage for temporary API key management.

🚀 Getting Started
Since MindLog is entirely client-side, setup takes less than a minute.

Clone the repository:

Bash
git clone https://github.com/yourusername/mindlog.git
Open the app:
Simply open the index.html file in any modern web browser (Chrome, Firefox, Safari, Edge). No local server (like Node or Python) is strictly required to run it!

Configure Gemini API:

Go to Google AI Studio and generate a free API key.

Open MindLog, complete the onboarding profile, and paste your API key when prompted. (Note: Your API key is stored securely in your browser's session and clears when the tab is closed).

🔒 Data Export & Safety
Because data is stored locally, users are entirely responsible for their own backups. MindLog includes a built-in JSON export tool in the "Account" tab to download all historical entries and settings securely to your local hard drive.

📄 License
[Insert License Type - e.g., MIT License]
