import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface InvitationEmailProps {
  inviterName: string;
  organizationName: string;
  invitationLink: string;
  inviteeEmail: string;
  role: string;
}

export default function InvitationEmail({
  inviterName = "Team Member",
  organizationName = "Comment.video",
  invitationLink = "https://comment.video/invitation/example",
  inviteeEmail = "colleague@example.com",
  role = "member",
}: InvitationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        You're invited to join {organizationName} on Comment.video
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Team Invitation</Heading>
          <Text style={text}>Hello {inviteeEmail},</Text>
          <Text style={text}>
            <strong>{inviterName}</strong> has invited you to join their team on{" "}
            <strong>{organizationName}</strong> as a <strong>{role}</strong>.
          </Text>
          <Section style={buttonContainer}>
            <Button
              style={{
                ...button,
                padding: "12px 16px",
              }}
              href={invitationLink}
            >
              Accept Invitation
            </Button>
          </Section>
          <Text style={text}>
            This invitation will expire in 7 days. If you don't have a
            Comment.video account, you can create one when accepting this
            invitation.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            If you didn't expect this invitation, you can safely ignore this
            email. If you're having trouble with the button above, copy and
            paste this URL into your browser:{" "}
            <Link href={invitationLink} style={link}>
              {invitationLink}
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
  padding: "50px 0",
};

const container = {
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "5px",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  margin: "0 auto",
  maxWidth: "600px",
  padding: "40px",
};

const h1 = {
  color: "#111827",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0 0 24px",
  textAlign: "center" as const,
};

const text = {
  color: "#334155",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "16px 0",
};

const buttonContainer = {
  margin: "28px 0",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#000000",
  borderRadius: "5px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  width: "200px",
};

const hr = {
  borderColor: "#e2e8f0",
  margin: "32px 0",
};

const footer = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "22px",
};

const link = {
  color: "#2563eb",
  textDecoration: "underline",
};
