import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType, hc } from "hono/client";
import { BadgePlus } from "lucide-react";
import { AppType } from "../../functions/api/[[route]]";
import useIsMobile from "../hooks/use-is-mobile";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { client } from "../App";

const CreateToDo = () => {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

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

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild={true}>
          <Button className="w-4/5 mx-auto mb-4">
            <BadgePlus className="mr-2 h-4 w-4" />
            Add Todo
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>New Task</SheetTitle>
            <SheetDescription>
              This action cannot be undone. This will permanently delete your
              account and remove your data from our servers.
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
  }
};

export default CreateToDo;
