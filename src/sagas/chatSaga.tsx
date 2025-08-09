import { eventChannel } from "redux-saga";
import {
  call,
  put,
  take,
  takeLatest,
  cancelled,
  select,
  // fork,
} from "redux-saga/effects";
import * as actions from "../redux/actions/chat";
import { ChatClient } from "../websocket/client";
import { SagaIterator } from "redux-saga";
import invokeApi from "../api/invokeApi";
import apiConstant from "../api/constants";
import { ApiResponse, Conversation } from "../types/types";
import { createChatClient } from "../websocket/clientManager";

function createChatChannel(chatClient: ChatClient) {
  return eventChannel((emit) => {
    // eslint-disable-next-line no-debugger
    debugger;
    chatClient.on("connected", () => emit(actions.chatConnected()));
    chatClient.on("disconnected", () => emit(actions.chatDisconnected()));

    // Add more listeners here (e.g., new_message) and dispatch actions accordingly
    chatClient.on("new_message", (message) =>
      emit({ type: "chat/receivedMessage", payload: message })
    );

    chatClient.on("presence_update", (data) => {
      console.log("Presence event received: ", data);
      emit(actions.updateUserPresence(data));
    });
    // chatClient.on("presence_update", (data) => {
    //   // eslint-disable-next-line no-debugger
    //   debugger;
    //   emit(actions.updateUserPresence(data));
    // });

    return () => {
      chatClient.disconnect();
    };
  });
}

function* handleConnect({
  payload,
}: ReturnType<typeof actions.connectChat>): SagaIterator {
  const { token } = payload;
  const chatClient = createChatClient(token);
  // const chatClient = new ChatClient(serverUrl, token);

  // yield put(actions.setChatClient(chatClient)); // ✅ this persists client in redux
  const channel = yield call(createChatChannel, chatClient);
  chatClient.connect();

  // eslint-disable-next-line no-debugger
  debugger; // Debug here early to see saga flow

  try {
    while (true) {
      const action = yield take(channel);
      yield put(action);
    }
  } finally {
    if (yield cancelled()) {
      chatClient.disconnect();
    }
  }
}

function* sendMessageSaga({ payload }: ReturnType<typeof actions.sendMessage>) {
  const client: ChatClient | null = yield select((state) => state.chat.client);
  if (client?.isConnected()) {
    client.sendMessage(payload.conversationId, payload.content);
  }
}

function* sendTypingSaga({
  payload,
}: ReturnType<typeof actions.sendTypingIndicator>) {
  const client: ChatClient | null = yield select((state) => state.chat.client);
  client?.sendTypingIndicator(payload.conversationId, payload.isTyping);
}

function* sendReadReceiptSaga({
  payload,
}: ReturnType<typeof actions.sendReadReceipt>) {
  const client: ChatClient | null = yield select((state) => state.chat.client);
  client?.sendReadReceipt(payload.messageId);
}

function* getUserConversationsSaga() {
  try {
    const response = (yield invokeApi(
      apiConstant.GET_USER_CONVERSATIONS
    )) as ApiResponse;
    if (response && response.data) {
      // console.log(response.data);
      yield put(actions.setUserConversations(response.data as Conversation[]));
      if (response.data.conversations.length > 0) {
        // console.log(">>>", response.data.conversations[0]._id);
        function mapConversationsToChatList(
          conversations: Conversation[],
          currentUserId: string
        ): ChatListItem[] {
          return conversations?.map((conversation) => {
            const otherParticipant = conversation.participantDetails.find(
              (participant) =>
                participant._id.toString() !== currentUserId.toString()
            );

            const participantStatus = conversation.participantStatus?.[
              otherParticipant?._id.toString()
            ] || {
              isOnline: false,
              lastSeen: "",
            };
            // console.log("other>>", otherParticipant, conversation);
            return {
              id: conversation._id,
              name: `${otherParticipant?.firstName || "Unknown"} ${
                otherParticipant?.lastName || ""
              }`,
              avatar: otherParticipant?.avatar || "",
              isOnline: participantStatus.isOnline,
              lastSeen: participantStatus.lastSeen,
              lastMessage: conversation.lastMessage,
              unreadCount: conversation.unreadCount,
              isGroup: conversation.type !== "direct",
            };
          });
        }
        const currentUserId = localStorage.getItem("userId"); // Ankit
        const chatList = mapConversationsToChatList(
          response.data.conversations,
          currentUserId
        );
        yield put(actions.setUserConversationsTest(chatList));
      }
    }
  } catch (e: unknown) {
    console.log(e);
  }
}

export function* chatSaga() {
  yield takeLatest(actions.connectChat, handleConnect);
  yield takeLatest(actions.sendMessage, sendMessageSaga);
  yield takeLatest(actions.sendTypingIndicator, sendTypingSaga);
  yield takeLatest(actions.sendReadReceipt, sendReadReceiptSaga);
  yield takeLatest(actions.getUserConversations, getUserConversationsSaga);
}
