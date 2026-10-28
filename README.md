# 🐦 Buddy Todo

**Your friendly companion for everyday tasks!**

Buddy Todo is an open-source task management and reminder application available as a web application and a Linux desktop application.

Organize your daily activities, schedule reminders, track task completion, and stay productive with interactive notifications, animated buddies, and a background scheduling engine.

Choose an animal, robot, or human buddy to make managing your daily tasks more engaging.

## ✨ Features

- ✅ **Task Management** — Create tasks and track their completion.
- ⏰ **Smart Reminders** — Schedule reminders for specific dates and times.
- 🔄 **Recurring Tasks** — Configure daily or weekly reminders.
- 🚀 **Background Scheduler** — Keep reminders running even when the browser tab is closed, provided the server remains running.
- 🔔 **Push Notifications** — Receive browser notifications with action buttons.
- 🖥️ **Linux Desktop Application** — Run Buddy Todo with a system tray icon and background scheduler.
- 📌 **Always-on-Top Popup** — Display reminders above other windows when they become due.
- 🐱 **Interactive Buddies** — Choose animal, robot, or human characters with different sounds and messages.
- 🐦 **Flying Bird Animations** — Enjoy animated visual effects when reminders appear.
- ⏳ **Snooze Reminders** — Postpone reminders for a configured number of minutes.
- 🚧 **Progress Tracking** — Track work sessions and follow up on unfinished tasks.
- 📊 **Task Duration Tracking** — Record task start times, completion times, and durations.
- 🔁 **Repeated Follow-ups** — Receive reminders again when tasks remain incomplete.
- ⚙️ **Configurable Defaults** — Customize scheduler settings and reminder behavior.
- 📦 **Linux Packaging** — Build AppImage and Debian (`.deb`) packages using the configured build scripts.

## 🖥️ Supported Platforms

| Platform | Availability | Features |
| --- | --- | --- |
| Linux Desktop | Supported | System tray, background scheduler, always-on-top reminder popup |
| Web Browser | Supported | Task management, scheduling, browser notifications |

The desktop packaging commands are configured to build Linux AppImage and Debian package formats.

## 📋 Prerequisites

Before running Buddy Todo, make sure you have the following installed:

- Node.js
- npm
- A supported web browser for the web application
- A supported Linux desktop environment for the desktop application

Check your installed versions:

```bash
node --version
npm --version
```

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd buddy-todo
```

Replace `<YOUR_GITHUB_REPOSITORY_URL>` with the URL of your GitHub repository.

### 2. Install Dependencies

```bash
npm install
```

This installs the dependencies defined in `package.json`.

## 🌐 Run the Web Application

Start the web application:

```bash
npm start
```

Open your browser and visit:

**<http://localhost:3000>**

### Enable Browser Notifications

1. Open Buddy Todo in your browser.
2. Click **Enable sound & notifications**.
3. Allow notification permissions when prompted.
4. Create a task and configure its reminder schedule.
5. Wait for the scheduled reminder to trigger.

### Browser Notification Requirements

Browser push notifications generally require HTTPS or localhost.

For access from a phone or another device, deploy the application over HTTPS.

The server-side scheduler continues to process reminders while the browser tab is closed, provided the server is still running.

## 🐧 Run the Linux Desktop Application

Buddy Todo includes a Linux desktop application with a system tray icon, background scheduler, and always-on-top reminder popups.

### Start the Desktop Application

```bash
npm run app
```

### Build Linux Packages

To build distributable packages, run:

```bash
npm run dist
```

Depending on the configured build scripts, the generated packages are placed in the `dist/` directory.

Expected formats include:

- **AppImage:** `.AppImage`
- **Debian Package:** `.deb`

### Desktop Application Behavior

- Closing the application window hides it instead of terminating the application.
- The application remains in the system tray and continues running its scheduler.
- The tray menu includes a **Start at login** option.
- Enabling Start at login creates the following autostart entry:

  ```text
  ~/.config/autostart/buddy-todo.desktop
  ```

- When a reminder becomes due, an always-on-top popup appears with the buddy animation, sound, flying birds, and three action buttons.
- Application data is stored in:

  ```text
  ~/.config/buddy-todo/data/
  ```

### GNOME System Tray Support

On some GNOME systems, the tray icon requires the **AppIndicator and KStatusNotifierItem Support** extension.

Install and enable the appropriate extension for your desktop environment if the tray icon is not visible.

## ⏰ How Reminders Work

Buddy Todo provides three primary reminder actions.

| Action | Description |
| --- | --- |
| ✅ **Completed** | Records the task's start time, completion time, and duration. Recurring tasks are scheduled for their next occurrence, while one-time tasks are marked as done. |
| ⏰ **Later** | Postpones the reminder for the configured number of minutes. |
| 🚧 **Progress** | Records a work session with its start time, end time, and duration. When the session ends, Buddy Todo asks whether the task is complete. |
| 🔔 **No response** | Repeats the reminder at the configured follow-up interval. |

### Progress Tracking Workflow

When you select **Progress**:

1. Buddy Todo records the beginning of a work session.
2. The session runs for the configured progress block length.
3. When the session ends, the application asks whether the task is completed.
4. If the task is completed, the task is marked accordingly.
5. If work remains, another session can begin.
6. The process continues until the task is completed.

This helps you focus on a task while keeping track of your working time.

## 📅 Task Scheduling Options

Each task can be configured with the following options:

| Setting | Description |
| --- | --- |
| Repeat | Schedule once, daily, or weekly on selected days |
| Reminder Time | Set the time when the reminder should trigger |
| Progress Block Length | Configure the duration of a work session |
| Later Interval | Set the number of minutes before a postponed reminder returns |
| Follow-up Interval | Configure how often an incomplete task triggers another reminder |
| Buddy | Choose the character associated with the task |
| Attitude | Configure the buddy's message style |

### Time Zone Configuration

Times use the server's local time zone.

To run the web application using Indian Standard Time:

```bash
TZ=Asia/Kolkata npm start
```

Use the appropriate startup configuration if you want the desktop application to use the same time zone.

## 🐾 Buddy Characters

Buddy Todo includes different character types designed to make reminders more engaging.

| Buddy Type | Behavior |
| --- | --- |
| 🐱 Cat | Meow sounds and character messages |
| 🐶 Dog | Bark sounds and character messages |
| 🐦 Bird | Chirp sounds and character messages |
| 🤖 Robot | Robot beeps and character messages |
| 🧑 Human | Silent reminders with attitude-based messages |

The available character behavior is implemented in `public/js/characters.js` and `public/js/sound.js`.

## 🔔 Notification Notes

- Browser push notifications require a supported browser and appropriate notification permissions.
- Push notifications generally require HTTPS outside localhost.
- Some operating systems display only two action buttons in system notifications.
- The in-app reminder popup supports all three task actions.
- System notification actions use the configured default progress block length.
- Use the in-app popup when you need to select custom progress durations.

## 🏗️ Project Structure

The project is organized into server-side scheduling, storage, push notification handling, and client-side application components.

```text
buddy-todo/
├── server.js
├── package.json
├── data/
│   ├── tasks.json
│   ├── subs.json
│   └── vapid.json
├── src/
│   ├── config.js
│   ├── store.js
│   ├── schedule.js
│   ├── engine.js
│   └── push.js
└── public/
    ├── index.html
    ├── css/
    │   └── style.css
    ├── manifest.webmanifest
    ├── icon.svg
    ├── sw.js
    └── js/
        ├── app.js
        ├── api.js
        ├── characters.js
        ├── sound.js
        └── birds.js
