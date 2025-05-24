"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { PaperPlaneIcon } from "@radix-ui/react-icons";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@acme/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@acme/ui/form";
import { Textarea } from "@acme/ui/textarea";

import { cn } from "~/lib/utils";

const formSchema = z.object({
  message: z.string().min(1, {
    message: "Message cannot be empty",
  }),
});

export interface ChatInputProps {
  onSubmit: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const ChatInput = ({
  onSubmit: _onSubmit,
  isLoading = false,
  placeholder = "Type a message...",
  className,
  disabled = false,
}: ChatInputProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    _onSubmit(values.message);
    form.reset();
  };

  return (
    <div className={cn("w-full", className)}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="relative flex items-end gap-2"
        >
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Textarea
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        form.handleSubmit(onSubmit)();
                      }
                    }}
                    placeholder={placeholder}
                    className="w-full !text-lg"
                    {...field}
                    disabled={disabled || isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            disabled={disabled || isLoading}
            size="icon"
            className="absolute right-4 top-1/2 h-9 w-9 -translate-y-1/2"
          >
            <PaperPlaneIcon className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </Form>
    </div>
  );
};
