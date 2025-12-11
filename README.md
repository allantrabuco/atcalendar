# ATCalendar

A modern, responsive calendar application built with React, TypeScript, and Vite.

## Features

- **Month, Week, and Day Views**: Switch between different calendar views to manage your schedule.
- **Drag and Drop**: Easily reschedule events by dragging and dropping them.
- **Event Management**: Create, edit, and delete events with a user-friendly interface.
- **Responsive Design**: Works seamlessly on desktop and mobile devices.
- **Modern UI**: Built with Tailwind CSS and Radix UI for a polished look and feel.

## Technologies Used

- **React**: A JavaScript library for building user interfaces.
- **TypeScript**: A typed superset of JavaScript that compiles to plain JavaScript.
- **Vite**: A fast build tool and development server.
- **Tailwind CSS**: A utility-first CSS framework for rapid UI development.
- **Radix UI**: Unstyled, accessible components for building high-quality design systems.
- **dnd-kit**: A lightweight, performant, accessible, and extensible drag and drop toolkit for React.
- **date-fns**: Modern JavaScript date utility library.
- **Motion**: A production-ready motion library for React.
- **Vitest**: A blazing fast unit test framework powered by Vite.
- **React Testing Library**: Simple and complete testing utilities that encourage good testing practices.


## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Bun (v1.0 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/allantrabuco/ATCalendar.git
   cd ATCalendar
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Start the development server:
   ```bash
   bun run dev
   ```

4. Open your browser and navigate to `http://localhost:5000`.

## Scripts

- `bun run dev`: Starts the development server.
- `bun run build`: Builds the application for production.
- `bun run preview`: Previews the production build locally.
- `bun run lint`: Runs ESLint to check for code style issues.
- `bun test`: Runs tests using Vitest.
- `bun run format`: Formats code using Prettier.

## Testing

This project includes a comprehensive test suite using **Vitest** and **React Testing Library**.

### Running Tests

To run the test suite:

```bash
bun test
```

This will run all unit and integration tests. The test runner operates in watch mode by default, re-running tests as you modify files.

### Test Structure

- **Unit Tests**: Located alongside components (e.g., `GlobalLoading.test.tsx`) or in `src/lib`.
- **Setup**: Global test configuration is in `src/test/setup.ts`.


## License

This project is licensed under the MIT License.
