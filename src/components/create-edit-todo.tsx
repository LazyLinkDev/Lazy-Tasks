import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono/client";
import { BadgePlus } from "lucide-react";
import { Dispatch, SetStateAction, forwardRef, useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { client } from "../App";
import useIsMobile from "../hooks/use-is-mobile";
import { type TaskType } from "./task";
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

export const formSchema = z.object({
  message: z.string().min(1, "A task title is required"),
  status: z.boolean().default(false),
});

const AddButton = forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentPropsWithoutRef<typeof Button>
>(({ ...props }, ref) => (
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
            <FormMessage className="col-span-4" />
          </FormItem>
        </div>
      )}
    />
  </>
);

export const CreateSheet = ({
  form,
  onSubmit,
  isOpen,
  setIsOpen,
  isEdit = false,
}: {
  form: UseFormReturn<z.infer<typeof formSchema>>;
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  isEdit?: boolean;
}) => {
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      {!isEdit && (
        <SheetTrigger asChild>
          <AddButton />
        </SheetTrigger>
      )}
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>New Task</SheetTitle>
        </SheetHeader>
        <TaskForm form={form} />
        <SheetFooter>
          <Button
            onClick={async () => {
              form.handleSubmit(onSubmit)();
              if (!form.formState.isDirty && form.formState.isValid)
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

export const CreateDialog = ({
  form,
  onSubmit,
  isOpen,
  setIsOpen,
  isEdit = false,
}: {
  form: UseFormReturn<z.infer<typeof formSchema>>;
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  isEdit?: boolean;
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {!isEdit && (
        <DialogTrigger asChild>
          <AddButton />
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
        </DialogHeader>
        <TaskForm form={form} />
        <DialogFooter>
          <Button
            onClick={async () => {
              form.handleSubmit(onSubmit)();
              if (!form.formState.isDirty && form.formState.isValid)
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

const CreateEditToDo = ({ todo }: { todo?: TaskType }) => {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

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
    defaultValues: { message: todo?.message ?? "" },
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
          <CreateSheet
            form={form}
            onSubmit={onSubmit}
            isOpen={isOpen}
            setIsOpen={setIsOpen}
          />
        ) : (
          <CreateDialog
            form={form}
            onSubmit={onSubmit}
            isOpen={isOpen}
            setIsOpen={setIsOpen}
          />
        )}
      </form>
    </Form>
  );
};

export default CreateEditToDo;
