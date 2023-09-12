import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type InferRequestType, type InferResponseType } from "hono/client";
import { client } from "../App";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import { Trash } from "lucide-react";

type Task = InferResponseType<typeof client.api.todo.$get>["todos"][number];

const Task = ({ task }: { task: Task }) => {
  const queryClient = useQueryClient();
  const $patch = client.api.todo[":id"].status.$patch;
  const $delete = client.api.todo[":id"].$delete;

  const updateMutation = useMutation<
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

  const deleteMutation = useMutation<
    void,
    Error,
    InferRequestType<typeof $delete>["param"]
  >(
    async (todo) => {
      await $delete({
        param: { id: todo.id },
      });
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
      <div className="flex gap-2 items-center">
        <Checkbox
          onCheckedChange={(checked) => {
            updateMutation.mutate({
              id: task.id.toString(),
              status: Number(checked === true).toString(),
            });
          }}
          checked={!!task.status}
        />
        <Button
          onClick={() => deleteMutation.mutate({ id: task.id.toString() })}
          variant="ghost"
          size="icon"
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default Task;
