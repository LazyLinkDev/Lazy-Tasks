import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono/client";
import { BadgePlus } from "lucide-react";
import { forwardRef, useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { client } from "../App";
import useIsMobile from "../hooks/use-is-mobile";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

const formSchema = z.object({
  message: z.string(),
});

const AddButton = forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentPropsWithoutRef<typeof Button>
>((props, ref) => (
  <Button ref={ref} {...props} className="w-4/5 mx-auto mb-4">
    <BadgePlus className="mr-2 h-4 w-4" />
    Add Todo
  </Button>
));

const TaskForm = ({
  form,
}: {
  form: UseFormReturn<z.infer<typeof formSchema>>;
}) => (
  <>
    <FormField
      control={form.control}
      name="message"
      render={({ field }) => (
        <div className="grid gap-4 py-4">
          <FormItem className="grid grid-cols-4 items-center gap-4">
            <FormLabel className="md:text-right">Task</FormLabel>
            <FormControl>
              <Input className="col-span-3" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        </div>
      )}
    />
  </>
);

const CreateSheet = ({
  form,
  onSubmit,
}: {
  form: UseFormReturn<z.infer<typeof formSchema>>;
  onSubmit: (values: z.infer<typeof formSchema>) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <AddButton />
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>New Task</SheetTitle>
        </SheetHeader>
        <TaskForm form={form} />
        <SheetFooter>
          <Button
            onClick={async () => {
              form.handleSubmit(onSubmit)();
              setIsOpen(false);
            }}
            type="submit"
          >
            Save changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

const CreateDialog = ({
  form,
  onSubmit,
}: {
  form: UseFormReturn<z.infer<typeof formSchema>>;
  onSubmit: (values: z.infer<typeof formSchema>) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <AddButton />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
        </DialogHeader>
        <TaskForm form={form} />
        <DialogFooter>
          <Button
            onClick={async () => {
              form.handleSubmit(onSubmit)();
              setIsOpen(false);
            }}
            type="submit"
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { message: "" },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    mutation.mutate(values);
    form.reset();
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 w-full flex "
      >
        {isMobile ? (
          <CreateSheet form={form} onSubmit={onSubmit} />
        ) : (
          <CreateDialog form={form} onSubmit={onSubmit} />
        )}
      </form>
    </Form>
  );
};

export default CreateToDo;
