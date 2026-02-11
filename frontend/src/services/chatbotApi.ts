import { supabase } from "@/integrations/supabase/client";

export interface ChatMessage {
  message: string;
  session_id?: string;
  user_id?: string | null;
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

export interface ChatResponse {
  response: string;
  message: string;
  session_id: string;
}

export interface ConversationHistory {
  id: string;
  session_id: string;
  user_id: string | null;
  role: "user" | "assistant";
  message: string;
  created_at: string;
}

// Platform information for the chatbot context
const PLATFORM_INFO = `
You are a helpful AI assistant for Inbound Genie, an AI-powered voice automation platform. Your purpose is to answer questions about the platform's features, services, and how to use it. You should ONLY provide information about the platform and NOT answer technical, backend, or programming-related questions.

CRITICAL CONTENT GUIDELINES:
- DO NOT use emojis, stars (*), decorative symbols, or any special characters for decoration
- DO NOT use markdown formatting like **bold** or any asterisks for emphasis
- Use only plain professional text with proper headers and content
- Keep content human-like, natural, and professional
- Use simple text formatting only (plain headers, bullet points with dashes, paragraphs)

## Platform Overview:
Inbound Genie is an AI-powered voice automation platform designed to help businesses manage inbound calls with intelligent AI voice bots. The platform enables companies to automate customer service, lead qualification, appointment scheduling, and more through natural voice conversations.

## Main Features:

### AI Voice Bots:
1. **Inbound Call Management**: Automatically answer and handle incoming calls with AI voice bots
2. **Customizable Voice Agents**: Create and configure AI agents with custom prompts, voices, and behaviors
3. **Natural Conversations**: Advanced AI enables natural, human-like voice conversations
4. **Call Routing**: Intelligent call routing and transfer capabilities
5. **Multi-Voice Support**: Choose from various voice providers (ElevenLabs, OpenAI, Deepgram, Cartesia, Minimax)

### Call Management:
1. **Call Analytics**: Track and analyze call performance, duration, and outcomes
2. **Call Recording**: Record and review conversations for quality assurance
3. **Lead Qualification**: Automatically identify and qualify leads from calls
4. **Sentiment Analysis**: Understand caller sentiment and satisfaction
5. **Call Transcripts**: Get real-time and post-call transcripts

### Bot Configuration:
1. **Custom Prompts**: Define how your bots respond with custom system prompts
2. **Voice Settings**: Configure voice characteristics, speed, temperature, and more
3. **Knowledge Bases**: Connect bots to knowledge bases for accurate information
4. **Unavailability Settings**: Set time-based availability for your bots
5. **Transfer Settings**: Configure when and how to transfer calls to human agents

### Phone Numbers:
1. **Phone Number Management**: Manage and configure phone numbers for your bots
2. **Incoming Call Handling**: Set up bots to handle calls on specific numbers

### Analytics & Insights:
1. **Call Statistics**: View total calls, pending, in-progress, completed, and failed calls
2. **Lead Tracking**: Track qualified leads from calls
3. **Credit Usage**: Monitor call credits and usage
4. **Performance Metrics**: Analyze bot performance and effectiveness

### Billing & Credits:
1. **Credit System**: Pay-per-use credit system for calls
2. **Usage Tracking**: Monitor minutes used and credits remaining
3. **Billing Management**: Manage subscription and payment status

## Important Guidelines:
- ONLY answer questions about the platform, its features, bots, calls, and how to use it
- DO NOT provide technical details about backend systems, database structure, API endpoints, or code implementation
- DO NOT answer programming questions or provide code examples
- DO NOT answer questions about server configuration, deployment, or technical architecture
- If asked about technical details, politely redirect to platform features or suggest contacting support
- Be friendly, helpful, and concise
- You can answer in any language the user asks in
- Focus on user-facing features and benefits
`;

export const chatbotApi = {
  /**
   * Send a message to the chatbot (calls OpenAI directly from frontend)
   */
  async sendMessage(
    message: string,
    conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = [],
    sessionId?: string,
    userId?: string | null
  ): Promise<ChatResponse> {
    // Check for OpenAI API key
    const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      throw new Error(
        "OpenAI API key not found. Please add VITE_OPENAI_API_KEY to your .env file."
      );
    }

    // Generate session_id if not provided
    const finalSessionId =
      sessionId ||
      `chat_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    // Save user message to database
    try {
      await supabase.from("chatbot_conversations").insert({
        session_id: finalSessionId,
        user_id: userId || null,
        role: "user",
        message: message,
      });
    } catch (error) {
      // Removed console.error for security
      // Continue even if save fails
    }

    // Build messages array for OpenAI
    const messages = [
      {
        role: "system",
        content: PLATFORM_INFO,
      },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      {
        role: "user",
        content: message,
      },
    ];

    // Call OpenAI API directly
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `OpenAI API error: ${response.status}`
      );
    }

    const data = await response.json();
    const botResponse =
      data.choices[0]?.message?.content ||
      "I'm sorry, I couldn't generate a response. Please try again.";

    // Save assistant response to database
    try {
      await supabase.from("chatbot_conversations").insert({
        session_id: finalSessionId,
        user_id: userId || null,
        role: "assistant",
        message: botResponse,
      });
    } catch (error) {
      // Removed console.error for security
      // Continue even if save fails
    }

    return {
      response: botResponse,
      message: botResponse, // For compatibility
      session_id: finalSessionId,
    };
  },

  /**
   * Get conversation history for a session
   */
  async getHistory(
    sessionId: string,
    userId?: string | null
  ): Promise<{ messages: ConversationHistory[]; session_id: string }> {
    let query = supabase
      .from("chatbot_conversations")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message || "Failed to fetch conversation history");
    }

    return {
      messages: (data as ConversationHistory[]) || [],
      session_id: sessionId,
    };
  },
};
