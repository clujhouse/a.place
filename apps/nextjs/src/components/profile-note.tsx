"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "next-auth";
import { format } from "date-fns";
import { Edit, Trash } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@acme/ui/card";
import { Textarea } from "@acme/ui/textarea";
import { toast } from "@acme/ui/toast";

import { useTRPC } from "~/trpc/react";

// Define the ProfileNote type based on the schema
interface ProfileNote {
  id: string;
  postingUserId: string;
  receivingUserId: string;
  text: string;
  createdAt: Date;
}

interface ProfileNoteProps {
  note?: ProfileNote;
  currentUser: Session["user"];
  receivingUserId: string;
  onNoteAdded?: () => void;
  onNoteUpdated?: () => void;
  editable?: boolean;
}

export function ProfileNote({
  note,
  currentUser,
  receivingUserId,
  onNoteAdded,
  onNoteUpdated,
  editable = true,
}: ProfileNoteProps) {
  const [text, setText] = useState(note?.text || "");
  const [isEditing, setIsEditing] = useState(!note);
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { mutate: createNote, isPending: isCreating } = useMutation(
    trpc.profileNote.create.mutationOptions({
      onSuccess: () => {
        toast.success("Note added successfully!");
        setText("");
        onNoteAdded?.();
        router.refresh();
        void queryClient.invalidateQueries({
          queryKey: trpc.profileNote.getByReceivingUserId.queryKey({ receivingUserId }),
        });
      },
      onError: () => {
        toast.error("Failed to add note");
      },
    }),
  );

  const { mutate: updateNote, isPending: isUpdating } = useMutation(
    trpc.profileNote.update.mutationOptions({
      onSuccess: () => {
        toast.success("Note updated successfully!");
        setIsEditing(false);
        // Invalidate queries to update the notes list
        void queryClient.invalidateQueries({
            queryKey: trpc.profileNote.getByReceivingUserId.queryKey({ receivingUserId }),
        });
        onNoteUpdated?.();
      },
      onError: () => {
        toast.error("Failed to update note");
      },
    }),
  );

  const { mutate: deleteNote, isPending: isDeleting } = useMutation(
    trpc.profileNote.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Note deleted successfully!");
        // Invalidate queries to update the notes list
        void queryClient.invalidateQueries({
            queryKey: trpc.profileNote.getByReceivingUserId.queryKey({ receivingUserId }),
        });
        onNoteUpdated?.();
      },
      onError: () => {
        toast.error("Failed to delete note");
      },
    }),
  );

  const handleSave = () => {
    if (!text.trim()) return;

    if (note) {
      updateNote({
        id: note.id,
        text,
      });
    } else {
      createNote({
        receivingUserId,
        text,
      });
    }
  };

  const handleDelete = () => {
    if (note) {
      deleteNote({
        id: note.id,
      });
    }
  };

  const isOwner = note ? note.postingUserId === currentUser?.id : true;
  const canEdit = isOwner && editable;
  const isPending = isCreating || isUpdating || isDeleting;

  if (!isEditing) {
    return (
      <Card className="w-full mb-4 p-0">
        <CardHeader className="flex flex-row items-center justify-between px-6 py-2">
          <div className="text-sm text-muted-foreground">
            {note && format(new Date(note.createdAt), "MMM d, yyyy 'at' h:mm a")}
          </div>
          {canEdit && (
            <div className="flex space-x-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsEditing(true)}
                aria-label="Edit note"
                disabled={isPending}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleDelete}
                aria-label="Delete note"
                disabled={isPending}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{note?.text}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full mb-4 border-none p-0">
      <CardHeader className="pb-2">
        <div className="text-sm text-muted-foreground">
          {note ? "Edit note" : "Add a note"}
        </div>
      </CardHeader>
      <CardContent>
        <Textarea
          value={text}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
          placeholder="Write your note here..."
          className="min-h-[100px]"
          disabled={isPending}
        />
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        {note && (
          <Button 
            variant="outline" 
            onClick={() => setIsEditing(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
        )}
        <Button 
          onClick={handleSave}
          disabled={!text.trim() || isPending}
        >
          {isPending ? "Saving..." : note ? "Update" : "Save"}
        </Button>
      </CardFooter>
    </Card>
  );
} 