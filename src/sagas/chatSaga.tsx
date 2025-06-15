import { eventChannel } from "redux-saga";
import {
  call,
  put,
  take,
  takeLatest,
  cancelled,
  select,
  fork,
} from "redux-saga/effects";
import * as actions from "../redux/actions/chat";
import { ChatClient } from "../websocket/client";
import { SagaIterator } from "redux-saga";

function createChatChannel(chatClient: ChatClient) {
  return eventChannel((emit) => {
    chatClient.on("connected", () => emit(actions.chatConnected()));
    chatClient.on("disconnected", () => emit(actions.chatDisconnected()));
    chatClient.on("presence", (p) => emit(actions.presence(p)));

    // Add more listeners here (e.g., new_message) and dispatch actions accordingly
    chatClient.on("new_message", (message) =>
      emit({ type: "chat/receivedMessage", payload: message })
    );

    return () => {
      chatClient.disconnect();
    };
  });
}

function* handleConnect({
  payload,
}: ReturnType<typeof actions.connectChat>): SagaIterator {
  const { serverUrl, token } = payload;
  const chatClient = new ChatClient(serverUrl, token);
  yield put(actions.setChatClient(chatClient)); // ✅ this persists client in redux
  const channel = yield call(createChatChannel, chatClient);
  chatClient.connect();

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

export function* reconnectIfPossible(): SagaIterator {
  const state = yield select((state) => state.chat);
  const token = localStorage.getItem("accessToken");
  const serverUrl = "ws://localhost:7800"; // Replace with env/config

  if (token && !state.isConnected) {
    yield put(actions.connectChat({ token, serverUrl }));
  }
}

export function* chatSaga() {
  yield fork(reconnectIfPossible);
  yield takeLatest(actions.connectChat, handleConnect);
  yield takeLatest(actions.sendMessage, sendMessageSaga);
  yield takeLatest(actions.sendTypingIndicator, sendTypingSaga);
  yield takeLatest(actions.sendReadReceipt, sendReadReceiptSaga);
}
