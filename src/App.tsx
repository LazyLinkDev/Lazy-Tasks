import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { InferRequestType, InferResponseType, hc } from "hono/client";
import { BadgePlus } from "lucide-react";
import { AppType } from "../functions/api/[[route]]";
import { ModeToggle } from "./components/mode-toggle";
import { ThemeProvider } from "./components/theme-provider";
import { Button } from "./components/ui/button";

const queryClient = new QueryClient();
const client = hc<AppType>("/");

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

  const $post = client.api.todo.$post;

  const mutation = useMutation<
    InferResponseType<typeof $post>,
    Error,
    InferRequestType<typeof $post>["form"]
  >(
    async (todo) => {
      const res = await $post({ form: todo });
      return await res.json();
    },
    {
      onSuccess: async () => {
        queryClient.invalidateQueries({ queryKey: ["todos"] });
      },
      onError: (error) => {
        console.log(error);
      },
    }
  );

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
          <Button
            className="w-4/5 mx-auto mb-4"
            onClick={() => mutation.mutate({ message: "Write code" })}
          >
            <BadgePlus className="mr-2 h-4 w-4" />
            Add Todo
          </Button>

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
