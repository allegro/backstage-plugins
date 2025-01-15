export interface SlackElement {
  type: string;
  user_id?: string;
  text?: string;
}
export interface SlackBlock {
  type: string;
  block_id: string;
  elements: { type: string; elements?: SlackElement[] }[];
}
export interface SlackEvent {
  user: string;
  type: string;
  ts: string;
  client_msg_id: string;
  text: string;
  team: string;
  thread_ts: string;
  parent_user_id: string;
  blocks: SlackBlock[];
  channel: string;
  event_ts: string;
}
export interface SlackAuthorization {
  enterprise_id: string | null;
  team_id: string;
  user_id: string;
  is_bot: boolean;
  is_enterprise_install: boolean;
}
export interface SlackEventData {
  token: string;
  team_id: string;
  api_app_id: string;
  event: SlackEvent;
  type: string;
  event_id: string;
  event_time: number;
  authorizations: SlackAuthorization[];
  is_ext_shared_channel: boolean;
  event_context: string;
}
