
import type {
  AssignMessageRoleInput,
  BulkUpdateMessageChannelsInput,
  CreateMessageAttachmentUploadInput,
  CreateMessageChannelInput,
  CreateMessageCustomEmojiInput,
  CreateMessageCustomEmojiResult,
  CreateMessageDmInput,
  CreateMessageFacilityChannelInput,
  CreateMessageInput,
  CreateMessageReminderInput,
  CreateMessageScheduledInput,
  ListMessageAttachmentsQuery,
  ListMessageChannelsQuery,
  ListMessageRemindersQuery,
  ListMessageThreadsQuery,
  ListMessagesQuery,
  MessageActiveDays,
  MessageAttachment,
  MessageAttachmentDownloadQuery,
  MessageAttachmentDownloadUrl,
  MessageAttachmentListItem,
  MessageAttachmentText,
  MessageAttachmentUploadTicket,
  MessageAuthorListItem,
  MessageBulkChannelResult,
  MessageChannel,
  MessageChannelMember,
  MessageChannelNicknameResult,
  MessageChannelNotifyLevelResult,
  MessageCustomEmoji,
  MessageCustomEmojiListItem,
  MessageDirectoryUser,
  MessageMentionTarget,
  MessageMessage,
  MessageMessageRow,
  MessageMutedUser,
  MessageNotification,
  MessagePermissionContext,
  MessagePersonPhoto,
  MessagePhotoTicket,
  MessagePin,
  MessageReminder,
  MessageReminderListItem,
  MessageRoleAssignment,
  MessageRolesView,
  MessageScheduledMessage,
  MessageThreadFollow,
  MessageThreadListItem,
  MessageTypingInput,
  MessageUnreadSummary,
  MessageUserPrefs,
  SearchMessagesQuery,
  SetMessageChannelNicknameInput,
  SetMessageChannelNotifyLevelInput,
  UpdateMessageChannelInput,
  UpdateMessageInput,
  UpdateMessageUserPrefsInput,
} from "../types.js";
import { pathParam } from "../path-param.js";
import { buildQueryString } from "../serialize.js";
import type { SdkTransport } from "../transport.js";

