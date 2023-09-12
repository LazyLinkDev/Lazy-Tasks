import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { hc } from "hono/client";
import { AppType } from "../functions/api/[[route]]";
import { ModeToggle } from "./components/mode-toggle";
import { ThemeProvider } from "./components/theme-provider";
import CreateToDo from "./components/create-todo";

const queryClient = new QueryClient();
export const client = hc<AppType>("/");

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Todos />
    </QueryClientProvider>
  );
}

const Todos = () => {
  const query = useQuery({
    queryKey: ["todos"],
    queryFn: async () => {
      const res = await client.api.todo.$get();
      return await res.json();
    },
  });

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <main className="px-8 h-screen flex flex-col max-w-lg mx-auto pt-2 lg:pt-10">
        <div className="flex flex-row justify-center w-full py-4 ">
          <h1 className="text-2xl mx-auto">Tasks</h1>
          <div className="justify-self-end">
            <ModeToggle />
          </div>
        </div>
        <div className="flex flex-col items-center">
          <CreateToDo />
          <ul>
            {query.data?.todos.map((todo) => (
              <li key={todo.id}>{todo.message}</li>
            ))}
          </ul>
        </div>
      </main>
    </ThemeProvider>
  );
};
