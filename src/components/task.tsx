import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type InferRequestType, type InferResponseType } from "hono/client";
import { client } from "../App";
import { Checkbox } from "./ui/checkbox";

type Task = InferResponseType<typeof client.api.todo.$get>["todos"][number];

const Task = ({ task }: { task: Task }) => {
  const queryClient = useQueryClient();
  const $patch = client.api.todo[":id"].status.$patch;

  const mutation = useMutation<
    InferResponseType<typeof $patch>,
    Error,
    InferRequestType<typeof $patch>["form"] &
      InferRequestType<typeof $patch>["param"]
  >(
    async (todo) => {
      const res = await $patch({
        form: { status: todo.status },
        param: { id: todo.id },
      });
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
    <div className="flex my-4 px-2 items-center justify-between">
      <li>{task.message}</li>
      <Checkbox
        onCheckedChange={(checked) => {
          console.log(checked);

          mutation.mutate({
            id: task.id.toString(),
            status: Number(checked === true).toString(),
          });
        }}
        checked={!!task.status}
      />
    </div>
  );
};

export default Task;
