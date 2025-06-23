## Soma Capital Technical Assessment

This is a technical assessment as part of the interview process for Soma Capital.

> [!IMPORTANT]  
> You will need a Pexels API key to complete the technical assessment portion of the application. You can sign up for a free API key at https://www.pexels.com/api/  

To begin, clone this repository to your local machine.

## Development

This is a [NextJS](https://nextjs.org) app, with a SQLite based backend, intended to be run with the LTS version of Node.

To run the development server:

```bash
npm i
npm run dev
```

## Task:

Modify the code to add support for due dates, image previews, and task dependencies.

### Part 1: Due Dates 

When a new task is created, users should be able to set a due date.

When showing the task list is shown, it must display the due date, and if the date is past the current time, the due date should be in red.

### Part 2: Image Generation 

When a todo is created, search for and display a relevant image to visualize the task to be done. 

To do this, make a request to the [Pexels API](https://www.pexels.com/api/) using the task description as a search query. Display the returned image to the user within the appropriate todo item. While the image is being loaded, indicate a loading state.

You will need to sign up for a free Pexels API key to make the fetch request. 

### Part 3: Task Dependencies

Implement a task dependency system that allows tasks to depend on other tasks. The system must:

1. Allow tasks to have multiple dependencies
2. Prevent circular dependencies
3. Show the critical path
4. Calculate the earliest possible start date for each task based on its dependencies
5. Visualize the dependency graph

## Submission:

1. Add a new "Solution" section to this README with a description and screenshot or recording of your solution. 
2. Push your changes to a public GitHub repository.
3. Submit a link to your repository in the application form.

Thanks for your time and effort. We'll be in touch soon!
# soma-techical-assesment

## Solution

### Features Implemented

- **Due Dates:**
  - Users can set a due date for each todo.
  - Due dates are displayed in the list, and overdue dates are highlighted in red.

- **Image Previews:**
  - When a todo is created, a relevant image is fetched from the Pexels API using the task description.
  - Images are displayed for each todo with a loading state while fetching.

- **Task Dependencies:**
  - Users can select multiple dependencies for each task.
  - Circular dependencies (direct and indirect) are prevented.
  - The critical path (longest dependency chain) is calculated and visualized.
  - The earliest possible start date for each task is calculated and displayed.
  - The dependency graph is visualized using Mermaid, with the critical path highlighted.

### How to Run

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Set up your Pexels API key:**
   - Create a `.env` file in the project root (if it doesn't exist).
   - Add your API key:
     ```
     PEXELS_API_KEY=your_actual_pexels_api_key_here
     ```
3. **Run database migrations:**
   ```bash
   npx prisma migrate dev
   ```
4. **Start the development server:**
   ```bash
   npm run dev
   ```
5. **Open the app:**
   - Visit [http://localhost:3000](http://localhost:3000) in your browser.

### Demo

![Screenshot](https://github.com/gokulprathin8/soma-techical-assesment/raw/main/screenshot.png)
