// Mock implementation for browser environment
export const HubRpcClient = {
  create: () => ({
    getCast: () => Promise.resolve(null),
    getCastsByFid: () => Promise.resolve({ messages: [] }),
    getReaction: () => Promise.resolve(null),
    getReactionsByFid: () => Promise.resolve({ messages: [] }),
    getUserData: () => Promise.resolve(null),
    getUserDataByFid: () => Promise.resolve({ messages: [] }),
  }),
};

export default {
  HubRpcClient,
}; 