```

### Important Files

| File | Responsibility |
| --- | --- |
| `server.js` | Express application and REST API |
| `package.json` | Dependencies and npm scripts |
| `src/config.js` | Global configuration, scheduler settings, and defaults |
| `src/store.js` | JSON file storage |
| `src/schedule.js` | Next-due calculation for one-time, daily, and weekly tasks |
| `src/engine.js` | Task state machine and background scheduler loop |
| `src/push.js` | Web Push, VAPID keys, subscriptions, and notification delivery |
| `public/index.html` | Web application interface |
| `public/css/style.css` | Application styling |
| `public/sw.js` | Service worker and notification actions |
| `public/js/app.js` | User interface, forms, task list, popups, polling, and push registration |
| `public/js/api.js` | API request helpers |
| `public/js/characters.js` | Buddy characters and attitude messages |
| `public/js/sound.js` | Synthesized sounds and chimes |
| `public/js/birds.js` | Flying bird animations |

## 🗃️ Data Storage

Buddy Todo uses JSON-based file storage.

The storage implementation is located in:

```text
src/store.js
```

The application creates and maintains runtime data files for tasks, subscriptions, and push notification configuration.

Depending on the application configuration, runtime data may be stored in the project's `data/` directory or the desktop application's configuration directory.

The storage layer can be adapted to use a database such as PostgreSQL if database-backed persistence is required.

### Protect Runtime Data

Before publishing the repository, ensure that private or machine-specific runtime data is not committed.

In particular, review:

- Task data
- Push notification subscriptions
- Generated VAPID keys
- Environment files
- API keys and credentials
- Local configuration files

Keep the source code and runtime data separate whenever possible.

## ⚙️ Configuration

Global scheduler settings and default values are maintained in:

```text
src/config.js
```

Review this file to understand the available configuration options before modifying scheduler intervals, reminder defaults, or other global settings.

## 🔐 Security Considerations

When deploying Buddy Todo on a public server:

- Use HTTPS for browser push notifications.
- Never commit private keys, passwords, or API credentials.
- Protect any endpoints that expose or modify task data.
- Validate incoming API requests.
- Restrict access to sensitive runtime files.
- Review the server configuration before exposing the application to the internet.

The repository should contain source code and safe configuration examples, not private runtime data.

## 🤝 Contributing

Contributions from the open-source community are welcome!

You can contribute by:

- 🐛 Reporting bugs
- 💡 Suggesting new features
- 📝 Improving documentation
- 🛠️ Fixing issues
- 🚀 Enhancing existing functionality
- 🧪 Testing on different Linux distributions and browsers

### Contribution Workflow

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test your changes locally.
5. Commit your changes with a descriptive message.
6. Submit a pull request explaining your improvements.

Please ensure that changes do not introduce regressions in task scheduling, notifications, or desktop application behavior.

## 🐛 Bug Reports and Feature Requests

If you encounter an issue or have an idea for improving Buddy Todo, open an issue in the GitHub repository.

When reporting a bug, include:

- A clear description of the problem
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Operating system and version
- Relevant error messages or logs

Avoid including passwords, private keys, personal task data, or other sensitive information in public issues.

## 📜 License

Buddy Todo is open-source software licensed under the **MIT License**.

You are free to use, copy, modify, merge, publish, distribute, sublicense, and sell copies of the software, subject to the conditions of the MIT License.

The MIT License requires the copyright notice and permission notice to be included in copies or substantial portions of the software.

See the [`LICENSE`](LICENSE) file for the complete license terms.

## ⭐ Support the Project

If Buddy Todo helps you organize your daily activities, consider giving the repository a ⭐ star on GitHub.

Bug reports, feature requests, documentation improvements, and code contributions are welcome.

## 🐦 Buddy Todo

**Your friendly companion for everyday tasks.**

Stay organized. Keep moving. Get things done!
