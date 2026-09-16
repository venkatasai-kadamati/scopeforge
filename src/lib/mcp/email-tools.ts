import { ToolDefinition } from "../../types";

export const EMAIL_MCP_TOOLS: ToolDefinition[] = [
  {
    name: "searchEmails",
    description: "Search the user's inbox and archive for emails matching query filters such as sender, keywords, date ranges, and status.",
    riskLevel: "low",
    category: "read",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query string or search filters (e.g., 'is:unread', 'from:alice')" },
        maxResults: { type: "number", description: "Maximum number of messages to return (default: 10)" },
        folder: { type: "string", description: "Target folder (e.g., 'INBOX', 'Archive', 'Trash')" }
      },
      required: ["query"]
    }
  },
  {
    name: "readEmail",
    description: "Retrieve full email content, headers, sender, recipient list, and body text by message ID.",
    riskLevel: "low",
    category: "read",
    parameters: {
      type: "object",
      properties: {
        messageId: { type: "string", description: "Unique identifier of the message to read" },
        format: { type: "string", enum: ["full", "summary", "headers_only"], description: "Level of detail to fetch" }
      },
      required: ["messageId"]
    }
  },
  {
    name: "createDraft",
    description: "Create an email draft response or new outgoing draft in the user's drafts folder without sending it.",
    riskLevel: "low",
    category: "draft",
    parameters: {
      type: "object",
      properties: {
        to: { type: "string", description: "Recipient email address" },
        subject: { type: "string", description: "Subject line of the draft email" },
        body: { type: "string", description: "Body content of the draft message" },
        replyToMessageId: { type: "string", description: "Optional message ID if this is a reply draft" }
      },
      required: ["to", "subject", "body"]
    }
  },
  {
    name: "downloadAttachment",
    description: "Download a file attachment associated with an email to local storage or working memory.",
    riskLevel: "medium",
    category: "data",
    parameters: {
      type: "object",
      properties: {
        messageId: { type: "string", description: "ID of the email containing the attachment" },
        attachmentId: { type: "string", description: "ID of the attachment file" },
        filename: { type: "string", description: "Name of the target file" }
      },
      required: ["messageId", "attachmentId"]
    }
  },
  {
    name: "sendEmail",
    description: "Send an email immediately to one or more external or internal recipients over SMTP.",
    riskLevel: "high",
    category: "action",
    parameters: {
      type: "object",
      properties: {
        to: { type: "string", description: "Recipient email address" },
        subject: { type: "string", description: "Email subject line" },
        body: { type: "string", description: "Email body content" },
        cc: { type: "string", description: "Optional CC recipients" },
        bcc: { type: "string", description: "Optional BCC recipients" }
      },
      required: ["to", "subject", "body"]
    }
  },
  {
    name: "deleteEmail",
    description: "Permanently delete an email message or immediately purge it from the mailbox.",
    riskLevel: "high",
    category: "destructive",
    parameters: {
      type: "object",
      properties: {
        messageId: { type: "string", description: "ID of the email message to delete" },
        permanent: { type: "boolean", description: "If true, bypass trash and permanently remove" }
      },
      required: ["messageId"]
    }
  },
  {
    name: "modifyLabels",
    description: "Add, update, or remove mailbox categorization labels or tags from an email.",
    riskLevel: "medium",
    category: "organize",
    parameters: {
      type: "object",
      properties: {
        messageId: { type: "string", description: "Target email ID" },
        addLabels: { type: "array", items: { type: "string" }, description: "Labels to apply" },
        removeLabels: { type: "array", items: { type: "string" }, description: "Labels to remove" }
      },
      required: ["messageId"]
    }
  },
  {
    name: "moveEmail",
    description: "Move an email message to a different folder, archive, or trash folder.",
    riskLevel: "medium",
    category: "organize",
    parameters: {
      type: "object",
      properties: {
        messageId: { type: "string", description: "Target email ID" },
        destinationFolder: { type: "string", description: "Target folder (e.g., 'Archive', 'Trash', 'Spam', 'Work')" }
      },
      required: ["messageId", "destinationFolder"]
    }
  }
];

export const TOOL_NAMES = EMAIL_MCP_TOOLS.map(t => t.name);

export function getToolDefinition(name: string): ToolDefinition | undefined {
  return EMAIL_MCP_TOOLS.find(t => t.name === name);
}
