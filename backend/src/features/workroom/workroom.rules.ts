import { ApiError } from '../../utils/api-error.js';

export function assertWorkroomChatIsActive(status: string): void {
  if (status !== 'ACTIVE') {
    throw new ApiError(409, 'CHAT_LOCKED', 'Chat is locked until escrow is verified.');
  }
}
