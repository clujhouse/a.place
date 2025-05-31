/**
 * PostHog Analytics Events Documentation
 *
 * This file documents all PostHog events used throughout the application.
 * The events help track user behavior, conversion funnels, and feature usage.
 */

export const ANALYTICS_EVENTS = {
  // ===== UPGRADE MODAL EVENTS =====
  UPGRADE_MODAL: {
    /**
     * Fired when the upgrade modal is opened
     * Properties:
     * - source: Where the modal was opened from
     * - current_plan?: User's current subscription plan
     * - remaining_searches?: Number of searches remaining (for search_usage_indicator)
     * - used_searches?: Number of searches used (for search_usage_indicator)
     * - limit?: Search limit (for search_usage_indicator)
     */
    MODAL_OPENED: "upgrade_modal_opened",

    /**
     * Fired when a user selects a plan in the upgrade modal
     * Properties:
     * - plan: Selected plan ("pro" | "pro_exclusive")
     * - source: Where the upgrade was initiated from
     * - current_plan?: User's current plan
     */
    PLAN_SELECTED: "upgrade_plan_selected",

    /**
     * Fired when upgrade process completes successfully
     * Properties:
     * - plan: Upgraded plan
     * - source: Where the upgrade was initiated from
     * - previous_plan?: User's previous plan
     */
    UPGRADE_SUCCESS: "upgrade_completed",

    /**
     * Fired when upgrade process fails
     * Properties:
     * - plan: Attempted plan
     * - source: Where the upgrade was initiated from
     * - error_type: Type of error that occurred
     */
    UPGRADE_FAILED: "upgrade_failed",
  },

  // ===== AUTHENTICATION EVENTS =====
  AUTH: {
    /**
     * Fired when OTP request is attempted
     * Properties:
     * - auth_method: "email_otp"
     * - email_domain: Domain of the email address
     */
    OTP_REQUEST_ATTEMPTED: "auth_otp_request_attempted",

    /**
     * Fired when OTP is successfully sent
     * Properties:
     * - auth_method: "email_otp"
     * - email_domain: Domain of the email address
     */
    OTP_SENT: "auth_otp_sent",

    /**
     * Fired when OTP sending fails
     * Properties:
     * - auth_method: "email_otp"
     * - email_domain: Domain of the email address
     * - error_type: "otp_send_failed"
     */
    OTP_SEND_FAILED: "auth_otp_send_failed",

    /**
     * Fired when login is attempted
     * Properties:
     * - auth_method: "email_otp" | "google_oauth"
     * - email_domain?: Domain of the email address (for email_otp)
     */
    LOGIN_ATTEMPTED: "auth_login_attempted",

    /**
     * Fired when login succeeds
     * Properties:
     * - auth_method: "email_otp" | "google_oauth"
     * - email_domain?: Domain of the email address (for email_otp)
     * - user_id: ID of the authenticated user
     */
    LOGIN_SUCCESS: "auth_login_success",

    /**
     * Fired when login fails
     * Properties:
     * - auth_method: "email_otp" | "google_oauth"
     * - email_domain?: Domain of the email address (for email_otp)
     * - error_type: Type of error
     * - error_message?: Error message
     */
    LOGIN_FAILED: "auth_login_failed",

    /**
     * Fired when OAuth redirect is initiated
     * Properties:
     * - auth_method: "google_oauth"
     * - provider: OAuth provider
     */
    OAUTH_REDIRECT_INITIATED: "auth_oauth_redirect_initiated",

    /**
     * Fired when unauthenticated user triggers login dialog
     * Properties:
     * - prompt_text: Text of the prompt that triggered dialog (if applicable)
     * - source: "unauthenticated_prompt_click" | "auth_guard" | "feature_access"
     */
    LOGIN_DIALOG_OPENED: "login_dialog_opened",
  },

  // ===== SEARCH EVENTS =====
  SEARCH: {
    /**
     * Fired when a search is attempted
     * Properties:
     * - query: Search query text
     * - query_length: Length of the query
     * - query_word_count: Number of words in query
     * - chat_id: ID of the chat session
     * - is_homepage?: Whether search was from homepage
     * - source: Where search was initiated from
     */
    ATTEMPTED: "search_attempted",

    /**
     * Fired when a search completes successfully
     * Properties:
     * - query: Search query text
     * - query_length: Length of the query
     * - query_word_count: Number of words in query
     * - profiles_found: Number of profiles returned
     * - ai_response_length: Length of AI response
     * - chat_id: ID of the chat session
     * - is_homepage?: Whether search was from homepage
     * - source: Where search was initiated from
     */
    COMPLETED: "search_completed",

    /**
     * Fired when a search fails
     * Properties:
     * - query: Search query text
     * - query_length: Length of the query
     * - query_word_count: Number of words in query
     * - error_code?: Error code from API
     * - error_message?: Error message
     * - chat_id: ID of the chat session
     * - is_homepage?: Whether search was from homepage
     * - source: Where search was initiated from
     */
    FAILED: "search_failed",

    /**
     * Fired when search is initiated from query parameter
     * Properties:
     * - query: Search query text
     * - query_length: Length of the query
     * - query_word_count: Number of words in query
     * - chat_id: ID of the chat session
     * - source: "query_parameter"
     */
    FROM_QUERY_PARAM: "search_from_query_param",

    /**
     * Fired when search page is visited
     * Properties:
     * - query: Search query text
     * - query_length: Length of the query
     * - query_word_count: Number of words in query
     * - is_authenticated: Whether user is logged in
     * - source: "search_page"
     */
    PAGE_VISITED: "search_page_visited",

    /**
     * Fired when unauthenticated user is redirected from search
     * Properties:
     * - query: Search query text
     * - intended_action: "search"
     * - source: Where redirect occurred from
     */
    UNAUTHENTICATED_REDIRECT: "search_unauthenticated_redirect",

    /**
     * Fired when search redirects to chat
     * Properties:
     * - query: Search query text
     * - query_length: Length of the query
     * - query_word_count: Number of words in query
     * - chat_id: ID of the created chat
     * - source: Where redirect was initiated from
     */
    REDIRECT_TO_CHAT: "search_redirect_to_chat",
  },

  // ===== PROFILE EVENTS =====
  PROFILE: {
    /**
     * Fired when a user's profile is viewed
     * Properties:
     * - profile_completion: Completion percentage
     * - is_onboarded: Whether user completed onboarding
     * - has_house: Whether user has selected a house
     * - has_additional_images: Whether user has additional images
     * - profile_text_length: Length of profile text
     * - source: Where profile was viewed from
     */
    VIEWED: "profile_viewed",

    /**
     * Fired when profile image is updated successfully
     * Properties:
     * - image_type: "profile_picture" | "additional_image" | "additional_image_replacement"
     * - profile_completion: Current completion percentage
     * - total_additional_images?: Total number of additional images
     * - source: Where update was initiated from
     */
    IMAGE_UPDATED: "profile_image_updated",

    /**
     * Fired when profile image upload is attempted
     * Properties:
     * - image_type: "profile_picture" | "additional_image"
     * - file_size: Size of uploaded file
     * - file_type: MIME type of uploaded file
     * - image_index?: Index for additional images
     * - source: Where upload was initiated from
     */
    IMAGE_UPLOAD_ATTEMPTED: "profile_image_upload_attempted",

    /**
     * Fired when profile image upload fails
     * Properties:
     * - image_type: "profile_picture" | "additional_image" | "additional_image_replacement"
     * - error_type: "upload_failed" | "upload_error"
     * - image_index?: Index for additional images
     * - source: Where upload was initiated from
     */
    IMAGE_UPDATE_FAILED: "profile_image_update_failed",

    /**
     * Fired when profile completion percentage increases
     * Properties:
     * - previous_completion: Previous completion percentage
     * - new_completion: New completion percentage
     * - completion_increase: Amount of increase
     * - total_messages: Number of messages in profile chat
     * - source: "profile_chat"
     */
    COMPLETION_INCREASED: "profile_completion_increased",

    /**
     * Fired when profile completion milestone is reached
     * Properties:
     * - milestone: Milestone reached (25, 50, 75, 100)
     * - total_messages: Number of messages in profile chat
     * - source: "profile_chat"
     */
    COMPLETION_MILESTONE: "profile_completion_milestone",
  },

  // ===== PROFILE CHAT EVENTS =====
  PROFILE_CHAT: {
    /**
     * Fired when profile chat is started
     * Properties:
     * - chat_id: ID of the chat
     * - source: "profile_chat"
     * - trigger: "initial_message"
     */
    STARTED: "profile_chat_started",

    /**
     * Fired when user sends a message in profile chat
     * Properties:
     * - message_length: Length of the message
     * - message_word_count: Number of words in message
     * - total_messages: Total messages in conversation
     * - chat_id: ID of the chat
     * - source: "profile_chat"
     */
    MESSAGE_SENT: "profile_chat_message_sent",

    /**
     * Fired when profile generation starts
     * Properties:
     * - total_messages: Total messages in conversation
     * - chat_id: ID of the chat
     * - source: "profile_chat"
     */
    GENERATION_STARTED: "profile_generation_started",

    /**
     * Fired when profile generation completes
     * Properties:
     * - total_messages: Total messages in conversation
     * - profile_text_length: Length of generated profile
     * - chat_id: ID of the chat
     * - source: "profile_chat"
     */
    GENERATION_COMPLETED: "profile_generation_completed",

    /**
     * Fired when profile generation fails
     * Properties:
     * - total_messages: Total messages in conversation
     * - chat_id: ID of the chat
     * - error_type: "generation_failed"
     * - source: "profile_chat"
     */
    GENERATION_FAILED: "profile_generation_failed",

    /**
     * Fired when confetti is triggered
     * Properties:
     * - total_messages: Total messages in conversation
     * - chat_id: ID of the chat
     * - source: "profile_chat"
     */
    CONFETTI_TRIGGERED: "profile_confetti_triggered",
  },

  // ===== LETTER/MESSAGING EVENTS =====
  LETTERS: {
    /**
     * Fired when letter modal is opened
     * Properties:
     * - receiver_id: ID of message recipient
     * - receiver_name: Name of message recipient
     * - source: Where modal was opened from
     */
    MODAL_OPENED: "letter_modal_opened",

    /**
     * Fired when letter send is attempted
     * Properties:
     * - receiver_id: ID of message recipient
     * - receiver_name: Name of message recipient
     * - message_length: Length of the message
     * - message_word_count: Number of words in message
     * - source: Where send was attempted from
     * - conversation_duration?: Time spent in conversation (for conversation_view)
     */
    SEND_ATTEMPTED: "letter_send_attempted",

    /**
     * Fired when letter is sent successfully
     * Properties:
     * - receiver_id: ID of message recipient
     * - receiver_name: Name of message recipient
     * - message_length: Length of the message
     * - message_word_count: Number of words in message
     * - source: Where send was completed from
     * - conversation_duration?: Time spent in conversation (for conversation_view)
     */
    SENT: "letter_sent",

    /**
     * Fired when letter send fails
     * Properties:
     * - receiver_id: ID of message recipient
     * - receiver_name: Name of message recipient
     * - message_length: Length of the message
     * - error_type: "api_error"
     * - source: Where send failed from
     */
    SEND_FAILED: "letter_send_failed",
  },

  // ===== CONVERSATION EVENTS =====
  CONVERSATIONS: {
    /**
     * Fired when a conversation is viewed
     * Properties:
     * - partner_id: ID of conversation partner
     * - partner_name: Name of conversation partner
     * - total_messages: Total messages in conversation
     * - conversation_exists: Whether conversation has messages
     */
    VIEWED: "conversation_viewed",

    /**
     * Fired when profile is opened from conversation header
     * Properties:
     * - partner_id: ID of conversation partner
     * - partner_name: Name of conversation partner
     * - source: "conversation_header"
     */
    PROFILE_OPENED: "conversation_profile_opened",
  },

  // ===== ONBOARDING EVENTS =====
  ONBOARDING: {
    /**
     * Fired when onboarding is started
     * Properties:
     * - trigger: How onboarding was initiated
     * - user_has_profile: Whether user already has a profile
     */
    STARTED: "onboarding_started",

    /**
     * Fired when onboarding step is reached
     * Properties:
     * - step: Current step name
     * - previous_step: Previous step name
     * - total_messages: Total messages in onboarding
     * - time_in_previous_step?: Time spent in previous step
     */
    STEP_REACHED: "onboarding_step_reached",

    /**
     * Fired when user sends message in onboarding
     * Properties:
     * - current_step: Current onboarding step
     * - message_length: Length of the message
     * - message_number: Sequential message number
     */
    USER_MESSAGE: "onboarding_user_message",

    /**
     * Fired when data is extracted from onboarding
     * Properties:
     * - extracted_name: Whether name was extracted
     * - extracted_location: Whether location was extracted
     * - extracted_story: Whether story was present
     * - current_step: Current onboarding step
     */
    DATA_EXTRACTED: "onboarding_data_extracted",

    /**
     * Fired when onboarding profile generation starts
     * Properties:
     * - final_step: Final step reached
     * - total_messages: Total messages in onboarding
     */
    PROFILE_GENERATION_STARTED: "onboarding_profile_generation_started",

    /**
     * Fired when onboarding is completed
     * Properties:
     * - total_messages: Total messages in onboarding
     * - completion_time: Time taken to complete
     */
    COMPLETED: "onboarding_completed",
  },

  // ===== HOMEPAGE EVENTS =====
  HOMEPAGE: {
    /**
     * Fired when homepage is viewed
     * Properties:
     * - is_authenticated: Whether user is logged in
     * - source: "main_presentation"
     */
    VIEWED: "homepage_viewed",

    /**
     * Fired when prompt box is clicked
     * Properties:
     * - prompt_text: Text of the clicked prompt
     * - prompt_length: Length of the prompt
     * - is_authenticated: Whether user is logged in
     * - source: "homepage_marquee"
     */
    PROMPT_CLICKED: "homepage_prompt_clicked",

    /**
     * Fired when unauthenticated user is redirected to login
     * Properties:
     * - prompt_text: Text of the prompt that triggered redirect
     * - source: "unauthenticated_prompt_click"
     */
    REDIRECT_TO_LOGIN: "homepage_redirect_to_login",

    /**
     * Fired when chat creation starts from homepage
     * Properties:
     * - prompt_text: Text of the prompt
     * - prompt_length: Length of the prompt
     * - source: "homepage_prompt"
     */
    CHAT_CREATION_STARTED: "homepage_chat_creation_started",
  },
} as const;

// Export individual event categories for easier imports
export const {
  UPGRADE_MODAL,
  AUTH,
  SEARCH,
  PROFILE,
  PROFILE_CHAT,
  LETTERS,
  CONVERSATIONS,
  ONBOARDING,
  HOMEPAGE,
} = ANALYTICS_EVENTS;
