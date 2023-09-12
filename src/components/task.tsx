import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { hc, type InferRequestType, type InferResponseType } from "hono/client";
import { Pencil, Trash } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AppType } from "../../functions/api/[[route]]";
import { client } from "../App";
import useIsMobile from "../hooks/use-is-mobile";
import { CreateDialog, CreateSheet, formSchema } from "./create-edit-todo";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Form } from "./ui/form";

export type TaskType = InferResponseType<
  typeof client.api.todo.$get
>["todos"][number];

const $edit = hc<AppType>("/").api.todo[":id"].$patch;

const Task = ({ task }: { task: TaskType }) => {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const $patch = client.api.todo[":id"].$patch;
  const $delete = client.api.todo[":id"].$delete;
  const [isOpen, setIsOpen] = useState(false);

  const updateMutation = useMutation<
    InferResponseType<typeof $patch>,
    Error,
    InferRequestType<typeof $patch>["form"] &
      InferRequestType<typeof $patch>["param"]
  >(
    async (todo) => {
      const res = await $patch({
        form: { status: todo.status, message: todo.message },
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

  const editMutation = useMutation<
    InferResponseType<typeof $edit>,
    Error,
    InferRequestType<typeof $edit>["form"] &
      InferRequestType<typeof $edit>["param"]
  >(
    async (editTodo) => {
      const res = await $edit({
        form: {
          message: editTodo.message,
          status: Number(editTodo.status).toString(),
        },
        param: { id: task.id.toString() },
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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: task.message ?? "",
      status: task.status ?? false,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    editMutation.mutate({
      id: task.id.toString(),
      message: values.message,
      status: Number(values.status).toString(),
    });

    setIsOpen(false);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full flex my-4 px-2 items-center justify-between"
      >
        <li>{task.message}</li>
        <div className="flex items-center">
          <Checkbox
            className="me-4"
            onCheckedChange={(checked) => {
              updateMutation.mutate({
                id: task.id.toString(),
                status: Number(checked === true).toString(),
                message: task.message as string,
              });
            }}
            checked={!!task.status}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(true)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          {isMobile ? (
            <CreateSheet
              form={form}
              onSubmit={onSubmit}
              isOpen={isOpen}
              setIsOpen={setIsOpen}
              isEdit
            />
          ) : (
            <CreateDialog
              form={form}
              onSubmit={onSubmit}
              isOpen={isOpen}
              setIsOpen={setIsOpen}
              isEdit
            />
          )}

          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => deleteMutation.mutate({ id: task.id.toString() })}
          >
            <Trash className="h-4 w-4 " />
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default Task;
