import type { TRPCRouterRecord } from "@trpc/server";
import { and, desc, eq, or } from "drizzle-orm";
import { z } from "zod";

import { conversationMessage, profile, user } from "@acme/db/schema";

import { protectedProcedure } from "../trpc";

export const conversationRouter = {
  // Send a message to another user
  sendMessage: protectedProcedure
    .input(
      z.object({
        receiverId: z.string(),
        text: z.string().min(1).max(1000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const message = await ctx.db
        .insert(conversationMessage)
        .values({
          senderId: ctx.session.user.id,
          recieverId: input.receiverId,
          text: input.text,
        })
        .$returningId();

      return { success: true, messageId: message[0]?.id };
    }),

  // Get all conversations for the current user
  getConversations: protectedProcedure.query(async ({ ctx }) => {
    const conversations = await ctx.db
      .select({
        id: conversationMessage.id,
        text: conversationMessage.text,
        createdAt: conversationMessage.createdAt,
        read: conversationMessage.read,
        senderId: conversationMessage.senderId,
        receiverId: conversationMessage.recieverId,
        senderName: user.name,
        senderImage: user.image,
      })
      .from(conversationMessage)
      .leftJoin(user, eq(conversationMessage.senderId, user.id))
      .where(
        or(
          eq(conversationMessage.senderId, ctx.session.user.id),
          eq(conversationMessage.recieverId, ctx.session.user.id),
        ),
      )
      .orderBy(desc(conversationMessage.createdAt));

    // Get all unique partner IDs
    const partnerIds = Array.from(
      new Set(
        conversations.map((msg) =>
          msg.senderId === ctx.session.user.id ? msg.receiverId : msg.senderId,
        ),
      ),
    );

    // Get partner information including profile images
    const partners = await ctx.db
      .select({
        id: user.id,
        name: user.name,
        image: user.image,
        profileImage: profile.profileImage,
      })
      .from(user)
      .leftJoin(profile, eq(user.id, profile.userId))
      .where(or(...partnerIds.map((id) => eq(user.id, id))));

    const partnersMap = partners.reduce(
      (acc, partner) => {
        acc[partner.id] = partner;
        return acc;
      },
      {} as Record<
        string,
        {
          id: string;
          name: string | null;
          image: string | null;
          profileImage: string | null;
        }
      >,
    );

    // Group messages by conversation partner
    const groupedConversations = conversations.reduce(
      (acc, message) => {
        const partnerId =
          message.senderId === ctx.session.user.id
            ? message.receiverId
            : message.senderId;

        if (!acc[partnerId]) {
          const partner = partnersMap[partnerId];
          acc[partnerId] = {
            partnerId,
            partnerName: partner?.name || "Unknown",
            partnerImage: partner?.profileImage || partner?.image,
            messages: [],
            lastMessage: message,
            unreadCount: 0,
          };
        }

        acc[partnerId].messages.push(message);

        // Count unread messages (messages sent to current user that are unread)
        if (message.receiverId === ctx.session.user.id && !message.read) {
          acc[partnerId].unreadCount++;
        }

        // Update last message if this one is newer
        if (message.createdAt > acc[partnerId].lastMessage.createdAt) {
          acc[partnerId].lastMessage = message;
        }

        return acc;
      },
      {} as Record<string, any>,
    );

    return Object.values(groupedConversations);
  }),

  // Get messages with a specific user
  getMessagesWithUser: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: otherUserId }) => {
      const messages = await ctx.db
        .select({
          id: conversationMessage.id,
          text: conversationMessage.text,
          createdAt: conversationMessage.createdAt,
          read: conversationMessage.read,
          senderId: conversationMessage.senderId,
          receiverId: conversationMessage.recieverId,
        })
        .from(conversationMessage)
        .where(
          or(
            and(
              eq(conversationMessage.senderId, ctx.session.user.id),
              eq(conversationMessage.recieverId, otherUserId),
            ),
            and(
              eq(conversationMessage.senderId, otherUserId),
              eq(conversationMessage.recieverId, ctx.session.user.id),
            ),
          ),
        )
        .orderBy(conversationMessage.createdAt);

      // Mark messages as read if they were sent to the current user
      await ctx.db
        .update(conversationMessage)
        .set({ read: true })
        .where(
          and(
            eq(conversationMessage.senderId, otherUserId),
            eq(conversationMessage.recieverId, ctx.session.user.id),
            eq(conversationMessage.read, false),
          ),
        );

      return messages;
    }),

  // Mark conversation as read
  markAsRead: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: otherUserId }) => {
      await ctx.db
        .update(conversationMessage)
        .set({ read: true })
        .where(
          and(
            eq(conversationMessage.senderId, otherUserId),
            eq(conversationMessage.recieverId, ctx.session.user.id),
            eq(conversationMessage.read, false),
          ),
        );

      return { success: true };
    }),
} satisfies TRPCRouterRecord;