export function createMessageNamespace(tx: SdkTransport) {
  return {
    /** チャンネル（公開 / 非公開 / DM / グループ DM / 施設） */
    channels: {
      /** 可視集合 V + 未読件数・お気に入り・参加状態 GET /message/channels */
      list: (params?: ListMessageChannelsQuery) =>
        tx.request<MessageChannel[]>("GET", `/message/channels${buildQueryString(params)}`),
      /** 1 件（一覧の 1 行と同じ形。見えないチャンネルは 404）GET /message/channels/:id */
      get: (id: string) => tx.request<MessageChannel>("GET", `/message/channels/${pathParam(id, "id")}`),
      /** 作成（公開 / 非公開）POST /message/channels */
      create: (input: CreateMessageChannelInput) =>
        tx.request<MessageChannel>("POST", "/message/channels", input),
      /** DM / グループ DM の get-or-create POST /message/channels/dm */
      createDm: (input: CreateMessageDmInput) =>
        tx.request<MessageChannel>("POST", "/message/channels/dm", input),
      /** 施設チャンネルの get-or-create（console 柱アクセス限定）POST /message/channels/facility */
      createFacility: (input: CreateMessageFacilityChannelInput) =>
        tx.request<MessageChannel>("POST", "/message/channels/facility", input),
      /** 更新（作成者 or console 柱アクセス）PATCH /message/channels/:id */
      update: (id: string, input: UpdateMessageChannelInput) =>
        tx.request<MessageChannel>("PATCH", `/message/channels/${pathParam(id, "id")}`, input),
      /** アーカイブ PATCH /message/channels/:id/archive */
      archive: (id: string) =>
        tx.request<MessageChannel>("PATCH", `/message/channels/${pathParam(id, "id")}/archive`, {}),
      /** アーカイブの解除（作成者 or console 柱アクセス）PATCH /message/channels/:id/unarchive */
      unarchive: (id: string) =>
        tx.request<MessageChannel>("PATCH", `/message/channels/${pathParam(id, "id")}/unarchive`, {}),
      /** 削除（`message:delete` + console 柱アクセス）DELETE /message/channels/:id */
      delete: (id: string) => tx.request<null>("DELETE", `/message/channels/${pathParam(id, "id")}`),
      members: {
        /** 参加者 GET /message/channels/:channelId/members */
        list: (channelId: string) =>
          tx.request<MessageChannelMember[]>("GET", `/message/channels/${pathParam(channelId, "channelId")}/members`),
        /** 参加（userId 省略で自己参加。DM / 施設チャンネルは不可）POST /message/channels/:channelId/members */
        add: (channelId: string, userId?: string) =>
          tx.request<null>("POST", `/message/channels/${pathParam(channelId, "channelId")}/members`, userId ? { userId } : {}),
        /** 退出 / 除外 DELETE /message/channels/:channelId/members/:userId */
        remove: (channelId: string, userId: string) =>
          tx.request<null>("DELETE", `/message/channels/${pathParam(channelId, "channelId")}/members/${pathParam(userId, "userId")}`),
      },
      /** お気に入り POST /message/channels/:id/favorite */
      favorite: (id: string) =>
        tx.request<null>("POST", `/message/channels/${pathParam(id, "id")}/favorite`, {}),
      /** お気に入り解除 DELETE /message/channels/:id/favorite */
      unfavorite: (id: string) =>
        tx.request<null>("DELETE", `/message/channels/${pathParam(id, "id")}/favorite`),
      /** このチャンネルの自分の通知の段（all / direct / none）PUT /message/channels/:id/notify-level */
      setNotifyLevel: (id: string, input: SetMessageChannelNotifyLevelInput) =>
        tx.request<MessageChannelNotifyLevelResult>("PUT", `/message/channels/${pathParam(id, "id")}/notify-level`, input),
      /** 全チャンネルの設定を一括で変える（Piazza の管理者だけ）POST /message/channels/bulk */
      bulkUpdate: (input: BulkUpdateMessageChannelsInput) =>
        tx.request<MessageBulkChannelResult>("POST", "/message/channels/bulk", input),
      /** グループ DM に自分だけの呼び名を付ける・外す（nickname: null）PUT /message/channels/:id/nickname */
      setNickname: (id: string, input: SetMessageChannelNicknameInput) =>
        tx.request<MessageChannelNicknameResult>("PUT", `/message/channels/${pathParam(id, "id")}/nickname`, input),
    },
    /** 投稿（スレッドは parentId） */
    messages: {
      /** 投稿一覧（parentId でスレッド）GET /message/channels/:channelId/messages */
      list: (channelId: string, params?: ListMessagesQuery) =>
        tx.request<MessageMessage[]>("GET", `/message/channels/${pathParam(channelId, "channelId")}/messages${buildQueryString(params)}`),
      /** 1 件 GET /message/messages/:id */
      get: (id: string) => tx.request<MessageMessage>("GET", `/message/messages/${pathParam(id, "id")}`),
      /** 投稿 POST /message/channels/:channelId/messages */
      create: (channelId: string, input: CreateMessageInput) =>
        tx.request<MessageMessageRow>("POST", `/message/channels/${pathParam(channelId, "channelId")}/messages`, input),
      /** 編集（本人のみ）PATCH /message/messages/:id */
      update: (id: string, input: UpdateMessageInput) =>
        tx.request<MessageMessageRow>("PATCH", `/message/messages/${pathParam(id, "id")}`, input),
      /** 論理削除（本人は `message:write`・他人の投稿は `message:delete` + console 柱アクセス）DELETE /message/messages/:id */
      delete: (id: string) =>
        tx.request<MessageMessageRow>("DELETE", `/message/messages/${pathParam(id, "id")}`),
      /** 既読カーソル更新（at 省略で現在時刻。今より先の時刻は今で止める）POST /message/channels/:channelId/read */
      markRead: (channelId: string, at?: string) =>
        tx.request<null>("POST", `/message/channels/${pathParam(channelId, "channelId")}/read`, at ? { at } : {}),
      /** スレッド既読 POST /message/messages/:id/thread-read */
      markThreadRead: (id: string) =>
        tx.request<null>("POST", `/message/messages/${pathParam(id, "id")}/thread-read`, {}),
      /** 「入力中」の合図（3 秒に 1 回まで・DB に書かない。parentId でスレッド・stopped で取り下げ）POST /message/channels/:channelId/typing */
      typing: (channelId: string, input?: MessageTypingInput) =>
        tx.request<null>("POST", `/message/channels/${pathParam(channelId, "channelId")}/typing`, input ?? {}),
      /** ここから未読にする（既読の位置を投稿の直前へ戻す）POST /message/messages/:id/unread */
      markUnread: (id: string) =>
        tx.request<null>("POST", `/message/messages/${pathParam(id, "id")}/unread`, {}),
      /** 検索（空白区切りの語のどれかを含む投稿・当たった語の多い順。可視集合 V の中だけ）GET /message/search */
      search: (params: SearchMessagesQuery) =>
        tx.request<MessageMessage[]>("GET", `/message/search${buildQueryString(params)}`),
    },
    /** リアクション */
    reactions: {
      /** リアクション POST /message/messages/:id/reactions */
      add: (messageId: string, emoji: string) =>
        tx.request<null>("POST", `/message/messages/${pathParam(messageId, "messageId")}/reactions`, { emoji }),
      /** リアクション解除 DELETE /message/messages/:id/reactions/:emoji */
      remove: (messageId: string, emoji: string) =>
        tx.request<null>("DELETE", `/message/messages/${pathParam(messageId, "messageId")}/reactions/${pathParam(emoji, "emoji")}`),
    },
    /** 添付（presigned PUT → complete → 投稿に紐付け） */
    attachments: {
      /** 可視チャンネルで共有された添付の一覧 GET /message/attachments */
      list: (params?: ListMessageAttachmentsQuery) =>
        tx.request<MessageAttachmentListItem[]>("GET", `/message/attachments${buildQueryString(params)}`),
      /** presigned PUT の発行（pending 行を先に作る）POST /message/channels/:channelId/attachments */
      requestUpload: (channelId: string, input: CreateMessageAttachmentUploadInput) =>
        tx.request<MessageAttachmentUploadTicket>("POST", `/message/channels/${pathParam(channelId, "channelId")}/attachments`, input),
      /** アップロード完了（実体・サイズ・magic bytes を検証して ready へ）POST /message/attachments/:id/complete */
      complete: (id: string) =>
        tx.request<MessageAttachment>("POST", `/message/attachments/${pathParam(id, "id")}/complete`, {}),
      /** presigned GET（有効 300 秒。可視集合 V 経由でのみ発行）。disposition=inline で画面内表示用（画像・PDF・動画・音声だけ）GET /message/attachments/:id/url */
      getUrl: (id: string, params?: MessageAttachmentDownloadQuery) =>
        tx.request<MessageAttachmentDownloadUrl>("GET", `/message/attachments/${pathParam(id, "id")}/url${buildQueryString(params)}`),
      /** テキスト・CSV の中身を文字として返す（先頭 256KB まで）GET /message/attachments/:id/text */
      getText: (id: string) =>
        tx.request<MessageAttachmentText>("GET", `/message/attachments/${pathParam(id, "id")}/text`),
    },
    /** 投稿者（検索の絞り込み候補） */
    authors: {
      /** 検索の投稿者絞り込み候補 GET /message/authors */
      list: () => tx.request<MessageAuthorListItem[]>("GET", "/message/authors"),
    },
    /** 職員ディレクトリ（招待・DM の宛先候補） */
    directory: {
      /** 招待・DM の宛先候補（同じ組織の在籍中の職員）GET /message/directory */
      list: () => tx.request<MessageDirectoryUser[]>("GET", "/message/directory"),
    },
    /** 同じ組織の人の顔写真（版の一覧と 1 枚の署名 URL） */
    people: {
      /** 写真のある人の写真の版（アーカイブ・ルートアカウントは出ない）GET /message/people/photos */
      photos: () => tx.request<MessagePersonPhoto[]>("GET", "/message/people/photos"),
      /** 1 人の顔写真の署名 URL（60 秒）GET /message/people/:userId/photo */
      photoUrl: (userId: string) =>
        tx.request<MessagePhotoTicket>("GET", `/message/people/${pathParam(userId, "userId")}/photo`),
    },
    /** スレッドのフォロー（親の投稿の ID。親の投稿者・返信した人は自動でフォロー扱い） */
    threadFollows: {
      /** スレッドを自分がフォローしているか GET /message/messages/:id/follow */
      get: (id: string) =>
        tx.request<MessageThreadFollow>("GET", `/message/messages/${pathParam(id, "id")}/follow`),
      /** スレッドをフォローする・やめる PUT /message/messages/:id/follow */
      set: (id: string, following: boolean) =>
        tx.request<MessageThreadFollow>("PUT", `/message/messages/${pathParam(id, "id")}/follow`, { following }),
    },
    /** 人のミュート（その人が起こした通知を自分には出さない） */
    mutes: {
      /** 自分がミュートしている人 GET /message/mutes */
      list: () => tx.request<MessageMutedUser[]>("GET", "/message/mutes"),
      /** ある人をミュートする（冪等）PUT /message/mutes/:userId */
      add: (userId: string) =>
        tx.request<{ userId: string }>("PUT", `/message/mutes/${pathParam(userId, "userId")}`, {}),
      /** ミュートを外す（冪等）DELETE /message/mutes/:userId */
      remove: (userId: string) =>
        tx.request<{ userId: string }>("DELETE", `/message/mutes/${pathParam(userId, "userId")}`),
    },
    /** その月に投稿のある日（日付へ移動のカレンダー） */
    activeDays: {
      /** その月に投稿のある日（JST）GET /message/channels/:channelId/active-days?month=YYYY-MM */
      list: (channelId: string, month: string) =>
        tx.request<MessageActiveDays>("GET", `/message/channels/${pathParam(channelId, "channelId")}/active-days${buildQueryString({ month })}`),
    },
    /** メンションの宛先（@ で所属の全員に知らせるグループ・事業所） */
    mentionTargets: {
      /** @ の候補にできるユーザーグループと事業所 GET /message/mention-targets */
      list: () => tx.request<MessageMentionTarget[]>("GET", "/message/mention-targets"),
    },
    /** 自分が関わるスレッド */
    threads: {
      /** 自分が関わるスレッド（未読フラグ付き）GET /message/threads */
      list: (params?: ListMessageThreadsQuery) =>
        tx.request<MessageThreadListItem[]>("GET", `/message/threads${buildQueryString(params)}`),
    },
    /** アクティビティ（メンション・返信・リアクション・DM） */
    activity: {
      /** アクティビティ GET /message/activity */
      list: () => tx.request<MessageNotification[]>("GET", "/message/activity"),
      /** 既読 PATCH /message/activity/:id/read */
      markRead: (id: string) =>
        tx.request<null>("PATCH", `/message/activity/${pathParam(id, "id")}/read`, {}),
      /** 全件既読 PATCH /message/activity/read-all */
      markAllRead: () => tx.request<null>("PATCH", "/message/activity/read-all", {}),
      /** 未読のまとめ（未読のアクティビティ・未読のある DM とチャンネルの数）GET /message/unread-summary */
      unreadSummary: () => tx.request<MessageUnreadSummary>("GET", "/message/unread-summary"),
    },
    /** ピン留め */
    pins: {
      /** ピン留め一覧 GET /message/channels/:channelId/pins */
      list: (channelId: string) =>
        tx.request<MessagePin[]>("GET", `/message/channels/${pathParam(channelId, "channelId")}/pins`),
      /** ピン留め POST /message/messages/:id/pin */
      add: (messageId: string) =>
        tx.request<null>("POST", `/message/messages/${pathParam(messageId, "messageId")}/pin`, {}),
      /** ピン解除 DELETE /message/messages/:id/pin */
      remove: (messageId: string) =>
        tx.request<null>("DELETE", `/message/messages/${pathParam(messageId, "messageId")}/pin`),
    },
    /** 予約送信 */
    scheduled: {
      /** 自分の未送信予約 GET /message/scheduled */
      list: () => tx.request<MessageScheduledMessage[]>("GET", "/message/scheduled"),
      /** 予約送信 POST /message/channels/:channelId/scheduled */
      create: (channelId: string, input: CreateMessageScheduledInput) =>
        tx.request<MessageScheduledMessage>("POST", `/message/channels/${pathParam(channelId, "channelId")}/scheduled`, input),
      /** 取消（本人のみ・送信済みは不可）DELETE /message/scheduled/:id */
      cancel: (id: string) => tx.request<null>("DELETE", `/message/scheduled/${pathParam(id, "id")}`),
    },
    /** リマインダー */
    reminders: {
      /** リマインダー（既定は未完了のみ・status=open|done|all）GET /message/reminders */
      list: (params?: ListMessageRemindersQuery) =>
        tx.request<MessageReminderListItem[]>("GET", `/message/reminders${buildQueryString(params)}`),
      /** 作成（messageId か note のいずれか必須）POST /message/reminders */
      create: (input: CreateMessageReminderInput) =>
        tx.request<MessageReminder>("POST", "/message/reminders", input),
      /** 完了 PATCH /message/reminders/:id/done */
      done: (id: string) =>
        tx.request<MessageReminder>("PATCH", `/message/reminders/${pathParam(id, "id")}/done`, {}),
      /** 削除（本人のみ）DELETE /message/reminders/:id */
      delete: (id: string) => tx.request<null>("DELETE", `/message/reminders/${pathParam(id, "id")}`),
    },
    /** カスタム絵文字 */
    emoji: {
      /** カスタム絵文字（画像の署名つき URL つき）GET /message/emoji */
      list: () => tx.request<MessageCustomEmojiListItem[]>("GET", "/message/emoji"),
      /** 登録（upload_url へ PUT したのち complete）POST /message/emoji */
      create: (input: CreateMessageCustomEmojiInput) =>
        tx.request<CreateMessageCustomEmojiResult>("POST", "/message/emoji", input),
      /** アップロード完了確認 POST /message/emoji/:id/complete */
      complete: (id: string) =>
        tx.request<MessageCustomEmoji>("POST", `/message/emoji/${pathParam(id, "id")}/complete`, {}),
      /** 削除（`message:delete` + console 柱アクセス）DELETE /message/emoji/:id */
      delete: (id: string) => tx.request<null>("DELETE", `/message/emoji/${pathParam(id, "id")}`),
    },
    /** 個人設定（アクティビティの出し分け） */
    prefs: {
      /** 自分の設定（アクティビティの出し分け・ステータス・push と止める時間帯）GET /message/prefs */
      get: () => tx.request<MessageUserPrefs>("GET", "/message/prefs"),
      /** 自分の設定の更新 PATCH /message/prefs */
      update: (input: UpdateMessageUserPrefsInput) =>
        tx.request<MessageUserPrefs>("PATCH", "/message/prefs", input),
    },
    /** 権限の材料（画面の出し分け用。規則は @qaito/modules/message/permissions） */
    permissions: {
      /** 画面の出し分けに使う権限の材料（自分のこと）GET /message/permission-context */
      context: () => tx.request<MessagePermissionContext>("GET", "/message/permission-context"),
    },
    /** Piazza の役（管理者・モデレーター）の割り当て。Piazza の管理者だけが使える */
    roles: {
      /** Piazza の役の一覧（割り当て・常に管理者の人・追加の候補。Piazza の管理者だけ）GET /message/roles */
      list: () => tx.request<MessageRolesView>("GET", "/message/roles"),
      /** 人かグループに役を付ける（同じ相手は付け替え。Piazza の管理者だけ）POST /message/roles */
      assign: (input: AssignMessageRoleInput) =>
        tx.request<MessageRoleAssignment>("POST", "/message/roles", input),
      /** 役の割り当てを外す（Piazza の管理者だけ）DELETE /message/roles/:id */
      unassign: (id: string) => tx.request<{ id: string }>("DELETE", `/message/roles/${pathParam(id, "id")}`),
    },
  };
}
